// lib/solana/feeOptimizer.ts
import { Connection } from '@solana/web3.js';

export async function calculateOptimalPriorityFee(
  connection: Connection,
  urgency: 'low' | 'medium' | 'high' = 'medium'
): Promise<number> {
  
  try {
    const recentFees = await connection.getRecentPrioritizationFees();
    
    if (recentFees.length === 0) {
      return getDefaultFee(urgency);
    }

    const fees = recentFees
      .map(f => f.prioritizationFee)
      .filter(f => f > 0)
      .sort((a, b) => a - b);

    if (fees.length === 0) {
      return getDefaultFee(urgency);
    }

    // Calculate percentiles
    const p50 = fees[Math.floor(fees.length * 0.50)];
    const p75 = fees[Math.floor(fees.length * 0.75)];
    const p90 = fees[Math.floor(fees.length * 0.90)];

    // Select based on urgency
    let recommendedFee: number;
    switch (urgency) {
      case 'low':
        recommendedFee = p50;
        break;
      case 'high':
        recommendedFee = p90;
        break;
      default:
        recommendedFee = p75;
    }

    return Math.max(recommendedFee, 1000);

  } catch (error) {
    console.error('Failed to calculate optimal fee:', error);
    return getDefaultFee(urgency);
  }
}

function getDefaultFee(urgency: 'low' | 'medium' | 'high'): number {
  const defaults = {
    low: 5000,
    medium: 10000,
    high: 20000
  };
  return defaults[urgency];
}

export function microlamportsToSOL(microlamports: number): number {
  return microlamports / 1_000_000_000;
}