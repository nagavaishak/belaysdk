// scripts/collectLabeledData.ts
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const connection = new Connection('https://api.mainnet-beta.solana.com');

// Use Helius for faster/more reliable data (if you have key, otherwise use mainnet)
// const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=YOUR_KEY');

const PROGRAMS = {
  jupiter: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  raydium: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
};

interface TransactionFeatures {
  signature: string;
  program: string;
  instructionCount: number;
  accountCount: number;
  dataSize: number;
  computeUnitsUsed: number | null;
  priorityFee: number;
  networkCongestion: number;
  timestamp: number;
  success: boolean;
  errorReason?: string;
}

async function getNetworkCongestion(): Promise<number> {
  try {
    const samples = await connection.getRecentPerformanceSamples(5); // Reduced from 10
    const avgSlotTime = samples.reduce((sum, s) => sum + (s.samplePeriodSecs / s.numSlots), 0) / samples.length;
    return Math.min(Math.max((avgSlotTime - 0.4) / 0.6, 0), 1) * 100;
  } catch {
    return 30; // Default fallback
  }
}

async function analyzeTransaction(signature: string, networkCongestion: number): Promise<TransactionFeatures | null> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });
    
    if (!tx || !tx.meta) return null;
    
    const meta = tx.meta;
    const message = tx.transaction.message;
    
    // Extract program ID
    let programId = '';
    for (const key of message.staticAccountKeys) {
      const keyStr = key.toString();
      if (Object.values(PROGRAMS).includes(keyStr)) {
        programId = keyStr;
        break;
      }
    }
    
    if (!programId) return null; // Skip if not our target programs
    
    const instructionCount = message.compiledInstructions.length;
    const accountCount = message.staticAccountKeys.length;
    
    let dataSize = 0;
    for (const ix of message.compiledInstructions) {
      dataSize += ix.data.length;
    }
    
    const computeUnitsUsed = meta.computeUnitsConsumed || null;
    const priorityFee = (meta.fee || 0) / 1_000_000_000;
    const success = meta.err === null;
    const errorReason = meta.err ? JSON.stringify(meta.err) : undefined;
    
    return {
      signature,
      program: programId,
      instructionCount,
      accountCount,
      dataSize,
      computeUnitsUsed,
      priorityFee,
      networkCongestion,
      timestamp: tx.blockTime || Date.now() / 1000,
      success,
      errorReason
    };
    
  } catch (error) {
    return null;
  }
}

async function collectTransactions(program: string, targetSuccess: number, targetFailed: number): Promise<TransactionFeatures[]> {
  console.log(`\n🔍 Collecting transactions for ${program}...`);
  console.log(`   Target: ${targetSuccess} successful + ${targetFailed} failed`);
  
  const programPubkey = new PublicKey(program);
  const transactions: TransactionFeatures[] = [];
  
  let successCount = 0;
  let failedCount = 0;
  let processed = 0;
  let lastSignature: string | undefined;
  
  // Get network congestion once (to save time)
  const networkCongestion = await getNetworkCongestion();
  console.log(`   Network congestion: ${networkCongestion.toFixed(1)}%`);
  
  while (successCount < targetSuccess || failedCount < targetFailed) {
    // Fetch batch of signatures
    const signatures = await connection.getSignaturesForAddress(
      programPubkey, 
      { 
        limit: 50,  // Increased batch size
        before: lastSignature 
      }
    );
    
    if (signatures.length === 0) {
      console.log(`   ⚠️ No more transactions found`);
      break;
    }
    
    lastSignature = signatures[signatures.length - 1].signature;
    
    // Process batch
    for (const sigInfo of signatures) {
      processed++;
      
      // Check if we need more of this type
      const isSuccess = sigInfo.err === null;
      if (isSuccess && successCount >= targetSuccess) continue;
      if (!isSuccess && failedCount >= targetFailed) continue;
      
      // Analyze transaction
      const tx = await analyzeTransaction(sigInfo.signature, networkCongestion);
      
      if (tx && tx.program === program) {
        if (tx.success && tx.computeUnitsUsed && successCount < targetSuccess) {
          transactions.push(tx);
          successCount++;
          console.log(`   ✅ Success ${successCount}/${targetSuccess}: ${sigInfo.signature.slice(0, 8)}... (${tx.computeUnitsUsed} CU)`);
        } else if (!tx.success && failedCount < targetFailed) {
          transactions.push(tx);
          failedCount++;
          console.log(`   ❌ Failed ${failedCount}/${targetFailed}: ${sigInfo.signature.slice(0, 8)}...`);
        }
      }
      
      // Small delay to avoid rate limits
      await sleep(50); // Reduced from 100ms
    }
    
    console.log(`   Progress: ${successCount}/${targetSuccess} success, ${failedCount}/${targetFailed} failed (processed ${processed} total)`);
    
    // Check if we're done
    if (successCount >= targetSuccess && failedCount >= targetFailed) {
      break;
    }
  }
  
  return transactions;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting OPTIMIZED labeled data collection...\n');
  
  const allData: TransactionFeatures[] = [];
  
  // Collect MORE data per program
  for (const [name, address] of Object.entries(PROGRAMS)) {
    console.log(`\n📊 Processing ${name}...`);
    
    // Collect 50 successful + 50 failed per program
    const transactions = await collectTransactions(address, 50, 50);
    
    allData.push(...transactions);
    
    const successful = transactions.filter(t => t.success).length;
    const failed = transactions.filter(t => !t.success).length;
    
    console.log(`\n✅ Collected ${successful} successful + ${failed} failed for ${name}`);
  }
  
  // Save to file
  const outputPath = 'data/labeled_transactions.json';
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  
  const totalSuccess = allData.filter(t => t.success).length;
  const totalFailed = allData.filter(t => !t.success).length;
  
  console.log(`\n\n🎉 Data collection complete!`);
  console.log(`📁 Saved ${allData.length} transactions to ${outputPath}`);
  console.log(`   - Successful: ${totalSuccess}`);
  console.log(`   - Failed: ${totalFailed}`);
}

main().catch(console.error);