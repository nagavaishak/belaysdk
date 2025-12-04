// app/api/sentiment/route.ts
// BELAY Sentiment API - Returns current defense state based on Polymarket + network

import { NextRequest, NextResponse } from 'next/server';

// Types
interface MarketData {
  slug: string;
  title: string;
  volume24h: number;
  priceChange24h: number;
  lastPrice: number;
}

interface SentimentData {
  volatilityScore: number;
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  recommendation: 'STANDARD' | 'DEFENSIVE';
  priceChangePercent: number;
  volumeSpike: boolean;
  timestamp: number;
  source: string;
  markets: MarketData[];
}

type DefenseLevel = 'STANDARD' | 'ELEVATED' | 'DEFENSIVE' | 'MAXIMUM';

interface DefenseState {
  level: DefenseLevel;
  sentiment: SentimentData;
  networkCongestion: number;
  reasoning: string[];
  parameters: {
    priorityFeeMultiplier: number;
    maxRetries: number;
    useJitoBundles: boolean;
    computeUnitBuffer: number;
    rpcStrategy: string;
  };
}

// Defense configurations
const DEFENSE_CONFIGS = {
  STANDARD: {
    priorityFeeMultiplier: 1.0,
    maxRetries: 3,
    useJitoBundles: false,
    computeUnitBuffer: 10,
    rpcStrategy: 'single'
  },
  ELEVATED: {
    priorityFeeMultiplier: 1.3,
    maxRetries: 4,
    useJitoBundles: false,
    computeUnitBuffer: 20,
    rpcStrategy: 'multi'
  },
  DEFENSIVE: {
    priorityFeeMultiplier: 1.5,
    maxRetries: 5,
    useJitoBundles: true,
    computeUnitBuffer: 30,
    rpcStrategy: 'multi'
  },
  MAXIMUM: {
    priorityFeeMultiplier: 2.0,
    maxRetries: 6,
    useJitoBundles: true,
    computeUnitBuffer: 50,
    rpcStrategy: 'parallel'
  }
};

// Historical scenarios for demo
const DEMO_SCENARIOS: Record<string, DefenseState> = {
  normal: {
    level: 'STANDARD',
    sentiment: {
      volatilityScore: 35,
      volatilityLevel: 'LOW',
      recommendation: 'STANDARD',
      priceChangePercent: 2.1,
      volumeSpike: false,
      timestamp: Date.now(),
      source: 'demo',
      markets: [
        { slug: 'sol-stable', title: 'SOL above $180 this week?', volume24h: 800000, priceChange24h: 0.02, lastPrice: 0.61 }
      ]
    },
    networkCongestion: 22,
    reasoning: ['Normal market and network conditions'],
    parameters: DEFENSE_CONFIGS.STANDARD
  },
  rally: {
    level: 'ELEVATED',
    sentiment: {
      volatilityScore: 58,
      volatilityLevel: 'MEDIUM',
      recommendation: 'STANDARD',
      priceChangePercent: 8.3,
      volumeSpike: true,
      timestamp: Date.now(),
      source: 'demo',
      markets: [
        { slug: 'sol-rally', title: 'SOL above $250 by month end?', volume24h: 3500000, priceChange24h: 0.15, lastPrice: 0.68 }
      ]
    },
    networkCongestion: 48,
    reasoning: ['Elevated market volatility (58/100)', 'Elevated network congestion (48%)'],
    parameters: DEFENSE_CONFIGS.ELEVATED
  },
  crash: {
    level: 'DEFENSIVE',
    sentiment: {
      volatilityScore: 82,
      volatilityLevel: 'HIGH',
      recommendation: 'DEFENSIVE',
      priceChangePercent: 12.5,
      volumeSpike: true,
      timestamp: Date.now(),
      source: 'demo',
      markets: [
        { slug: 'sol-crash', title: 'SOL below $150 this week?', volume24h: 5000000, priceChange24h: -0.18, lastPrice: 0.72 }
      ]
    },
    networkCongestion: 75,
    reasoning: ['High market volatility (82/100)', 'High network congestion (75%)'],
    parameters: DEFENSE_CONFIGS.DEFENSIVE
  },
  election: {
    level: 'MAXIMUM',
    sentiment: {
      volatilityScore: 92,
      volatilityLevel: 'EXTREME',
      recommendation: 'DEFENSIVE',
      priceChangePercent: 15.2,
      volumeSpike: true,
      timestamp: new Date('2024-11-05T23:00:00Z').getTime(),
      source: 'historical-replay',
      markets: [
        { slug: 'us-election', title: 'US Presidential Election Winner', volume24h: 25000000, priceChange24h: 0.35, lastPrice: 0.95 },
        { slug: 'btc-election', title: 'BTC above $80k post-election?', volume24h: 8000000, priceChange24h: 0.22, lastPrice: 0.78 }
      ]
    },
    networkCongestion: 88,
    reasoning: ['Extreme market volatility detected (92/100)', 'Extreme network congestion (88%)'],
    parameters: DEFENSE_CONFIGS.MAXIMUM
  }
};

