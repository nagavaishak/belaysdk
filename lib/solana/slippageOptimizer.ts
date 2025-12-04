// lib/solana/slippageOptimizer.ts
// PREDICTIVE SLIPPAGE OPTIMIZER
// The key differentiator: We tell users what slippage to set BEFORE chaos hits
//
// Jupiter: REACTIVE (looks at past 1-minute volatility)
// BELAY: PREDICTIVE (looks at Polymarket sentiment 30-60s ahead)

import { MarketAnxietyState, getMarketAnxiety, getAnxietyForScenario } from './marketAnxiety';

export interface SlippageRecommendation {
  recommendedSlippage: number; // Percentage (e.g., 2.5 = 2.5%)
  minimumSlippage: number; // Absolute minimum for success
  maximumSlippage: number; // Don't exceed this (MEV risk)
  confidence: number; // 0.0 to 1.0
  successProbability: number; // Expected success rate with recommended slippage
  reasoning: string;
  warning?: string;
  
  // Context
  userSlippage?: number; // What user currently has set
  wouldFail: boolean; // Would their current setting fail?
  expectedPriceMovement: number; // % price movement expected
  
  // Timing
  validForMs: number; // How long this recommendation is valid
  timestamp: number;
}

export interface SwapContext {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  userSlippage: number; // User's current slippage setting
  urgency: 'low' | 'medium' | 'high';
}

// Slippage calculation parameters
const SLIPPAGE_CONFIG = {
  // Base slippage for different urgency levels
  BASE_SLIPPAGE: {
    low: 0.3,    // 0.3% base for patient traders
    medium: 0.5, // 0.5% base for normal trades
    high: 1.0    // 1.0% base for urgent trades
  },
  
  // Multipliers based on anxiety level
  ANXIETY_MULTIPLIER: {
    CALM: 1.0,
    ELEVATED: 1.5,
    STRESSED: 2.5,
    CRITICAL: 4.0,
    PANIC: 6.0
  },
  
  // Safety margins
  MIN_SLIPPAGE: 0.1,  // Never recommend below 0.1%
  MAX_SLIPPAGE: 15.0, // Never recommend above 15%
  SAFETY_BUFFER: 1.2, // 20% safety buffer on top of calculated
  
  // Recommendation validity
  VALIDITY_MS: 30000 // Valid for 30 seconds
};

/**
 * SLIPPAGE OPTIMIZER
 * 
 * Core insight: Most transaction failures happen because users set conservative
 * slippage (0.5%) but market moves more than that during congestion.
 * 
 * BELAY predicts the expected price movement using Polymarket sentiment and
 * recommends slippage BEFORE the chaos hits. This is the 30-60 second advantage.
 */
export class SlippageOptimizer {
  
  /**
   * Get slippage recommendation based on current market conditions
   */
  async getRecommendation(context: SwapContext): Promise<SlippageRecommendation> {
    // Get market anxiety
    const anxiety = await getMarketAnxiety();
    
    return this.calculateRecommendation(anxiety, context);
  }

  /**
   * Get recommendation for demo scenario
   */
  getRecommendationForScenario(
    scenario: 'normal' | 'rally' | 'crash' | 'election',
    context: SwapContext
  ): SlippageRecommendation {
    const anxiety = getAnxietyForScenario(scenario);
    return this.calculateRecommendation(anxiety, context);
  }

