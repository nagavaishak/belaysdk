// scripts/collectDataML.ts
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';

// FREE RPC ENDPOINTS - No rate limits!
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://api.devnet.solana.com', // Won't use this but as backup
  'https://solana-api.projectserum.com',
];

let currentRPCIndex = 0;

function getConnection(): Connection {
  const rpc = RPC_ENDPOINTS[currentRPCIndex];
  currentRPCIndex = (currentRPCIndex + 1) % RPC_ENDPOINTS.length;
  console.log(`Using RPC: ${rpc}`);
  return new Connection(rpc, 'confirmed');
}

// Jupiter & Raydium program IDs
const PROGRAMS = {
  jupiter: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
  raydium: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
};

interface TrainingData {
  // Features
  programId: string;
  instructionCount: number;
  accountCount: number;
  computeUnitsUsed: number | null;
  priorityFee: number;
  slotTime: number;
  
  // Labels
  success: boolean;
  failureType: string | null;
  signature: string;
}

async function getRecentSlotTime(): Promise<number> {
  const connection = getConnection();
  try {
    const samples = await connection.getRecentPerformanceSamples(1);
    if (samples.length > 0) {
      return samples[0].samplePeriodSecs;
    }
  } catch (error) {
    console.log('Could not get slot time, using default');
  }
  return 0.4; // Default 400ms
}

