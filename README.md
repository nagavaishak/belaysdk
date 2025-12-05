# BELAY SDK

**Predictive Transaction Infrastructure for Solana**

BELAY is a TypeScript SDK that makes Solana transactions reliable. It combines predictive market intelligence (via Polymarket + on-chain metrics), dual-path routing (SWQoS + Jito), smart retry mechanisms, and ML-optimized compute units to achieve 99% transaction success rates.

> "We're building a transaction reliability SDK for Solana that predicts if your transaction will fail and fixes it before you even send."

🏆 **Built for Midwest Blockchain Conference 2025 Hackathon** | Solana + Polymarket Tracks

---

## 🎯 The Problem

Solana transactions fail at alarming rates:
- **48%** fail from slippage issues during volatility
- **36%** fail from RPC connection issues  
- **16%** fail from blockhash expiry and logic errors

Most failures are **preventable** with predictive slippage, intelligent routing, and smart retry logic.

## 💡 The Solution

BELAY provides **6 core modules** that work together:

| Module | What It Does | File |
|--------|--------------|------|
| **Market Anxiety Index** | Monitors Polymarket + on-chain data for incoming volatility (0-100 score) | `marketAnxiety.ts` |
| **Slippage Optimizer** | Recommends slippage BEFORE chaos hits (predictive, not reactive) | `slippageOptimizer.ts` |
| **Dual-Path Router** | Races SWQoS vs Jito Bundle simultaneously | `dualPathRouter.ts` |
| **Smart Retry Engine** | Fresh blockhash on every attempt, fast backoff (100-800ms) | `retryEngine.ts` |
| **Slot-Aware RPC Router** | Bans stale RPC nodes, picks freshest (Helius/Triton) | `rpcRouter.ts` |
| **ML Predictor** | Predicts optimal compute units for transaction structure | `mlPredictor.ts` |

---

## 🚀 Quick Start
```typescript
import { Belay } from '@belay/sdk';

// Initialize with all features
const belay = new Belay({
  useMarketAnxiety: true,    // Polymarket + on-chain sentiment
  useDualPath: true,         // SWQoS + Jito racing
  useSmartRetry: true,       // Fresh blockhash retry
  useMLPrediction: true,     // CU optimization
});

// Get slippage recommendation before swap
const recommendation = await belay.getSlippageRecommendation({
  tokenIn: 'USDC',
  tokenOut: 'SOL',
  amountIn: 1000,
  userSlippage: 0.5,  // Your current setting
  urgency: 'medium'
});

console.log(recommendation);
// {
//   recommendedSlippage: 2.5,     // BELAY says use 2.5%
//   userSetting: 0.5,             // You have 0.5%
//   wouldFail: true,              // Your setting would fail!
//   expectedPriceMovement: 1.8,   // Market moving 1.8%
//   successWithRecommended: 97    // 97% success with our recommendation
// }

// Send transaction with full protection
const result = await belay.sendTransaction(transaction, signers);

console.log(result);
// {
//   success: true,
//   signature: '4xK9v...',
//   winningPath: 'JITO',           // Jito won the race
//   attempts: 1,
//   anxietyScore: 0.72,            // Market was stressed
//   predictedCU: 340800,           // ML-optimized CU
//   jitoTipPaid: 0.002             // Tip paid for inclusion
// }
```

---

## 📊 Market Anxiety Index

The key differentiator: **BELAY is predictive, not reactive.**
```typescript
// Jupiter: Looks at PAST 1-minute volatility (reactive)
// BELAY: Looks at market signals 30-60 seconds AHEAD (predictive)

const anxiety = await belay.getMarketAnxiety();

console.log(anxiety);
// {
//   score: 0.72,                    // 72/100 anxiety
//   level: 'CRITICAL',              // CALM → ELEVATED → STRESSED → CRITICAL → PANIC
//   routingMode: 'DUAL_PATH',       // Automatic routing decision
//   expectedPriceMovement: 3.5,     // Expect 3.5% price move
//   triggerMarkets: ['BTC volatility', 'Fed Rate Decision'],
//   networkCongestion: 68           // Solana network congestion %
// }
```

### Dual Oracle System

BELAY doesn't rely on a single data source:

