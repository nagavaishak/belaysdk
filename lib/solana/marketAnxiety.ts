// lib/solana/marketAnxiety.ts
// MARKET ANXIETY INDEX - Professional-grade sentiment measurement
// Like VIX for crypto - measures trader fear/excitement across prediction markets

export type AnxietyLevel = 'CALM' | 'ELEVATED' | 'STRESSED' | 'CRITICAL' | 'PANIC';
export type RoutingMode = 'STANDARD' | 'ELEVATED' | 'DUAL_PATH' | 'JITO_ONLY';

export interface MarketAnxietyState {
  score: number; // 0.0 to 1.0
  level: AnxietyLevel;
  routingMode: RoutingMode;
  recommendation: string;
  estimatedPriceMovement: number; // Expected % move in next 60s
  confidence: number; // How confident we are in this prediction
  triggerMarkets: string[]; // Which markets are driving anxiety
  timestamp: number;
}

export interface PolymarketData {
  slug: string;
  volume24h: number;
  volumeChange: number; // % change from previous period
  spread: number;
  probability: number;
  priceChange: number; // Recent price movement
}

// Thresholds for anxiety levels
const ANXIETY_THRESHOLDS = {
  CALM: 0.25,
  ELEVATED: 0.50,
  STRESSED: 0.70,
  CRITICAL: 0.85,
  PANIC: 1.0
};

// Routing mode thresholds
const ROUTING_THRESHOLDS = {
  STANDARD: 0.40,    // Below 40% - normal RPC
  ELEVATED: 0.60,    // 40-60% - multi-RPC + faster retry
  DUAL_PATH: 0.80,   // 60-80% - SWQoS + Jito race
  JITO_ONLY: 1.0     // 80%+ - Jito bundle only (guaranteed)
};

// Markets that correlate with Solana network stress
const TRACKED_MARKETS = [
  'solana', 'sol-price', 'solana-price',
  'bitcoin', 'btc-price', 'bitcoin-price',
  'ethereum', 'eth-price',
  'fed-rate', 'federal-reserve', 'fomc',
  'election', 'trump', 'presidential',
  'crypto-market', 'crypto-crash'
];

/**
 * MARKET ANXIETY INDEX
 * 
 * Monitors Polymarket to detect incoming network congestion
 * BEFORE it shows up on-chain. This is the key differentiator:
 * 
 * - Jupiter: REACTIVE (looks at past 1-minute volatility)
 * - BELAY: PREDICTIVE (looks at Polymarket sentiment 30-60s ahead)
 */
export class MarketAnxietyIndex {
  private cache: MarketAnxietyState | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 10000; // 10 seconds

  /**
   * Get current market anxiety level
   */
  async getAnxiety(forceRefresh = false): Promise<MarketAnxietyState> {
    // Return cached if fresh
    if (!forceRefresh && this.cache && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const marketData = await this.fetchPolymarketData();
      const anxiety = this.calculateAnxiety(marketData);
      
      this.cache = anxiety;
      this.cacheTimestamp = Date.now();
      
      return anxiety;
    } catch (error) {
      console.warn('Market Anxiety fetch failed, using fallback:', error);
      return this.getFallbackState();
    }
  }

  /**
   * Get anxiety for demo scenarios
   */
  getAnxietyForScenario(scenario: 'normal' | 'rally' | 'crash' | 'election'): MarketAnxietyState {
    const scenarios: Record<string, MarketAnxietyState> = {
      normal: {
        score: 0.22,
        level: 'CALM',
        routingMode: 'STANDARD',
        recommendation: 'Standard routing. Market is calm.',
        estimatedPriceMovement: 0.3,
        confidence: 0.85,
        triggerMarkets: [],
        timestamp: Date.now()
      },
      rally: {
        score: 0.58,
        level: 'ELEVATED',
        routingMode: 'ELEVATED',
        recommendation: 'Increased activity detected. Using multi-RPC routing.',
        estimatedPriceMovement: 1.2,
        confidence: 0.78,
        triggerMarkets: ['SOL >$200', 'Crypto bull market'],
        timestamp: Date.now()
      },
      crash: {
        score: 0.82,
        level: 'CRITICAL',
        routingMode: 'DUAL_PATH',
        recommendation: 'High anxiety! Activating Dual-Path routing (SWQoS + Jito).',
        estimatedPriceMovement: 3.5,
        confidence: 0.72,
        triggerMarkets: ['BTC crash', 'Crypto market cap'],
        timestamp: Date.now()
      },
      election: {
        score: 0.94,
        level: 'PANIC',
        routingMode: 'JITO_ONLY',
        recommendation: 'PANIC MODE! Jito-only routing for guaranteed inclusion.',
        estimatedPriceMovement: 5.8,
        confidence: 0.91,
        triggerMarkets: ['US Presidential Election', 'Fed Rate Decision', 'SOL volatility'],
        timestamp: Date.now()
      }
    };

    return scenarios[scenario] || scenarios.normal;
  }

