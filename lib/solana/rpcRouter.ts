// lib/solana/rpcRouter.ts
// BELAY v2.0 - Slot-Aware Multi-RPC Router
// Fixes: Added slot height verification, latency checks, health monitoring

import { Connection, Transaction, Signer } from '@solana/web3.js';

interface RPCEndpoint {
  name: string;
  url: string;
  priority: number;
}

interface RPCHealth {
  endpoint: RPCEndpoint;
  healthy: boolean;
  latency: number;
  slot: number;
  slotLag: number;
}

// Configuration
const MAX_SLOT_LAG = 10; // Ban RPCs more than 10 slots behind
const MAX_LATENCY_MS = 500; // Ban RPCs slower than 500ms
const HEALTH_CHECK_TIMEOUT_MS = 3000;

const RPC_ENDPOINTS: RPCEndpoint[] = [
  {
    name: 'Helius',
    url: process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://mainnet.helius-rpc.com/?api-key=demo',
    priority: 1
  },
  {
    name: 'Mainnet-Beta',
    url: 'https://api.mainnet-beta.solana.com',
    priority: 2
  },
  {
    name: 'Triton',
    url: process.env.NEXT_PUBLIC_TRITON_RPC || 'https://api.mainnet-beta.solana.com',
    priority: 3
  }
];

/**
 * Check health of a single RPC endpoint
 * Verifies: HTTP response, latency, and slot height
 */
async function checkRPCHealth(endpoint: RPCEndpoint): Promise<RPCHealth> {
  const startTime = Date.now();
  
  try {
    const connection = new Connection(endpoint.url, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: HEALTH_CHECK_TIMEOUT_MS
    });

    // Race against timeout
    const slotPromise = connection.getSlot('confirmed');
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT_MS)
    );

    const slot = await Promise.race([slotPromise, timeoutPromise]);
    const latency = Date.now() - startTime;

    return {
      endpoint,
      healthy: true,
      latency,
      slot,
      slotLag: 0 // Will be calculated after all checks
    };

  } catch (error) {
    return {
      endpoint,
      healthy: false,
      latency: Date.now() - startTime,
      slot: 0,
      slotLag: Infinity
    };
  }
}

/**
 * Get all healthy RPCs sorted by slot freshness and latency
 */
export async function getHealthyRPCs(): Promise<RPCHealth[]> {
  console.log('🔍 Checking RPC health across all providers...');
  
  // Check all endpoints in parallel
  const healthChecks = await Promise.all(
    RPC_ENDPOINTS.map(endpoint => checkRPCHealth(endpoint))
  );

  // Find the highest slot (most recent)
  const maxSlot = Math.max(...healthChecks.filter(h => h.healthy).map(h => h.slot));

  // Calculate slot lag and filter healthy nodes
  const healthyRPCs = healthChecks
    .map(health => ({
      ...health,
      slotLag: maxSlot - health.slot
    }))
    .filter(health => {
      if (!health.healthy) {
        console.log(`   ❌ ${health.endpoint.name}: Unreachable`);
        return false;
      }
      if (health.slotLag > MAX_SLOT_LAG) {
        console.log(`   ⚠️ ${health.endpoint.name}: ${health.slotLag} slots behind (stale)`);
        return false;
      }
      if (health.latency > MAX_LATENCY_MS) {
        console.log(`   ⚠️ ${health.endpoint.name}: ${health.latency}ms latency (too slow)`);
        return false;
      }
      console.log(`   ✅ ${health.endpoint.name}: slot=${health.slot}, lag=${health.slotLag}, ${health.latency}ms`);
      return true;
    })
    // Sort by: slot lag first (freshest), then latency (fastest)
    .sort((a, b) => {
      if (a.slotLag !== b.slotLag) return a.slotLag - b.slotLag;
      return a.latency - b.latency;
    });

  return healthyRPCs;
}

/**
 * Select the best RPC for transaction submission
 */
export async function selectBestRPC(): Promise<{ connection: Connection; name: string } | null> {
  const healthyRPCs = await getHealthyRPCs();

  if (healthyRPCs.length === 0) {
    console.error('🚨 All RPC providers are unhealthy or out of sync!');
    return null;
  }

  const best = healthyRPCs[0];
  console.log(`\n🎯 Selected: ${best.endpoint.name} (lag=${best.slotLag}, ${best.latency}ms)\n`);

  return {
    connection: new Connection(best.endpoint.url, 'confirmed'),
    name: best.endpoint.name
  };
}

/**
 * Send transaction via best available RPC with automatic failover
 */
export async function sendViaMultiRPC(
  transaction: Transaction,
  signers: Signer[]
): Promise<{ signature: string; rpc: string }> {
  
  const healthyRPCs = await getHealthyRPCs();

  if (healthyRPCs.length === 0) {
    throw new Error('All RPC endpoints are unhealthy or out of sync');
  }

  // Try each healthy RPC in order (best first)
  for (const health of healthyRPCs) {
    try {
      console.log(`🔄 Attempting via ${health.endpoint.name}...`);
      
      const connection = new Connection(health.endpoint.url, 'confirmed');
      
      // Get fresh blockhash from THIS connection
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      // Sign with fresh blockhash
      transaction.sign(...signers);

      // Send transaction
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 0 // We handle retries ourselves
      });
      
      console.log(`✅ Sent via ${health.endpoint.name}: ${signature.slice(0, 8)}...`);
      
      return { signature, rpc: health.endpoint.name };

    } catch (error: any) {
      console.error(`❌ ${health.endpoint.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('All healthy RPC endpoints failed to send transaction');
}

/**
 * Get current network slot from best RPC
 */
export async function getCurrentSlot(): Promise<number> {
  const rpc = await selectBestRPC();
  if (!rpc) throw new Error('No healthy RPC available');
  return rpc.connection.getSlot('confirmed');
}