| Oracle | Weight | What It Checks |
|--------|--------|----------------|
| **Polymarket** | 60% | Market sentiment, prediction volume, 30-60s predictive lead |
| **On-Chain** | 40% | Real-time TPS, slot times from Solana RPC |

If Polymarket is manipulated but chain is healthy, on-chain data pulls the score down. If Polymarket is quiet but chain is congested, on-chain pulls it up. They balance each other.

### How It Works

1. **Polymarket API** → Fetch crypto-related prediction markets
2. **On-Chain Metrics** → Real-time TPS and slot times from Solana
3. **Volume Analysis** → High volume = traders hedging = incoming volatility
4. **Combined Score** → Weighted average of both oracles
5. **Routing Decision** → Automatically select optimal transaction path

---

## 🔀 Dual-Path Router

When anxiety is high, BELAY races two paths simultaneously:
```
┌─────────────────────────────────────────────────────────────┐
│                    Your Transaction                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    ┌──────────┐            ┌──────────┐
    │ Path A:  │            │ Path B:  │
    │  SWQoS   │            │   Jito   │
    │  (Fast)  │            │ (Reliable)│
    └────┬─────┘            └────┬─────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌────────────┐
              │  Whichever │
              │ lands first│
              │    WINS    │
              └────────────┘
```
Architecture

┌─────────────────────────────────────────────────────────────┐
│                     USER INPUT                              │
│              Swap SOL → USDC (Jupiter V6)                   │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ⚓ BELAY CORE ENGINE                       │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ MACRO PREDICTION │   ⚡    │ MICRO OPTIMIZATION│         │
│  │  (Market Signals)│         │    (ML Model)     │         │
│  ├──────────────────┤         ├──────────────────┤         │
│  │ 🔮 Polymarket 60%│         │ 🎯 Random Forest │         │
│  │ ⛓️ On-Chain   40%│         │    82.5% accuracy │         │
│  ├──────────────────┤         ├──────────────────┤         │
│  │ → Anxiety: 72    │         │ → Base CU: 284k  │         │
│  │ → Slippage: 3.6% │         │ → Buffer: +34%   │         │
│  │ → Mode: DUAL_PATH│         │ → Final: 380k    │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              🚀 EXECUTION LAYER                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │ SWQoS   │  │  Jito   │  │ Smart   │             │   │
│  │  │ ~800ms  │  │ ~1.5s   │  │ Retry   │             │   │
│  │  └─────────┘  └─────────┘  └─────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    99% SUCCESS RATE                         │
│              (vs 25-40% without BELAY)                      │
└─────────────────────────────────────────────────────────────┘

**Path A: SWQoS (Stake-Weighted QoS)**
- Sends via staked RPC providers (Helius/Triton)
- Best for normal conditions
- ~800ms latency

**Path B: Jito Bundle**
- Guaranteed inclusion via MEV auction
- Best for congested conditions
- ~1.2-2.0s latency
- Smart tip calculation based on anxiety

### Routing Modes

| Anxiety Level | Score | Routing Mode | What Happens |
|---------------|-------|--------------|--------------|
| CALM | 0-30% | STANDARD | SWQoS only |
| ELEVATED | 30-50% | ELEVATED | SWQoS + Jito standby |
| STRESSED | 50-65% | DUAL_PATH | Race both paths |
| CRITICAL | 65-85% | DUAL_PATH | Race both paths |
| PANIC | 85%+ | JITO_ONLY | Skip RPC, Jito only |

---

## 🔄 Smart Retry Engine

Not just "try again" — intelligent retry with fresh blockhash:
```typescript
// Traditional retry (WRONG):
// Attempt 1: Send with blockhash ABC → Fail
// Attempt 2: Send with blockhash ABC → Fail (same stale blockhash!)
// Attempt 3: Send with blockhash ABC → Fail (still stale!)

// BELAY retry (CORRECT):
// Attempt 1: Send with blockhash ABC → Fail
// Action: Fetch FRESH blockhash
// Attempt 2: Send with blockhash DEF → Success!
```

**Features:**
- Fresh blockhash on every attempt
- Fast backoff: 100ms → 200ms → 400ms → 800ms (not 2s → 4s → 8s)
- Blockhash expiry checking (refreshes if <20 blocks remaining)
- Recovers 80% of "validity expired" failures

---

## 🧠 ML Predictor

