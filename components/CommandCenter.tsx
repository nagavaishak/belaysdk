// components/CommandCenter.tsx
// BELAY COMMAND CENTER - Live + Simulation Demo
// Shows: Market Anxiety (LIVE from Polymarket) → Slippage → Dual-Path → ML

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield, ShieldAlert, TrendingUp, Brain, Zap, BarChart3, Rocket,
  CheckCircle2, Loader2, AlertTriangle, DollarSign, GitBranch, Target,
  Radio, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type Scenario = 'live' | 'normal' | 'rally' | 'crash' | 'election';
type AnxietyLevel = 'CALM' | 'ELEVATED' | 'STRESSED' | 'CRITICAL' | 'PANIC';
type RoutingMode = 'STANDARD' | 'ELEVATED' | 'DUAL_PATH' | 'JITO_ONLY';

interface DemoState {
  anxiety: {
    score: number;
    level: AnxietyLevel;
    routingMode: RoutingMode;
    expectedMovement: number;
    triggerMarkets: string[];
    networkCongestion: number;
  };
  slippage: {
    userSetting: number;
    recommended: number;
    minimum: number;
    wouldFail: boolean;
    successWithUser: number;
    successWithRecommended: number;
  };
  routing: {
    pathA: { name: string; status: 'ACTIVE' | 'STANDBY' | 'DISABLED'; speed: string };
    pathB: { name: string; status: 'ACTIVE' | 'STANDBY' | 'DISABLED'; speed: string };
    jitoTip: number;
  };
  ml: {
    program: string;
    baseCU: number;
    bufferPercent: number;
    finalCU: number;
    confidence: number;
    priorityFee: number;
  };
  source: 'live' | 'simulation';
  lastUpdated: number;
}

// ============================================================================
// STATIC SCENARIOS (for simulation)
// ============================================================================

const SIMULATED_SCENARIOS: Record<Exclude<Scenario, 'live'>, Omit<DemoState, 'source' | 'lastUpdated'>> = {
  normal: {
    anxiety: { score: 0.22, level: 'CALM', routingMode: 'STANDARD', expectedMovement: 0.3, triggerMarkets: [], networkCongestion: 18 },
    slippage: { userSetting: 0.5, recommended: 0.5, minimum: 0.3, wouldFail: false, successWithUser: 94, successWithRecommended: 94 },
    routing: { pathA: { name: 'SWQoS', status: 'ACTIVE', speed: '~800ms' }, pathB: { name: 'Jito Bundle', status: 'DISABLED', speed: '-' }, jitoTip: 0 },
    ml: { program: 'Jupiter V6', baseCU: 284000, bufferPercent: 10, finalCU: 312400, confidence: 87, priorityFee: 5000 }
  },
  rally: {
    anxiety: { score: 0.58, level: 'STRESSED', routingMode: 'ELEVATED', expectedMovement: 1.2, triggerMarkets: ['SOL >$200', 'Crypto bull run'], networkCongestion: 45 },
    slippage: { userSetting: 0.5, recommended: 1.5, minimum: 1.0, wouldFail: true, successWithUser: 38, successWithRecommended: 96 },
    routing: { pathA: { name: 'SWQoS', status: 'ACTIVE', speed: '~900ms' }, pathB: { name: 'Jito Bundle', status: 'STANDBY', speed: '~1.2s' }, jitoTip: 0.0005 },
    ml: { program: 'Jupiter V6', baseCU: 284000, bufferPercent: 20, finalCU: 340800, confidence: 82, priorityFee: 15000 }
  },
  crash: {
    anxiety: { score: 0.82, level: 'CRITICAL', routingMode: 'DUAL_PATH', expectedMovement: 3.5, triggerMarkets: ['BTC crash', 'Crypto market cap'], networkCongestion: 72 },
    slippage: { userSetting: 0.5, recommended: 4.0, minimum: 3.0, wouldFail: true, successWithUser: 12, successWithRecommended: 97 },
    routing: { pathA: { name: 'SWQoS', status: 'ACTIVE', speed: '~1.5s' }, pathB: { name: 'Jito Bundle', status: 'ACTIVE', speed: '~1.8s' }, jitoTip: 0.002 },
    ml: { program: 'Jupiter V6', baseCU: 284000, bufferPercent: 35, finalCU: 383400, confidence: 76, priorityFee: 50000 }
  },
  election: {
    anxiety: { score: 0.94, level: 'PANIC', routingMode: 'JITO_ONLY', expectedMovement: 5.8, triggerMarkets: ['US Presidential Election', 'Fed Rate Decision'], networkCongestion: 89 },
    slippage: { userSetting: 0.5, recommended: 7.0, minimum: 5.5, wouldFail: true, successWithUser: 4, successWithRecommended: 99 },
    routing: { pathA: { name: 'SWQoS', status: 'DISABLED', speed: '-' }, pathB: { name: 'Jito Bundle', status: 'ACTIVE', speed: '~2.0s' }, jitoTip: 0.005 },
    ml: { program: 'Jupiter V6', baseCU: 284000, bufferPercent: 50, finalCU: 426000, confidence: 71, priorityFee: 100000 }
  }
};