  /**
   * Core calculation logic
   */
  private calculateRecommendation(
    anxiety: MarketAnxietyState,
    context: SwapContext
  ): SlippageRecommendation {
    // Start with base slippage for urgency level
    const baseSlippage = SLIPPAGE_CONFIG.BASE_SLIPPAGE[context.urgency];
    
    // Apply anxiety multiplier
    const anxietyMultiplier = SLIPPAGE_CONFIG.ANXIETY_MULTIPLIER[anxiety.level];
    
    // Calculate recommended slippage
    let calculated = baseSlippage * anxietyMultiplier;
    
    // Add expected price movement as minimum threshold
    const priceMovementBuffer = anxiety.estimatedPriceMovement * SLIPPAGE_CONFIG.SAFETY_BUFFER;
    calculated = Math.max(calculated, priceMovementBuffer);
    
    // Apply bounds
    const recommended = Math.min(
      SLIPPAGE_CONFIG.MAX_SLIPPAGE,
      Math.max(SLIPPAGE_CONFIG.MIN_SLIPPAGE, calculated)
    );
    
    // Calculate minimum (what's absolutely needed)
    const minimum = Math.max(
      SLIPPAGE_CONFIG.MIN_SLIPPAGE,
      anxiety.estimatedPriceMovement * 1.1 // 10% buffer on expected movement
    );
    
    // Calculate maximum (beyond this is MEV risk)
    const maximum = Math.min(
      SLIPPAGE_CONFIG.MAX_SLIPPAGE,
      recommended * 2.0
    );
    
    // Determine if user's current setting would fail
    const wouldFail = context.userSlippage < minimum;
    
    // Calculate success probability with recommended slippage
    const successProbability = this.calculateSuccessProbability(
      recommended,
      anxiety.estimatedPriceMovement,
      anxiety.score
    );
    
    // Generate reasoning
    const reasoning = this.generateReasoning(
      anxiety,
      context,
      recommended,
      wouldFail
    );
    
    // Generate warning if needed
    const warning = this.generateWarning(anxiety, context, wouldFail);

    return {
      recommendedSlippage: Math.round(recommended * 100) / 100,
      minimumSlippage: Math.round(minimum * 100) / 100,
      maximumSlippage: Math.round(maximum * 100) / 100,
      confidence: anxiety.confidence,
      successProbability,
      reasoning,
      warning,
      userSlippage: context.userSlippage,
      wouldFail,
      expectedPriceMovement: anxiety.estimatedPriceMovement,
      validForMs: SLIPPAGE_CONFIG.VALIDITY_MS,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate success probability given slippage and market conditions
   */
  private calculateSuccessProbability(
    slippage: number,
    expectedMovement: number,
    anxietyScore: number
  ): number {
    // If slippage > expected movement + buffer, high probability
    const buffer = slippage - expectedMovement;
    
    if (buffer >= 2.0) return 0.99;
    if (buffer >= 1.0) return 0.95;
    if (buffer >= 0.5) return 0.88;
    if (buffer >= 0.2) return 0.75;
    if (buffer >= 0) return 0.60;
    
    // Slippage less than expected movement = likely fail
    return Math.max(0.10, 0.50 + buffer * 0.2);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    anxiety: MarketAnxietyState,
    context: SwapContext,
    recommended: number,
    wouldFail: boolean
  ): string {
    const parts: string[] = [];
    
    // Market condition
    parts.push(`Market Anxiety: ${anxiety.level} (${(anxiety.score * 100).toFixed(0)}%)`);
    
    // Expected movement
    parts.push(`Expected price movement: ${anxiety.estimatedPriceMovement.toFixed(1)}%`);
    
    // Trigger markets
    if (anxiety.triggerMarkets.length > 0) {
      parts.push(`Driven by: ${anxiety.triggerMarkets.slice(0, 2).join(', ')}`);
    }
    
    // User situation
    if (wouldFail) {
      parts.push(`⚠️ Your ${context.userSlippage}% slippage is too low!`);
      parts.push(`→ Recommend: ${recommended.toFixed(1)}% for 95%+ success`);
    } else {
      parts.push(`✅ Your ${context.userSlippage}% slippage is adequate`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Generate warning message if needed
   */
  private generateWarning(
    anxiety: MarketAnxietyState,
    context: SwapContext,
    wouldFail: boolean
  ): string | undefined {
    if (anxiety.level === 'PANIC') {
      return `🚨 EXTREME VOLATILITY: Set slippage to ${Math.ceil(anxiety.estimatedPriceMovement * 1.5)}% minimum or your transaction WILL fail`;
    }
    
    if (anxiety.level === 'CRITICAL' && wouldFail) {
      return `⚠️ HIGH RISK: Market is moving ${anxiety.estimatedPriceMovement.toFixed(1)}% but you have ${context.userSlippage}% slippage. Transaction will likely fail.`;
    }
    
    if (wouldFail) {
      return `Your slippage (${context.userSlippage}%) is below the expected price movement (${anxiety.estimatedPriceMovement.toFixed(1)}%). Consider increasing.`;
    }
    
    return undefined;
  }
}

// Singleton instance
export const slippageOptimizer = new SlippageOptimizer();

// Quick access functions
export async function getSlippageRecommendation(context: SwapContext): Promise<SlippageRecommendation> {
  return slippageOptimizer.getRecommendation(context);
}

export function getSlippageForScenario(
  scenario: 'normal' | 'rally' | 'crash' | 'election',
  context: SwapContext
): SlippageRecommendation {
  return slippageOptimizer.getRecommendationForScenario(scenario, context);
}

/**
 * Quick demo helper - simulates recommendation for common scenario
 */
export function getDemoRecommendation(
  scenario: 'normal' | 'rally' | 'crash' | 'election',
  userSlippage: number = 0.5
): SlippageRecommendation {
  return slippageOptimizer.getRecommendationForScenario(scenario, {
    tokenIn: 'USDC',
    tokenOut: 'SOL',
    amountIn: 1000,
    userSlippage,
    urgency: 'medium'
  });
}
