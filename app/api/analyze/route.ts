// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const connection = new Connection('https://api.devnet.solana.com');
    const publicKey = new PublicKey(walletAddress);

    // Fetch signatures (last 1000 transactions max)
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });

    let totalTransactions = signatures.length;
    let failedTransactions = 0;
    let wastedFees = 0;

    // Analyze each transaction
    for (const sig of signatures.slice(0, 100)) { // Limit to 100 for speed
      if (sig.err !== null) {
        failedTransactions++;
        wastedFees += 0.000005; // Base fee estimate
      }
    }

    // Estimate if we analyzed fewer than total
    if (signatures.length > 100) {
      const failureRate = failedTransactions / 100;
      failedTransactions = Math.round(signatures.length * failureRate);
      wastedFees = failedTransactions * 0.000005;
    }

    const failureRate = ((failedTransactions / totalTransactions) * 100).toFixed(1);
    const solPrice = 200; // Estimate
    const wastedUSD = wastedFees * solPrice;

    // Calculate could have saved (BELAY prevents 90% of failures)
    const preventedFailures = failedTransactions * 0.9;
    const couldHaveSaved = preventedFailures * 0.000005 * solPrice;

    // BELAY cost
    const belayCost = totalTransactions * 0.15;

    // Net savings
    const netSavings = couldHaveSaved - belayCost;

    // Time wasted (2 min per failed tx)
    const timeWasted = failedTransactions * 2;

    return NextResponse.json({
      totalTransactions,
      failedTransactions,
      failureRate,
      wastedSOL: wastedFees,
      wastedUSD,
      couldHaveSaved,
      netSavings: Math.max(0, netSavings),
      timeWasted,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze wallet' },
      { status: 500 }
    );
  }
}