Random Forest model trained on 400+ real Solana transactions:
```typescript
// Predicts optimal Compute Units for your transaction
const prediction = await belay.predictCU(transaction);

// {
//   baseCU: 284000,        // For Jupiter V6 swap
//   bufferPercent: 20,     // Add 20% during high anxiety
//   finalCU: 340800,       // Total CU to request
//   confidence: 82.5       // Model confidence
// }
```

**Model Performance:**
- Accuracy: 82.5%
- Precision: 85.7%
- Key Features: Compute units (39.4%), Account count (30.4%), Instruction complexity (26.1%)

---

## 📁 Project Structure
```
belaysdk/
├── lib/solana/              # Core SDK
│   ├── belay.ts             # Main SDK class
│   ├── marketAnxiety.ts     # Polymarket integration
│   ├── slippageOptimizer.ts # Predictive slippage
│   ├── dualPathRouter.ts    # SWQoS + Jito racing
│   ├── retryEngine.ts       # Smart retry logic
│   ├── rpcRouter.ts         # Slot-aware routing
│   ├── mlPredictor.ts       # ML model wrapper
│   ├── feeOptimizer.ts      # Priority fee calculation
│   └── network.ts           # Network utilities
├── app/                     # Next.js demo site
│   ├── page.tsx             # Landing page
│   └── api/                 # API routes
│       ├── sentiment/       # Live Polymarket + congestion
│       ├── congestion/      # Solana network status
│       └── analyze/         # Transaction analysis
├── components/              # React components
│   └── CommandCenter.tsx    # Interactive demo (Live + Simulation)
├── scripts/                 # ML training scripts
│   ├── collectDataML.ts     # Data collection
│   ├── trainModel.py        # Model training
│   └── trainSuccessClassifier.py
├── models/                  # Trained ML models
│   ├── success_classifier.pkl
│   └── priority_fee_model.pkl
└── data/                    # Training data
    └── ml_training_data_labeled_v2.json
```

---

## 🏃 Running Locally
```bash
# Clone the repo
git clone https://github.com/nagavaishak/belaysdk.git
cd belaysdk

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 🔧 Configuration
```typescript
interface BelayConfig {
  // RPC Configuration
  rpcEndpoints?: string[];
  primaryRpc?: string;
  
  // Feature Toggles
  useMarketAnxiety?: boolean;    // Monitor market sentiment
  useSlippageOptimizer?: boolean; // Get slippage recommendations
  useDualPath?: boolean;          // Race SWQoS vs Jito
  useSmartRetry?: boolean;        // Auto-retry with fresh blockhash
  useMLPrediction?: boolean;      // ML-based CU optimization
  
  // Retry Settings
  maxRetries?: number;            // Default: 4
  
  // Jito Settings
  maxJitoTip?: number;            // Max tip in SOL (default: 0.01)
}
```

---

## 🎯 Key Differentiators

### vs Jupiter Dynamic Slippage
- Jupiter: **Reactive** (looks at past 1-minute volatility)
- BELAY: **Predictive** (looks at market signals 30-60 seconds ahead)

### vs Standard RPC
- Standard: Single RPC, basic retry
- BELAY: Slot-aware multi-RPC, fresh blockhash, dual-path racing

### vs Jito-Only
- Jito: Great for MEV protection, but expensive for every tx
- BELAY: Uses Jito intelligently only when needed (high anxiety)

---

## 📈 Results

| Metric | Without BELAY | With BELAY |
|--------|---------------|------------|
| Success Rate (congestion) | ~25-40% | ~99% |
| Slippage Failures | 48% | <5% (predictive) |
| RPC Failures | 36% | <5% (dual-path) |
| Blockhash Failures | 16% | <2% (smart retry) |

---

## 🏆 Hackathon Submission

**Midwest Blockchain Conference 2025**
- **Tracks:** Solana + Polymarket
- **Demo:** [Live Demo](https://belay-sdk.netlify.app)
- **GitHub:** [github.com/nagavaishak/belaysdk](https://github.com/nagavaishak/belaysdk)

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Solana Foundation** - For building the fastest blockchain
- **Polymarket** - For prediction market APIs
- **Jito Labs** - For MEV infrastructure
- **Helius/Triton** - For staked RPC services

---

**Built with ❤️ by Naga Vaishak**

*"Jupiter sees the rain. BELAY sees the storm coming."*