// lib/solana/retryEngine.ts
// BELAY v2.0 - Smart Retry Engine
// Fixes: Fast backoff (respects 400ms slots), blockhash validity checking

import { Connection, Transaction, Signer, BlockhashWithExpiryBlockHeight } from '@solana/web3.js';

export interface RetryOptions {
  maxRetries?: number;
  mode?: 'standard' | 'defensive'; // defensive = use Jito bundles (future)
}

export interface RetryResult {
  success: boolean;
  signature?: string;
  attempts: number;
  error?: string;
  blockhashRefreshes: number;
  totalTimeMs: number;
}

// Configuration
const BACKOFF_MS = [100, 200, 400, 800]; // Fast backoff - Solana slots are 400ms
const MIN_BLOCKS_REMAINING = 20; // Refresh blockhash if fewer than 20 blocks left
const BLOCKHASH_VALIDITY_BLOCKS = 150; // ~60 seconds at 400ms/slot

/**
 * Check if blockhash is about to expire
 */
async function isBlockhashExpiring(
  connection: Connection,
  lastValidBlockHeight: number
): Promise<boolean> {
  try {
    const currentSlot = await connection.getSlot('confirmed');
    const blocksRemaining = lastValidBlockHeight - currentSlot;
    
    console.log(`   📊 Blockhash validity: ${blocksRemaining} blocks remaining`);
    
    return blocksRemaining < MIN_BLOCKS_REMAINING;
  } catch {
    // If we can't check, assume it's expiring to be safe
    return true;
  }
}

/**
 * Get fresh blockhash with validity info
 */
async function getFreshBlockhash(
  connection: Connection
): Promise<BlockhashWithExpiryBlockHeight> {
  const blockhashInfo = await connection.getLatestBlockhash('confirmed');
  console.log(`   🔄 Fresh blockhash: ${blockhashInfo.blockhash.slice(0, 8)}... (valid until block ${blockhashInfo.lastValidBlockHeight})`);
  return blockhashInfo;
}

/**
 * Smart retry with fast backoff and blockhash management
 */
export async function sendWithAutoRetry(
  connection: Connection,
  transaction: Transaction,
  signers: Signer[],
  options: RetryOptions = {}
): Promise<RetryResult> {
  const { maxRetries = 4, mode = 'standard' } = options;
  const startTime = Date.now();

  let lastError: Error | null = null;
  let blockhashRefreshes = 0;
  let currentBlockhash: BlockhashWithExpiryBlockHeight | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🚀 Attempt ${attempt}/${maxRetries}...`);

      // Check if we need a fresh blockhash
      const needsFreshBlockhash = !currentBlockhash || 
        await isBlockhashExpiring(connection, currentBlockhash.lastValidBlockHeight);

      if (needsFreshBlockhash) {
        currentBlockhash = await getFreshBlockhash(connection);
        blockhashRefreshes++;
      }

      // Apply blockhash to transaction
      transaction.recentBlockhash = currentBlockhash.blockhash;
      transaction.lastValidBlockHeight = currentBlockhash.lastValidBlockHeight;

      // Re-sign with updated blockhash
      transaction.sign(...signers);

      // Send transaction
      const signature = await connection.sendRawTransaction(
        transaction.serialize(),
        { 
          skipPreflight: false,
          maxRetries: 0 // We handle retries
        }
      );

      console.log(`   📝 Sent: ${signature.slice(0, 8)}...`);

      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: currentBlockhash.blockhash,
          lastValidBlockHeight: currentBlockhash.lastValidBlockHeight
        },
        'confirmed'
      );

      if (!confirmation.value.err) {
        const totalTimeMs = Date.now() - startTime;
        console.log(`   ✅ Confirmed! (attempt ${attempt}, ${totalTimeMs}ms total)`);
        
        return {
          success: true,
          signature,
          attempts: attempt,
          blockhashRefreshes,
          totalTimeMs
        };
      } else {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

    } catch (error: any) {
      lastError = error;
      console.error(`   ❌ Failed:`, error.message);

      // Check if error is blockhash-related - force refresh on next attempt
      if (error.message?.includes('blockhash') || error.message?.includes('expired')) {
        console.log(`   🔄 Blockhash error detected - will refresh on next attempt`);
        currentBlockhash = null; // Force refresh
      }

      if (attempt < maxRetries) {
        // Smart backoff - much faster than 2s/4s/8s
        const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
        console.log(`   ⏱️  Waiting ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  return {
    success: false,
    attempts: maxRetries,
    error: lastError?.message || 'Unknown error',
    blockhashRefreshes,
    totalTimeMs: Date.now() - startTime
  };
}

/**
 * Quick send without retries (for time-sensitive operations)
 */
export async function sendOnce(
  connection: Connection,
  transaction: Transaction,
  signers: Signer[]
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.sign(...signers);

    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false
    });

    return { success: true, signature };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
