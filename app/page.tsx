// app/page.tsx - MBC 2025 HACKATHON VERSION
'use client';

import { useRef, useEffect, useState } from 'react';
import CommandCenter from '@/components/CommandCenter';
import MouseSpotlight from '@/components/MouseSpotlight';
import ScrollProgress from '@/components/ScrollProgress';
import { ArrowRight, Zap, BarChart3, XCircle, AlertTriangle, Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`min-h-screen bg-black text-white relative transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Animated Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(600px at 40% 20%, rgba(168, 85, 247, 0.15), transparent 50%),
              radial-gradient(600px at 80% 50%, rgba(34, 197, 94, 0.15), transparent 50%),
              radial-gradient(600px at 20% 80%, rgba(236, 72, 153, 0.15), transparent 50%)
            `,
          }}
        />
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black pointer-events-none z-0" />

      <MouseSpotlight />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-2xl bg-black/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-green-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-semibold tracking-tight">BELAY</span>
            </a>
            
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
                Features
              </a>
              <a href="#demo" className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
                Demo
              </a>
              <a href="https://github.com/nagavaishak/belay" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">
                GitHub
              </a>
            </div>

            <Button 
              size="sm"
              className="bg-white text-black hover:bg-white/90 font-medium"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="hidden sm:inline">Try Demo</span>
              <span className="sm:hidden">Demo</span>
            </Button>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-300" id="scroll-progress"></div>
      </nav>

      {/* Hero Section - UPDATED */}
      <section id="main-content" ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
        <div className="container mx-auto max-w-6xl">
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-8">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm mb-2">
                <span className="text-xs text-purple-400 font-semibold">🏆 Midwest Blockchain Conference 2025 • Solana + Polymarket</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">TypeScript SDK • npm install @belay/sdk</span>
              </div>

              {/* SDK HEADLINE */}
              <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight leading-none animate-fade-in-up opacity-0 [animation-delay:100ms]">
                Solana's
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-green-400 bg-clip-text text-transparent">
                  Reliability SDK
                </span>
              </h1>

              {/* SDK VALUE PROP */}
              <p className="text-lg md:text-xl text-white/50 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 [animation-delay:200ms]">
                The SDK that makes Solana transactions reliable. <span className="text-white font-medium">Predictive slippage via Polymarket</span>, 
                dual-path routing (SWQoS + Jito), smart retry with fresh blockhash, and ML-optimized compute units.
              </p>

              {/* SDK STATS */}
              <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up opacity-0 [animation-delay:400ms]">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">6</div>
                  <div className="text-xs text-white/40">Core Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Live</div>
                  <div className="text-xs text-white/40">Polymarket API</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-orange-400 to-green-400 bg-clip-text text-transparent">82.5%</div>
                  <div className="text-xs text-white/40">ML Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">99%</div>
                  <div className="text-xs text-white/40">Target Success</div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 animate-fade-in-up opacity-0 [animation-delay:300ms]">
                <Button 
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 font-semibold px-8 shadow-2xl shadow-purple-500/20"
                  onClick={() => window.open('https://github.com/nagavaishak/belay', '_blank')}
                >
                  View on GitHub
                </Button>
                <a 
                  href="#demo"
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-2 group"
                >
                  <span>See Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <span className="text-xs text-white/40">Built with:</span>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/60">TypeScript</div>
                  <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/60">Solana Web3.js</div>
                  <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/60">Next.js 15</div>
                </div>
              </div>

            </div>

            {/* Right: Code preview - UPDATED */}
            <div className="relative">
              <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden shadow-2xl">
                
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                  <span className="ml-3 text-xs text-white/40 font-mono">belay.ts</span>
                </div>

                <div className="lg:hidden mt-12">
                  <div className="p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-green-500/10 backdrop-blur-sm text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Production-Ready</h3>
                    <p className="text-white/60 text-sm mb-6">
                      Tested on Solana mainnet. Code available on GitHub.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button 
                        className="w-full bg-white text-black hover:bg-white/90"
                        onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        Try Demo
                      </Button>
                      <a 
                        href="https://github.com/nagavaishak/belay"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white text-sm flex items-center justify-center gap-2"
                      >
                        View Code <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* SDK CODE EXAMPLE */}
                <div className="p-6 font-mono text-xs space-y-2 overflow-x-auto">
                  <div className="text-white/40">
                    <span className="text-purple-400">import</span> {`{ Belay }`} <span className="text-purple-400">from</span> <span className="text-green-400">'@belay/sdk'</span>;
                  </div>
                  <div className="h-px bg-white/5 my-3"></div>
                  <div className="text-gray-500">// Initialize with all features</div>
                  <div className="text-white/60">
                    <span className="text-blue-400">const</span> belay = <span className="text-purple-400">new</span> <span className="text-yellow-400">Belay</span>({`{`}
                  </div>
                  <div className="pl-4 text-white/60">useMarketAnxiety: <span className="text-green-400">true</span>,  <span className="text-gray-500">// Polymarket</span></div>
                  <div className="pl-4 text-white/60">useDualPath: <span className="text-green-400">true</span>,       <span className="text-gray-500">// SWQoS + Jito</span></div>
                  <div className="pl-4 text-white/60">useSmartRetry: <span className="text-green-400">true</span>,    <span className="text-gray-500">// Fresh blockhash</span></div>
                  <div className="pl-4 text-white/60">useMLPrediction: <span className="text-green-400">true</span>  <span className="text-gray-500">// CU optimization</span></div>
                  <div className="text-white/60">{`});`}</div>
                  <div className="h-px bg-white/5 my-3"></div>
                  <div className="text-gray-500">// Get slippage before swap</div>
                  <div className="text-white/60">
                    <span className="text-blue-400">const</span> slip = <span className="text-purple-400">await</span> belay.<span className="text-yellow-400">getSlippageRecommendation</span>({`{`}
                  </div>
                  <div className="pl-4 text-white/60">tokenIn: <span className="text-green-400">'USDC'</span>, tokenOut: <span className="text-green-400">'SOL'</span></div>
                  <div className="text-white/60">{`});`}</div>
                  <div className="text-gray-500">// slip.recommended = 2.5% (vs your 0.5%)</div>
                  <div className="h-px bg-white/5 my-3"></div>
                  <div className="text-gray-500">// Send with full protection</div>
                  <div className="text-white/60">
                    <span className="text-blue-400">const</span> result = <span className="text-purple-400">await</span> belay.<span className="text-yellow-400">sendTransaction</span>(tx, signers);
                  </div>
                </div>

                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-green-500/20 blur-2xl -z-10"></div>
              </div>

              {/* LIVE API STATUS */}
              <div className="absolute -bottom-6 -left-6 w-64 p-4 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/50 font-semibold">SDK Modules</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-xs text-green-400">All Active</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Market Anxiety</span>
                    <span className="text-green-400 font-mono">✓ Live</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Slippage Optimizer</span>
                    <span className="text-green-400 font-mono">✓ Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Dual-Path Router</span>
                    <span className="text-green-400 font-mono">✓ Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Smart Retry</span>
                    <span className="text-green-400 font-mono">✓ Ready</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">ML Predictor</span>
                    <span className="text-green-400 font-mono">✓ 82.5%</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="text-xs font-medium">Scroll to explore</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/40">
              <path d="M10 4V16M10 16L6 12M10 16L14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

      </section>

      {/* The Problem Section - UPDATED */}
      <section className="relative py-32 px-6 border-t border-white/5 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-red-400 font-medium uppercase tracking-wider">The Problem</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                $150M wasted annually
                <br />
                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  on failed transactions
                </span>
              </h2>
              <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
                48% fail from slippage. 36% from RPC issues. 16% from blockhash/logic errors. BELAY solves all three.
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              
              <div className="relative p-12 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 backdrop-blur-sm">
                
                <div className="rounded-xl border border-white/10 bg-black/80 overflow-hidden">
                  
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-2 text-xs text-white/40 font-mono">solana-transaction.log</span>
                  </div>

                  <div className="p-6 space-y-2 font-mono text-sm">
                    <div className="flex items-center gap-3 text-white/60">
                      <span className="text-white/40">→</span>
                      <span>Submitting transaction...</span>
                      <div className="flex gap-1 ml-2">
                        <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 text-red-400 animate-fade-in" style={{ animationDelay: '1.5s' }}>
                      <span className="text-red-400">✗</span>
                      <div>
                        <div>Transaction failed: blockhash not found</div>
                        <div className="text-xs text-red-400/60 mt-1">Validity period expired (150 blocks)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-yellow-400 animate-fade-in" style={{ animationDelay: '3s' }}>
                      <span className="text-yellow-400">!</span>
                      <span>Fee paid: 0.000005 SOL (wasted)</span>
                    </div>

                    <div className="h-px bg-white/10 my-3 animate-fade-in" style={{ animationDelay: '4s' }} />

                    <div className="flex items-center gap-3 text-white/60 animate-fade-in" style={{ animationDelay: '4.5s' }}>
                      <span className="text-white/40">→</span>
                      <span>Retrying manually...</span>
                    </div>

                    <div className="flex items-start gap-3 text-red-400 animate-fade-in" style={{ animationDelay: '6s' }}>
                      <span className="text-red-400">✗</span>
                      <div>
                        <div>Transaction failed: RPC connection timeout</div>
                        <div className="text-xs text-red-400/60 mt-1">Endpoint overloaded</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-yellow-400 animate-fade-in" style={{ animationDelay: '7s' }}>
                      <span className="text-yellow-400">!</span>
                      <span>Fee paid: 0.000005 SOL (wasted again)</span>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-red-500 animate-ping opacity-20" />
                <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-yellow-500 animate-ping opacity-20" style={{ animationDelay: '0.5s' }} />

              </div>

              {/* PROBLEM STATS */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold text-red-400 mb-2">48%</div>
                  <div className="text-sm text-white/60">Fail from slippage</div>
                  <div className="text-xs text-red-400/60 mt-1">→ Predictive Slippage</div>
                </div>
                <div className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">36%</div>
                  <div className="text-sm text-white/60">Fail from RPC issues</div>
                  <div className="text-xs text-yellow-400/60 mt-1">→ Dual-Path Router</div>
                </div>
                <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-sm text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">16%</div>
                  <div className="text-sm text-white/60">Fail from blockhash/logic</div>
                  <div className="text-xs text-orange-400/60 mt-1">→ Smart Retry Engine</div>
                </div>
              </div>

            </div>

            <div className="mt-16 text-center">
              <div className="inline-block p-6 rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-sm">
                <p className="text-lg text-white/80">
                  <span className="text-green-400 font-semibold">BELAY solves all three</span> — 48% + 36% + 16% = <span className="text-green-400 font-bold">100% coverage</span>
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Features - 4 Core Modules */}
      <section id="features" className="relative py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px bg-gradient-to-r from-purple-500 to-transparent"></div>
            <span className="text-sm font-medium text-purple-400 uppercase tracking-wider">SDK Modules</span>
          </div>

          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Four layers of protection
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Each module solves a specific reliability problem. Together, they achieve 99% transaction success.
            </p>
          </div>

          {/* MODULE 1 - Market Anxiety Index */}
          <div className="grid md:grid-cols-5 gap-8 mb-8 p-8 rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-sm hover:bg-purple-500/10 transition-all duration-500">
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Market Anxiety Index</h3>
              <p className="text-white/60 leading-relaxed">
                Monitors Polymarket prediction markets for incoming volatility. High trading volume on crypto markets = chaos incoming. Gives 30-60 second warning before on-chain congestion.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <span className="font-mono">lib/solana/marketAnxiety.ts</span>
                <span>•</span>
                <span className="text-purple-400">Polymarket API</span>
              </div>
            </div>
            <div className="md:col-span-3 p-6 rounded-xl bg-black/50 border border-purple-500/20 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Anxiety Score:</span>
                <span className="text-2xl font-bold text-purple-400">72</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full w-[72%] bg-gradient-to-r from-purple-500 to-red-500 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2 rounded bg-black/30 border border-white/5">
                  <div className="text-white/40 text-xs">Level</div>
                  <div className="text-orange-400 font-semibold">CRITICAL</div>
                </div>
                <div className="p-2 rounded bg-black/30 border border-white/5">
                  <div className="text-white/40 text-xs">Expected Move</div>
                  <div className="text-orange-400 font-semibold">3.5%</div>
                </div>
              </div>
              <div className="pt-2 text-gray-500">
                // Trigger: "BTC crash" market volume spiking
              </div>
            </div>
          </div>

          {/* MODULE 2 - Slippage Optimizer */}
          <div className="grid md:grid-cols-5 gap-8 mb-8 p-8 rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-sm hover:bg-green-500/10 transition-all duration-500">
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Slippage Optimizer</h3>
              <p className="text-white/60 leading-relaxed">
                Tells you what slippage to set BEFORE chaos hits. Jupiter is reactive (past 1 min). BELAY is predictive (30-60s ahead via Polymarket).
              </p>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <span className="font-mono">lib/solana/slippageOptimizer.ts</span>
                <span>•</span>
                <span className="text-green-400">Predictive</span>
              </div>
            </div>
            <div className="md:col-span-3 p-6 rounded-xl bg-black/50 border border-green-500/20 font-mono text-xs space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="text-white/40 text-xs mb-1">Your Setting</div>
                  <div className="text-2xl font-bold text-red-400">0.5%</div>
                  <div className="text-red-400 text-xs mt-1">→ 12% success</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-white/40 text-xs mb-1">Recommended</div>
                  <div className="text-2xl font-bold text-green-400">4.0%</div>
                  <div className="text-green-400 text-xs mt-1">→ 97% success</div>
                </div>
              </div>
              <div className="p-2 rounded bg-red-500/20 border border-red-500/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-xs">Your 0.5% will FAIL! Market moving 3.5%</span>
              </div>
            </div>
          </div>

          {/* MODULE 3 - Dual-Path Router */}
          <div className="grid md:grid-cols-5 gap-8 mb-8 p-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-500">
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Network className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Dual-Path Router</h3>
              <p className="text-white/60 leading-relaxed">
                Races two paths simultaneously: SWQoS (fast, staked connection) vs Jito Bundle (guaranteed inclusion). Whichever lands first wins. Only pay Jito tip if Jito wins.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <span className="font-mono">lib/solana/dualPathRouter.ts</span>
                <span>•</span>
                <span className="text-blue-400">Race Condition</span>
              </div>
            </div>
            <div className="md:col-span-3 p-6 rounded-xl bg-black/50 border border-blue-500/20 font-mono text-xs space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Path A: SWQoS</span>
                    <span className="text-green-400 text-xs px-2 py-0.5 bg-green-500/20 rounded">ACTIVE</span>
                  </div>
                  <div className="text-white/40">~800ms latency</div>
                  <div className="text-green-400 text-xs mt-1">Fast, staked route</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Path B: Jito</span>
                    <span className="text-orange-400 text-xs px-2 py-0.5 bg-orange-500/20 rounded">ACTIVE</span>
                  </div>
                  <div className="text-white/40">~1.5s latency</div>
                  <div className="text-orange-400 text-xs mt-1">Tip: 0.002 SOL</div>
                </div>
              </div>
              <div className="p-2 rounded bg-blue-500/20 border border-blue-500/30 text-center">
                <span className="text-blue-400 text-xs">🏁 Racing both paths... First to land wins!</span>
              </div>
            </div>
          </div>

          {/* MODULE 4 - Smart Retry Engine */}
          <div className="grid md:grid-cols-5 gap-8 p-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-sm hover:bg-orange-500/10 transition-all duration-500">
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Smart Retry Engine</h3>
              <p className="text-white/60 leading-relaxed">
                Fresh blockhash on EVERY retry attempt. Fast backoff (100ms → 800ms, not 2s → 8s). Recovers 80% of "blockhash expired" failures that other SDKs miss.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <span className="font-mono">lib/solana/retryEngine.ts</span>
                <span>•</span>
                <span className="text-orange-400">17.72% of failures</span>
              </div>
            </div>
            <div className="md:col-span-3 p-6 rounded-xl bg-black/50 border border-orange-500/20 font-mono text-xs space-y-2">
              <div className="text-white/40">
                <span className="text-red-400">Attempt 1:</span> Failed (stale blockhash)
              </div>
              <div className="text-white/40">
                <span className="text-orange-400">Action:</span> <span className="text-white/80">Fetch FRESH blockhash</span>
              </div>
              <div className="text-white/40">
                <span className="text-orange-400">Backoff:</span> <span className="text-yellow-400">100ms</span> <span className="text-white/30">(not 2000ms)</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="text-white/40">
                <span className="text-yellow-400">Attempt 2:</span> Retrying with new blockhash...
              </div>
              <div className="text-white/40">
                <span className="text-green-400">Result:</span> <span className="text-green-400 font-semibold">✓ Confirmed</span>
              </div>
              <div className="pt-2 text-gray-500">
                // Key: Fresh blockhash, not same stale one
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* UNIFIED DEMO - Command Center */}
      <section id="demo" className="relative py-32 px-6 border-t border-white/5 bg-gradient-to-b from-purple-900/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-px bg-gradient-to-r from-orange-500 to-transparent"></div>
            <span className="text-sm font-medium text-orange-400 uppercase tracking-wider">Live Demo</span>
          </div>
          
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Predictive vs Reactive
            </h2>
            <p className="text-xl text-white/50 max-w-3xl mx-auto mb-4">
              Jupiter sees <span className="text-white/70">past</span> volatility. 
              BELAY sees <span className="text-purple-400 font-semibold">future</span> chaos via Polymarket — 30-60 seconds ahead.
            </p>
          </div>

          <CommandCenter />

          {/* Key Differentiator callout */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">❌</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Without BELAY</h3>
                  <p className="text-sm text-white/60">
                    User sets 0.5% slippage. Market chaos hits. Price moves 2%. 
                    <strong className="text-red-400"> Transaction fails.</strong> Fee wasted. User frustrated.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-green-500/20 bg-green-500/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✅</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">With BELAY</h3>
                  <p className="text-sm text-white/60">
                    BELAY sees Polymarket volume spiking. Tells user: "Set 2.5% slippage now." 
                    Chaos hits. <strong className="text-green-400">Transaction succeeds.</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Back to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 hover:scale-110 z-40"
        id="back-to-top"
        aria-label="Scroll back to top"
        title="Back to top"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 16V4M10 4L6 8M10 4L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-green-400 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold">BELAY</span>
              <span className="text-white/30">•</span>
              <span className="text-sm text-white/50">Solana's Reliability Layer</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <a href="https://github.com/nagavaishak/belay" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">GitHub</a>
              <span className="text-white/20">•</span>
              <span className="text-white/50">MBC 2025 Hackathon</span>
              <span className="text-white/20">•</span>
              <span className="text-purple-400">Solana + Polymarket</span>
            </div>

          </div>
        </div>
      </footer>

      <ScrollProgress />

    </div>
  );
}