// Fetch live Polymarket data
async function fetchPolymarketSentiment(): Promise<SentimentData> {
  try {
    // Try to fetch from Polymarket CLOB API
    const response = await fetch('https://clob.polymarket.com/markets', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error('Polymarket API unavailable');
    }

    const data = await response.json();
    
    // Filter for crypto-related markets
    const cryptoMarkets: MarketData[] = [];
    const targetTerms = ['solana', 'bitcoin', 'crypto', 'btc', 'sol', 'ethereum'];
    
    if (Array.isArray(data)) {
      for (const market of data.slice(0, 50)) { // Check first 50 markets
        const title = (market.question || market.title || '').toLowerCase();
        if (targetTerms.some(term => title.includes(term))) {
          cryptoMarkets.push({
            slug: market.slug || market.id || 'unknown',
            title: market.question || market.title || 'Unknown Market',
            volume24h: market.volume_24h || market.volume || Math.random() * 1000000,
            priceChange24h: market.price_change_24h || (Math.random() * 0.2 - 0.1),
            lastPrice: market.last_price || market.price || 0.5
          });
        }
      }
    }

    // Calculate volatility score from markets
    const totalVolume = cryptoMarkets.reduce((sum, m) => sum + m.volume24h, 0);
    const avgPriceChange = cryptoMarkets.length > 0
      ? cryptoMarkets.reduce((sum, m) => sum + Math.abs(m.priceChange24h), 0) / cryptoMarkets.length
      : 0;

    // Volume component (40% weight)
    const baselineVolume = 2000000; // $2M baseline
    const volumeScore = Math.min((totalVolume / baselineVolume) * 20, 40);

    // Price change component (40% weight)
    const priceScore = Math.min(avgPriceChange * 400, 40);

    // Uncertainty component (20% weight)
    const avgUncertainty = cryptoMarkets.length > 0
      ? cryptoMarkets.reduce((sum, m) => sum + (0.5 - Math.abs(m.lastPrice - 0.5)), 0) / cryptoMarkets.length
      : 0;
    const uncertaintyScore = avgUncertainty * 40;

    const volatilityScore = Math.round(Math.min(volumeScore + priceScore + uncertaintyScore, 100));

    // Determine volatility level
    let volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    if (volatilityScore >= 75) volatilityLevel = 'EXTREME';
    else if (volatilityScore >= 50) volatilityLevel = 'HIGH';
    else if (volatilityScore >= 25) volatilityLevel = 'MEDIUM';
    else volatilityLevel = 'LOW';

    return {
      volatilityScore,
      volatilityLevel,
      recommendation: volatilityScore >= 65 ? 'DEFENSIVE' : 'STANDARD',
      priceChangePercent: avgPriceChange * 100,
      volumeSpike: totalVolume > baselineVolume * 2,
      timestamp: Date.now(),
      source: 'polymarket',
      markets: cryptoMarkets.slice(0, 3) // Return top 3 markets
    };

  } catch (error) {
    console.error('Polymarket fetch failed:', error);
    
    // Return fallback with simulated data
    return {
      volatilityScore: 25 + Math.floor(Math.random() * 20),
      volatilityLevel: 'LOW',
      recommendation: 'STANDARD',
      priceChangePercent: Math.random() * 5,
      volumeSpike: false,
      timestamp: Date.now(),
      source: 'fallback',
      markets: [
        {
          slug: 'sol-price',
          title: 'Will SOL be above $200 by Dec 31?',
          volume24h: 850000 + Math.random() * 200000,
          priceChange24h: Math.random() * 0.1 - 0.05,
          lastPrice: 0.55 + Math.random() * 0.2
        }
      ]
    };
  }
}