  /**
   * Fetch real data from Polymarket API
   */
  private async fetchPolymarketData(): Promise<PolymarketData[]> {
    const response = await fetch('https://clob.polymarket.com/markets', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const allMarkets: any[] = await response.json();
    
    // Filter to relevant markets
    const relevantMarkets = allMarkets.filter(market => {
      const slug = (market.slug || market.question || '').toLowerCase();
      return TRACKED_MARKETS.some(tracked => slug.includes(tracked));
    });

    return relevantMarkets.slice(0, 10).map(m => ({
      slug: m.slug || m.question || 'unknown',
      volume24h: m.volume24h || m.volume || 0,
      volumeChange: this.estimateVolumeChange(m),
      spread: m.spread || 0.02,
      probability: m.outcomePrices?.[0] || m.probability || 0.5,
      priceChange: this.estimatePriceChange(m)
    }));
  }

  /**
   * Calculate anxiety score from market data
   */
  private calculateAnxiety(markets: PolymarketData[]): MarketAnxietyState {
    if (markets.length === 0) {
      return this.getFallbackState();
    }

    // 1. Volume Velocity Score (40% weight)
    const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0);
    let volumeScore: number;
    if (totalVolume > 100_000_000) volumeScore = 1.0;
    else if (totalVolume > 50_000_000) volumeScore = 0.8;
    else if (totalVolume > 25_000_000) volumeScore = 0.6;
    else if (totalVolume > 10_000_000) volumeScore = 0.4;
    else volumeScore = 0.2;

    // 2. Price Movement Score (35% weight)
    const avgPriceChange = markets.reduce((sum, m) => sum + Math.abs(m.priceChange), 0) / markets.length;
    let priceScore: number;
    if (avgPriceChange > 0.15) priceScore = 1.0;
    else if (avgPriceChange > 0.10) priceScore = 0.8;
    else if (avgPriceChange > 0.05) priceScore = 0.5;
    else priceScore = 0.2;

    // 3. Spread Compression Score (25% weight) - tight spreads = high activity
    const avgSpread = markets.reduce((sum, m) => sum + m.spread, 0) / markets.length;
    let spreadScore: number;
    if (avgSpread < 0.01) spreadScore = 1.0;
    else if (avgSpread < 0.02) spreadScore = 0.7;
    else if (avgSpread < 0.05) spreadScore = 0.4;
    else spreadScore = 0.2;

    // Combined anxiety score
    const rawScore = (volumeScore * 0.40) + (priceScore * 0.35) + (spreadScore * 0.25);
    const score = Math.min(1.0, Math.max(0.0, rawScore));

    // Determine level
    const level = this.scoreToLevel(score);
    const routingMode = this.scoreToRoutingMode(score);
    const estimatedPriceMovement = this.estimateSolanaPriceMovement(score);

    // Identify trigger markets (top 3 by volume)
    const triggerMarkets = markets
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 3)
      .map(m => m.slug);

    return {
      score,
      level,
      routingMode,
      recommendation: this.generateRecommendation(level, routingMode, estimatedPriceMovement),
      estimatedPriceMovement,
      confidence: 0.70 + (markets.length * 0.02), // More markets = more confidence
      triggerMarkets,
      timestamp: Date.now()
    };
  }

  private scoreToLevel(score: number): AnxietyLevel {
    if (score >= ANXIETY_THRESHOLDS.CRITICAL) return 'PANIC';
    if (score >= ANXIETY_THRESHOLDS.STRESSED) return 'CRITICAL';
    if (score >= ANXIETY_THRESHOLDS.ELEVATED) return 'STRESSED';
    if (score >= ANXIETY_THRESHOLDS.CALM) return 'ELEVATED';
    return 'CALM';
  }

  private scoreToRoutingMode(score: number): RoutingMode {
    if (score >= ROUTING_THRESHOLDS.DUAL_PATH) return 'JITO_ONLY';
    if (score >= ROUTING_THRESHOLDS.ELEVATED) return 'DUAL_PATH';
    if (score >= ROUTING_THRESHOLDS.STANDARD) return 'ELEVATED';
    return 'STANDARD';
  }

  private estimateSolanaPriceMovement(anxiety: number): number {
    // Anxiety correlates with expected price movement
    // Based on historical patterns: high anxiety → high volatility
    return Math.round(anxiety * 6 * 10) / 10; // 0-6% range
  }

  private generateRecommendation(level: AnxietyLevel, mode: RoutingMode, movement: number): string {
    const recommendations: Record<AnxietyLevel, string> = {
      CALM: `Market calm. Standard routing sufficient. Expected movement: ${movement}%`,
      ELEVATED: `Elevated activity. Multi-RPC routing active. Expected movement: ${movement}%`,
      STRESSED: `High stress detected! Dual-Path routing (SWQoS + Jito). Expected movement: ${movement}%`,
      CRITICAL: `CRITICAL! Maximum protection active. Set slippage ≥${Math.ceil(movement)}%. Expected movement: ${movement}%`,
      PANIC: `🚨 PANIC MODE! Jito-only routing. Set slippage ≥${Math.ceil(movement * 1.2)}%. Expected movement: ${movement}%`
    };
    return recommendations[level];
  }

  private estimateVolumeChange(market: any): number {
    // Estimate based on available data
    return Math.random() * 0.5; // Placeholder
  }

  private estimatePriceChange(market: any): number {
    // Estimate based on probability distance from 0.5
    const prob = market.outcomePrices?.[0] || market.probability || 0.5;
    return Math.abs(prob - 0.5) * 0.4;
  }

  private getFallbackState(): MarketAnxietyState {
    return {
      score: 0.30,
      level: 'ELEVATED',
      routingMode: 'STANDARD',
      recommendation: 'Unable to fetch live data. Using conservative defaults.',
      estimatedPriceMovement: 0.8,
      confidence: 0.50,
      triggerMarkets: [],
      timestamp: Date.now()
    };
  }
}

// Singleton instance
export const marketAnxiety = new MarketAnxietyIndex();

// Helper function for quick access
export async function getMarketAnxiety(): Promise<MarketAnxietyState> {
  return marketAnxiety.getAnxiety();
}

export function getAnxietyForScenario(scenario: 'normal' | 'rally' | 'crash' | 'election'): MarketAnxietyState {
  return marketAnxiety.getAnxietyForScenario(scenario);
}