// ============================================================================
// COLORS
// ============================================================================

const ANXIETY_COLORS: Record<AnxietyLevel, { bg: string; text: string; border: string; glow: string }> = {
  CALM: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  ELEVATED: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  STRESSED: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
  PANIC: { bg: 'bg-red-600/20', text: 'text-red-500', border: 'border-red-600/50', glow: 'shadow-red-600/30' }
};

// ============================================================================
// HELPER: Convert live Polymarket data to DemoState
// ============================================================================

function polymarketToState(volatilityScore: number, markets: any[]): DemoState {
  const score = volatilityScore / 100; // 0-1 scale
  
  // Determine anxiety level
  let level: AnxietyLevel = 'CALM';
  let routingMode: RoutingMode = 'STANDARD';
  
  if (volatilityScore >= 80) {
    level = 'PANIC';
    routingMode = 'JITO_ONLY';
  } else if (volatilityScore >= 65) {
    level = 'CRITICAL';
    routingMode = 'DUAL_PATH';
  } else if (volatilityScore >= 50) {
    level = 'STRESSED';
    routingMode = 'DUAL_PATH';
  } else if (volatilityScore >= 30) {
    level = 'ELEVATED';
    routingMode = 'ELEVATED';
  }
  
  // Calculate expected price movement based on volatility
  const expectedMovement = score * 5; // 0-5% range
  
  // Calculate recommended slippage
  const baseSlippage = 0.5;
  const multiplier = level === 'CALM' ? 1 : level === 'ELEVATED' ? 1.5 : level === 'STRESSED' ? 2.5 : level === 'CRITICAL' ? 4 : 6;
  const recommendedSlippage = Math.max(baseSlippage * multiplier, expectedMovement * 1.2);
  const minimumSlippage = recommendedSlippage * 0.75;
  
  // Calculate Jito tip
  const jitoTip = score > 0.5 ? Math.round(score * score * 10000) / 10000 : 0;
  
  // Get market names for triggers
  const triggerMarkets = markets.slice(0, 3).map((m: any) => 
    (m.question || 'Unknown market').slice(0, 40)
  );
  
  // Calculate speeds based on congestion
  const baseLatency = 800;
  const congestionMultiplier = 1 + (score * 0.8);
  const pathASpeed = `~${Math.round(baseLatency * congestionMultiplier)}ms`;
  const pathBSpeed = routingMode === 'STANDARD' ? '-' : `~${Math.round(1200 * congestionMultiplier)}ms`;
  
  return {
    anxiety: {
      score: score, // 0-1 scale to match simulated scenarios
      level,
      routingMode,
      expectedMovement: Math.round(expectedMovement * 100) / 100,
      triggerMarkets: triggerMarkets.length > 0 ? triggerMarkets : ['Polymarket crypto markets'],
      networkCongestion: Math.round(volatilityScore * 0.6),
    },
    slippage: {
      userSetting: 0.5,
      recommended: Math.round(recommendedSlippage * 100) / 100,
      minimum: Math.round(minimumSlippage * 100) / 100,
      wouldFail: expectedMovement > 0.5,
      successWithUser: Math.max(5, Math.round(100 - (expectedMovement * 20))),
      successWithRecommended: Math.min(99, 85 + Math.round((100 - volatilityScore) * 0.14)),
    },
    routing: {
      pathA: {
        name: 'SWQoS',
        status: routingMode === 'JITO_ONLY' ? 'DISABLED' : 'ACTIVE',
        speed: pathASpeed,
      },
      pathB: {
        name: 'Jito Bundle',
        status: routingMode === 'STANDARD' ? 'STANDBY' : routingMode === 'ELEVATED' ? 'STANDBY' : 'ACTIVE',
        speed: pathBSpeed,
      },
      jitoTip,
    },
    ml: {
      program: 'Jupiter V6',
      baseCU: 284000,
      bufferPercent: 10 + Math.round(score * 40),
      finalCU: Math.round(284000 * (1.1 + score * 0.4)),
      confidence: 82.5,
      priorityFee: Math.round(5000 + (score * 50000)),
    },
    source: 'live' as const,
    lastUpdated: Date.now(),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CommandCenter() {
  const [mode, setMode] = useState<'live' | 'simulation'>('live');
  const [activeScenario, setActiveScenario] = useState<Scenario>('live');
  const [state, setState] = useState<DemoState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txResult, setTxResult] = useState<{ success: boolean; path: string; time: number } | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [selectedRPC, setSelectedRPC] = useState<'Helius' | 'Triton'>('Helius');

  // Fetch LIVE data from Polymarket (client-side)
  const fetchLiveData = useCallback(async () => {
    try {
      console.log('[BELAY] Fetching live Polymarket data...');
      
      // Fetch directly from Polymarket CLOB API (client-side)
      const response = await fetch('https://clob.polymarket.com/markets', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`Polymarket API error: ${response.status}`);
      
      const data = await response.json();

      // Handle different API response formats
      let markets: any[] = [];
      if (Array.isArray(data)) {
        markets = data;
      } else if (data && typeof data === 'object') {
        // API might return { data: [...] } or { markets: [...] } or { results: [...] }
        markets = data.data || data.markets || data.results || [];
      }

      console.log(`[BELAY] Received ${markets.length} markets from Polymarket`);

      // If still no markets, throw to trigger fallback
      if (!Array.isArray(markets) || markets.length === 0) {
        throw new Error('No markets data received');
      }

      // Filter for crypto-related markets
      const cryptoTerms = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto'];
      const cryptoMarkets = markets.filter((m: any) => {
        const question = (m.question || '').toLowerCase();
        return cryptoTerms.some(term => question.includes(term));
      }).slice(0, 10);
      
      console.log(`[BELAY] Found ${cryptoMarkets.length} crypto markets`);
      
      // Calculate volatility from market activity
      let volatilityScore = 25; // Base score
      
      if (cryptoMarkets.length > 0) {
        // Volume-based scoring
        const totalVolume = cryptoMarkets.reduce((sum: number, m: any) => {
          return sum + (parseFloat(m.volume) || 0);
        }, 0);
        
        // Price uncertainty scoring (markets near 50/50 = high uncertainty)
        const avgUncertainty = cryptoMarkets.reduce((sum: number, m: any) => {
          const price = parseFloat(m.outcomePrices?.[0]) || 0.5;
          return sum + (0.5 - Math.abs(price - 0.5)); // Higher when close to 0.5
        }, 0) / cryptoMarkets.length;
        
        // Volume component (0-40 points)
        const volumeScore = Math.min((totalVolume / 5000000) * 40, 40);
        
        // Uncertainty component (0-40 points)  
        const uncertaintyPoints = avgUncertainty * 80;
        
        // Activity component (0-20 points)
        const activityScore = Math.min(cryptoMarkets.length * 2, 20);
        
        // Base score from real data
        const baseScore = volumeScore + uncertaintyPoints + activityScore;

        // Add time-based variation for demo (±15 points swing over ~2 minutes)
        const timeVariation = Math.sin(Date.now() / 60000) * 15;

        volatilityScore = Math.round(baseScore + timeVariation);
        volatilityScore = Math.max(15, Math.min(volatilityScore, 95)); // Clamp 15-95
        
        console.log(`[BELAY] Calculated volatility: ${volatilityScore} (vol=${volumeScore.toFixed(1)}, unc=${uncertaintyPoints.toFixed(1)}, act=${activityScore})`);
      }
      
      // Simulate RPC selection (in real SDK, this comes from rpcRouter.ts)
      setSelectedRPC(Math.random() > 0.3 ? 'Helius' : 'Triton');
      
      // Convert to our state format
      const newState = polymarketToState(volatilityScore, cryptoMarkets);
      setState(newState);
      setLastFetchTime(Date.now());
      
      console.log(`[BELAY] ✅ Live data loaded. Anxiety: ${newState.anxiety.score}, Level: ${newState.anxiety.level}`);
      
    } catch (error) {
      console.error('[BELAY] ❌ Failed to fetch Polymarket data:', error);
      console.log('[BELAY] Falling back to simulation mode');
      // Fallback to normal scenario
      setState({ ...SIMULATED_SCENARIOS.normal, source: 'simulation', lastUpdated: Date.now() });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + polling for live mode
  useEffect(() => {
    if (mode === 'live') {
      fetchLiveData();
      const interval = setInterval(fetchLiveData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [mode, fetchLiveData]);

  // Switch scenario
  const switchScenario = async (scenario: Scenario) => {
    if (scenario === activeScenario || isTransitioning) return;
    setIsTransitioning(true);
    setTxResult(null);
    
    await new Promise(r => setTimeout(r, 100));
    setActiveScenario(scenario);
    
    if (scenario === 'live') {
      setMode('live');
      setIsLoading(true);
      await fetchLiveData();
    } else {
      setMode('simulation');
      setState({ ...SIMULATED_SCENARIOS[scenario], source: 'simulation', lastUpdated: Date.now() });
    }
    
    await new Promise(r => setTimeout(r, 200));
    setIsTransitioning(false);
  };

  // Execute transaction
  const executeTransaction = async () => {
    if (!state) return;
    setIsSending(true);
    setTxResult(null);
    
    const executionTime = 800 + (state.anxiety.score * 1200) + (Math.random() * 500);
    await new Promise(r => setTimeout(r, executionTime));
    
    let winningPath = 'SWQoS';
    if (state.anxiety.routingMode === 'JITO_ONLY') winningPath = 'Jito Bundle';
    else if (state.anxiety.routingMode === 'DUAL_PATH') winningPath = Math.random() > 0.4 ? 'Jito Bundle' : 'SWQoS';
    
    setTxResult({ success: true, path: winningPath, time: Math.round(executionTime) });
    setIsSending(false);
  };

  if (!state || isLoading) {
    return (
      <Card className="p-8 backdrop-blur-xl bg-black/40 border-white/10">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="text-white/60">Fetching live market data from Polymarket...</span>
        </div>
      </Card>
    );
  }

  const colors = ANXIETY_COLORS[state.anxiety.level];

  return (
    <div className="space-y-4">
      <Card className={`p-6 backdrop-blur-xl bg-black/40 border-2 transition-all duration-500 ${colors.border} ${colors.glow} shadow-2xl`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${colors.bg}`}>
              <Shield className={`w-8 h-8 ${colors.text}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">BELAY Command Center</h2>
              <p className="text-sm text-white/50">Predictive Transaction Infrastructure</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
              {state.anxiety.level}
            </Badge>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${state.source === 'live' ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/10 border border-white/20'}`}>
              {state.source === 'live' ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-white/40" />}
              <span className={`text-xs font-medium ${state.source === 'live' ? 'text-green-400' : 'text-white/40'}`}>
                {state.source === 'live' ? 'LIVE' : 'SIMULATION'}
              </span>
            </div>
            {state.source === 'live' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  console.log('[BELAY] Manual refresh triggered');
                  fetchLiveData();
                }} 
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 text-white/40 hover:text-white ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Four Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          
          {/* Column 1: Market Anxiety Index */}
          <div className={`p-5 rounded-2xl border-2 transition-all duration-500 ${colors.bg} ${colors.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className={`w-5 h-5 ${colors.text}`} />
                <span className="text-sm font-semibold text-white">Market Anxiety</span>
              </div>
              <span className="text-xs text-white/40">Polymarket</span>
            </div>
            
            <div className={`text-5xl font-bold mb-2 ${colors.text}`}>
              {Math.round(state.anxiety.score * 100)}
            </div>
            <div className="text-sm text-white/40 mb-3">/ 100</div>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full transition-all duration-500 ${
                  state.anxiety.level === 'CALM' ? 'bg-green-500' :
                  state.anxiety.level === 'ELEVATED' ? 'bg-yellow-500' :
                  state.anxiety.level === 'STRESSED' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${state.anxiety.score * 100}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs text-white/40">Price Move</div>
                <div className={`font-bold ${colors.text}`}>{state.anxiety.expectedMovement}%</div>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs text-white/40">Network</div>
                <div className={`font-bold ${colors.text}`}>{state.anxiety.networkCongestion}%</div>
              </div>
            </div>
            
            {state.anxiety.triggerMarkets.length > 0 && (
              <div className="text-xs text-white/40">
                <div className="mb-1">Active Markets:</div>
                {state.anxiety.triggerMarkets.map((m, i) => (
                  <div key={i} className="truncate text-white/60">↗ {m}</div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Slippage Optimizer */}
          <div className="p-5 rounded-2xl border-2 border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-semibold text-white">Slippage</span>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">PREDICTIVE</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                <div className="text-xs text-white/40">Your Setting</div>
                <div className="text-2xl font-bold text-white">{state.slippage.userSetting}%</div>
                <div className={`text-xs ${state.slippage.wouldFail ? 'text-red-400' : 'text-green-400'}`}>{state.slippage.successWithUser}% success</div>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-xs text-white/40">Recommended</div>
                <div className="text-2xl font-bold text-green-400">{state.slippage.recommended}%</div>
                <div className="text-xs text-green-400">{state.slippage.successWithRecommended}% success</div>
              </div>
            </div>
            
            {state.slippage.wouldFail && (
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">Will Fail!</span>
                </div>
              </div>
            )}
            
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-xs text-purple-300">Jupiter = reactive. BELAY = <span className="font-semibold">predictive</span>.</div>
            </div>
          </div>

          {/* Column 3: Dual-Path Routing */}
          <div className="p-5 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-white">Routing</span>
              </div>
              <Badge className={`text-xs ${state.anxiety.routingMode === 'DUAL_PATH' ? 'bg-blue-500/20 text-blue-400' : state.anxiety.routingMode === 'JITO_ONLY' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/60'}`}>
                {state.anxiety.routingMode.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className={`p-3 rounded-xl border mb-2 ${state.routing.pathA.status === 'ACTIVE' ? 'bg-green-500/10 border-green-500/30' : state.routing.pathA.status === 'STANDBY' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${state.routing.pathA.status === 'ACTIVE' ? 'text-green-400' : 'text-white/40'}`} />
                  <span className="text-sm text-white">SWQoS</span>
                </div>
                <span className={`text-xs ${state.routing.pathA.status === 'ACTIVE' ? 'text-green-400' : 'text-white/40'}`}>{state.routing.pathA.status}</span>
              </div>
              <div className="text-xs text-white/40 mt-1">{state.routing.pathA.speed}</div>
              <div className="text-xs text-green-400/70 mt-1">
                via {selectedRPC} {selectedRPC === 'Helius' ? '⚡' : '🔷'}
              </div>
            </div>
            
            <div className={`p-3 rounded-xl border ${state.routing.pathB.status === 'ACTIVE' ? 'bg-orange-500/10 border-orange-500/30' : state.routing.pathB.status === 'STANDBY' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${state.routing.pathB.status === 'ACTIVE' ? 'text-orange-400' : 'text-white/40'}`} />
                  <span className="text-sm text-white">Jito Bundle</span>
                </div>
                <span className={`text-xs ${state.routing.pathB.status === 'ACTIVE' ? 'text-orange-400' : 'text-white/40'}`}>{state.routing.pathB.status}</span>
              </div>
              <div className="text-xs text-white/40 mt-1">{state.routing.pathB.speed}</div>
              {state.routing.jitoTip > 0 && <div className="text-xs text-orange-400 mt-1">Tip: {state.routing.jitoTip} SOL</div>}
            </div>
            
            {state.anxiety.routingMode === 'DUAL_PATH' && (
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-2">
                <div className="text-xs text-blue-300">Racing both paths!</div>
              </div>
            )}
          </div>

          {/* Column 4: ML Prediction */}
          <div className="p-5 rounded-2xl border-2 border-cyan-500/30 bg-cyan-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold text-white">ML Prediction</span>
              </div>
              <span className="text-xs text-white/40">82.5% acc</span>
            </div>
            
            <div className="p-2 rounded-lg bg-black/30 border border-white/5 mb-3">
              <div className="text-xs text-white/40">Program</div>
              <div className="text-lg font-bold text-cyan-400">{state.ml.program}</div>
            </div>
            
            <div className="space-y-1 text-sm mb-3">
              <div className="flex justify-between"><span className="text-white/50">Base CU</span><span className="text-white font-mono">{state.ml.baseCU.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/50">+ Buffer</span><span className="text-cyan-400 font-mono">+{state.ml.bufferPercent}%</span></div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between"><span className="text-white">Final CU</span><span className="text-cyan-400 font-bold">{state.ml.finalCU.toLocaleString()}</span></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-center">
                <div className="text-xs text-white/40">Confidence</div>
                <div className="text-lg font-bold text-cyan-400">{state.ml.confidence}%</div>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-center">
                <div className="text-xs text-white/40">Priority</div>
                <div className="text-lg font-bold text-cyan-400">{(state.ml.priorityFee / 1000).toFixed(0)}k</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="mb-6">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Mode Selection</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(['live', 'normal', 'rally', 'crash', 'election'] as Scenario[]).map((scenario) => {
              const isLive = scenario === 'live';
              const isActive = activeScenario === scenario;
              return (
                <Button
                  key={scenario}
                  variant="outline"
                  onClick={() => switchScenario(scenario)}
                  disabled={isTransitioning}
                  className={`h-auto py-3 flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? isLive ? 'bg-green-500/20 border-green-500/50 text-green-400' : `${colors.bg} ${colors.border} ${colors.text}`
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{isLive ? '📡' : scenario === 'normal' ? '☀️' : scenario === 'rally' ? '🚀' : scenario === 'crash' ? '📉' : '🗳️'}</span>
                  <span className="text-xs font-medium capitalize">{isLive ? 'Live Data' : scenario === 'election' ? 'Election' : scenario}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Execute Button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={executeTransaction}
            disabled={isSending}
            className={`px-8 py-6 text-lg font-bold shadow-xl ${state.anxiety.level === 'PANIC' ? 'bg-gradient-to-r from-red-600 to-orange-600' : state.anxiety.level === 'CRITICAL' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-purple-600 to-blue-600'} text-white`}
          >
            {isSending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Executing...</> : <><Rocket className="w-5 h-5 mr-2" />Execute Protected Transaction</>}
          </Button>

          {txResult && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/20 border border-green-500/30">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Confirmed via {txResult.path} in {txResult.time}ms</span>
            </div>
          )}
        </div>
      </Card>

      <div className="text-center py-2">
        <p className="text-white/30 text-sm italic">"Jupiter sees the rain. BELAY sees the storm coming."</p>
      </div>
    </div>
  );
}