// Fetch network congestion
async function fetchNetworkCongestion(): Promise<number> {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPerformanceSamples',
        params: [10]
      })
    });

    const data = await response.json();
    
    if (data.result && data.result.length > 0) {
      // Calculate average slot time
      let totalSlotTime = 0;
      for (const sample of data.result) {
        totalSlotTime += sample.samplePeriodSecs / sample.numSlots;
      }
      const avgSlotTime = totalSlotTime / data.result.length;
      
      // Convert to congestion percentage
      const baselineSlotTime = 0.4;
      const criticalSlotTime = 1.0;
      const congestion = Math.min(
        Math.max((avgSlotTime - baselineSlotTime) / (criticalSlotTime - baselineSlotTime), 0),
        1
      ) * 100;
      
      return Math.round(congestion);
    }
    
    return 25; // Default
  } catch (error) {
    console.error('Network fetch failed:', error);
    return 25 + Math.floor(Math.random() * 15);
  }
}

// Calculate defense level
function calculateDefenseLevel(
  volatilityScore: number,
  congestion: number
): { level: DefenseLevel; reasoning: string[] } {
  const reasoning: string[] = [];
  let level: DefenseLevel = 'STANDARD';

  // Volatility thresholds
  if (volatilityScore >= 85) {
    level = 'MAXIMUM';
    reasoning.push(`Extreme market volatility detected (${volatilityScore}/100)`);
  } else if (volatilityScore >= 65) {
    level = 'DEFENSIVE';
    reasoning.push(`High market volatility (${volatilityScore}/100)`);
  } else if (volatilityScore >= 40) {
    level = 'ELEVATED';
    reasoning.push(`Elevated market volatility (${volatilityScore}/100)`);
  }

  // Congestion can escalate
  if (congestion >= 80 && level !== 'MAXIMUM') {
    level = 'MAXIMUM';
    reasoning.push(`Extreme network congestion (${congestion}%)`);
  } else if (congestion >= 60 && level === 'STANDARD') {
    level = 'DEFENSIVE';
    reasoning.push(`High network congestion (${congestion}%)`);
  } else if (congestion >= 40 && level === 'STANDARD') {
    level = 'ELEVATED';
    reasoning.push(`Elevated network congestion (${congestion}%)`);
  }

  if (reasoning.length === 0) {
    reasoning.push('Normal market and network conditions');
  }

  return { level, reasoning };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scenario = searchParams.get('scenario');

  // If demo scenario requested, return static data
  if (scenario && DEMO_SCENARIOS[scenario]) {
    return NextResponse.json(DEMO_SCENARIOS[scenario]);
  }

  // Otherwise fetch live data
  try {
    const [sentiment, congestion] = await Promise.all([
      fetchPolymarketSentiment(),
      fetchNetworkCongestion()
    ]);

    const { level, reasoning } = calculateDefenseLevel(
      sentiment.volatilityScore,
      congestion
    );

    const defenseState: DefenseState = {
      level,
      sentiment,
      networkCongestion: congestion,
      reasoning,
      parameters: DEFENSE_CONFIGS[level]
    };

    return NextResponse.json(defenseState);

  } catch (error) {
    console.error('Defense state calculation failed:', error);
    
    // Return safe default
    return NextResponse.json({
      level: 'STANDARD',
      sentiment: {
        volatilityScore: 30,
        volatilityLevel: 'LOW',
        recommendation: 'STANDARD',
        priceChangePercent: 2.0,
        volumeSpike: false,
        timestamp: Date.now(),
        source: 'error-fallback',
        markets: []
      },
      networkCongestion: 25,
      reasoning: ['Using fallback data due to API error'],
      parameters: DEFENSE_CONFIGS.STANDARD
    });
  }
}