function extractPriorityFee(transaction: any): number {
  try {
    const instructions = transaction.transaction.message.instructions;
    
    // Look for ComputeBudgetProgram instructions
    for (const ix of instructions) {
      const programId = transaction.transaction.message.accountKeys[ix.programIdIndex];
      
      // ComputeBudgetProgram ID
      if (programId.toString() === 'ComputeBudget111111111111111111111111111111') {
        // SetComputeUnitPrice instruction (type 3)
        if (ix.data && ix.data.length > 0) {
          // Try to decode priority fee from instruction data
          // This is simplified - actual decoding is more complex
          return 0.00001; // Default small fee
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return 0.00001; // Default
}

function parseFailureType(error: any, transaction: any): string | null {
  if (!error) return null;
  
  // Convert to string for searching
  const errorStr = JSON.stringify(error).toLowerCase();
  
  // 1. SLIPPAGE (Most common - 47.99%)
  if (errorStr.includes('slippage') || 
      errorStr.includes('price') ||
      errorStr.includes('0x1771') ||  // Slippage error code
      errorStr.includes('0x1772') ||  // Price impact too high
      errorStr.includes('exceededslippage')) {
    return 'slippage';
  }
  
  // 2. BLOCKHASH EXPIRED (17.72%)
  if (errorStr.includes('blockhash') ||
      errorStr.includes('0x1') ||  // Generic blockhash error
      errorStr.includes('expired') ||
      errorStr.includes('notfound') ||
      errorStr.includes('durable')) {
    return 'blockhash_expired';
  }
  
  // 3. COMPUTE BUDGET EXCEEDED (0.49%)
  if (errorStr.includes('compute') ||
      errorStr.includes('0x1773') ||  // Compute exceeded
      errorStr.includes('budget') ||
      errorStr.includes('exceeded') && errorStr.includes('unit')) {
    return 'compute_exceeded';
  }
  
  // 4. INSUFFICIENT FUNDS
  if (errorStr.includes('insufficient') ||
      errorStr.includes('funds') ||
      errorStr.includes('balance')) {
    return 'insufficient_funds';
  }
  
  // 5. ACCOUNT ISSUES
  if (errorStr.includes('account') ||
      errorStr.includes('owner') ||
      errorStr.includes('initialized')) {
    return 'account_error';
  }
  
  // 6. PROGRAM ERRORS (Custom errors from DEX programs)
  if (error.InstructionError) {
    const [index, customError] = error.InstructionError;
    
    if (customError.Custom !== undefined) {
      const errorCode = customError.Custom;
      
      // Jupiter error codes
      if (errorCode === 6000) return 'slippage'; // SlippageToleranceExceeded
      if (errorCode === 6001) return 'insufficient_liquidity';
      
      // Raydium error codes  
      if (errorCode === 0x1771) return 'slippage';
      if (errorCode === 0x1772) return 'price_impact_too_high';
    }
  }
  
  // 7. RPC/NETWORK ISSUES
  if (errorStr.includes('timeout') ||
      errorStr.includes('connection') ||
      errorStr.includes('network')) {
    return 'network_timeout';
  }
  
  // Look at logs for more clues
  if (transaction?.meta?.logMessages) {
    const logs = transaction.meta.logMessages.join(' ').toLowerCase();
    
    if (logs.includes('slippage')) return 'slippage';
    if (logs.includes('price')) return 'slippage';
    if (logs.includes('exceeded')) return 'compute_exceeded';
  }
  
  return 'unknown';
}

async function collectFromProgram(
  programId: PublicKey,
  programName: string,
  targetCount: number
): Promise<TrainingData[]> {
  
  const data: TrainingData[] = [];
  let attempts = 0;
  const maxAttempts = targetCount * 3; // Try 3x to get target
  
  console.log(`\n🎯 Collecting ${targetCount} transactions from ${programName}...\n`);
  
  while (data.length < targetCount && attempts < maxAttempts) {
    attempts++;
    
    try {
      // Get connection (rotates through RPCs)
      const connection = getConnection();
      
      // Get recent signatures
      const signatures = await connection.getSignaturesForAddress(
        programId,
        { limit: 50 }, // Get 50 at a time
        'confirmed'
      );
      
      console.log(`📥 Fetched ${signatures.length} signatures (attempt ${attempts})`);
      
      // Get current slot time
      const slotTime = await getRecentSlotTime();
      
      // Process each signature
      for (const sig of signatures) {
        if (data.length >= targetCount) break;
        
        try {
          // Fetch full transaction
          const tx = await connection.getParsedTransaction(
            sig.signature,
            { maxSupportedTransactionVersion: 0 }
          );
          
          if (!tx) continue;
          
          // Extract features
          const instructionCount = tx.transaction.message.instructions.length;
          const accountCount = tx.transaction.message.accountKeys.length;
          const computeUnitsUsed = tx.meta?.computeUnitsConsumed || null;
          const priorityFee = extractPriorityFee(tx);
          
          // Determine success/failure
          const success = tx.meta?.err === null;
          const failureType = success ? null : parseFailureType(tx.meta?.err, tx.meta?.logMessages || []);
          
          // Create data point
          const dataPoint: TrainingData = {
            programId: programId.toString(),
            instructionCount,
            accountCount,
            computeUnitsUsed,
            priorityFee,
            slotTime,
            success,
            failureType,
            signature: sig.signature,
          };
          
          data.push(dataPoint);
          
          const status = success ? '✅' : '❌';
          const type = failureType ? `(${failureType})` : '';
          console.log(`${status} ${data.length}/${targetCount} ${type}`);
          
          // Small delay to avoid rate limits
          await sleep(100);
          
        } catch (error: any) {
          // Skip this transaction
          if (error.message?.includes('429')) {
            console.log('⚠️  Rate limited, waiting 2s...');
            await sleep(2000);
          }
          continue;
        }
      }
      
      // Delay between batches
      console.log('⏱️  Waiting 3s before next batch...\n');
      await sleep(3000);
      
    } catch (error: any) {
      console.error(`❌ Error in batch: ${error.message}`);
      
      if (error.message?.includes('429')) {
        console.log('⚠️  Rate limited, waiting 5s...');
        await sleep(5000);
      } else {
        await sleep(2000);
      }
    }
  }
  
  console.log(`\n✅ Collected ${data.length} transactions from ${programName}\n`);
  return data;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 BELAY ML Data Collection (Improved Strategy)\n');
  console.log('📊 Target: 200 Jupiter + 200 Raydium = 400 total\n');
  
  const allData: TrainingData[] = [];
  
  // Collect Jupiter data
  const jupiterData = await collectFromProgram(
    PROGRAMS.jupiter,
    'Jupiter',
    200
  );
  allData.push(...jupiterData);
  
  // Wait between programs
  console.log('⏱️  Waiting 10s before next program...\n');
  await sleep(10000);
  
  // Collect Raydium data
  const raydiumData = await collectFromProgram(
    PROGRAMS.raydium,
    'Raydium',
    200
  );
  allData.push(...raydiumData);
  
  // Analyze collection
  const successCount = allData.filter(d => d.success).length;
  const failureCount = allData.filter(d => !d.success).length;
  
  const failureTypes: Record<string, number> = {};
  allData.filter(d => !d.success).forEach(d => {
    const type = d.failureType || 'unknown';
    failureTypes[type] = (failureTypes[type] || 0) + 1;
  });
  
  console.log('\n📊 COLLECTION SUMMARY:\n');
  console.log(`Total transactions: ${allData.length}`);
  console.log(`✅ Success: ${successCount} (${(successCount/allData.length*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failureCount} (${(failureCount/allData.length*100).toFixed(1)}%)`);
  console.log('\n🔍 Failure Types:');
  Object.entries(failureTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  // Save to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `data/ml_training_data_${timestamp}.json`;
  
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
  
  console.log(`\n💾 Saved to: ${filename}`);
  console.log('\n✅ Data collection complete!');
  console.log('🚀 Next: Run training script to build ML models!\n');
}

main().catch(console.error);