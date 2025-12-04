// lib/solana/network.ts
import { Connection, clusterApiUrl } from '@solana/web3.js';

// Use Helius free tier for better reliability
const HELIUS_RPC = 'https://api.mainnet-beta.solana.com';

export interface NetworkMetrics {
  slotTime: number;
  congestion: number;
  status: 'optimal' | 'moderate' | 'high';
  sampleSize: number;
}

export async function getRealNetworkMetrics(): Promise<NetworkMetrics> {
  try {
    const connection = new Connection(HELIUS_RPC, 'confirmed');
    
    // Get last 20 performance samples
    const samples = await connection.getRecentPerformanceSamples(20);
    
    if (!samples || samples.length === 0) {
      throw new Error('No performance samples available');
    }
    
    // Calculate average slot time
    let totalSlotTime = 0;
    for (const sample of samples) {
      const slotTime = sample.samplePeriodSecs / sample.numSlots;
      totalSlotTime += slotTime;
    }
    const avgSlotTime = totalSlotTime / samples.length;
    
    // Calculate congestion (baseline is 0.4s, critical is 1.0s)
    const baselineSlotTime = 0.4;
    const criticalSlotTime = 1.0;
    const congestion = Math.min(
      Math.max((avgSlotTime - baselineSlotTime) / (criticalSlotTime - baselineSlotTime), 0),
      1
    ) * 100;
    
    // Determine status
    let status: 'optimal' | 'moderate' | 'high';
    if (congestion < 30) status = 'optimal';
    else if (congestion < 70) status = 'moderate';
    else status = 'high';
    
    return {
      slotTime: Math.round(avgSlotTime * 1000), // Convert to ms
      congestion: Math.round(congestion),
      status,
      sampleSize: samples.length
    };
    
  } catch (error) {
    console.error('Failed to fetch real network metrics:', error);
    
    // Fallback to reasonable defaults if RPC fails
    return {
      slotTime: 420,
      congestion: 32,
      status: 'optimal',
      sampleSize: 0 // Indicates fallback data
    };
  }
}