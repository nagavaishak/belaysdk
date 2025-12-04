// components/ExecutionPipeline.tsx
'use client';

import { Brain, Radio, Shuffle, Zap, X } from 'lucide-react';
import React, { useState } from 'react';

const stages = [
  {
    title: 'ML Prediction Layer',
    subtitle: 'Historical intelligence from 100+ transactions',
    icon: Brain,
    gradient: 'from-purple-500/20 to-purple-600/20',
    borderColor: 'border-purple-500/30',
    accentColor: 'purple',
    data: [
      { label: 'Program', value: 'Jupiter V6' },
      { label: 'Historical', value: '284k CU' },
      { label: 'Predicted', value: '499k CU', highlight: true },
      { label: 'Confidence', value: '95%' },
    ],
    latency: '~50ms',
    details: {
      description: 'Our ML model analyzes 100+ real mainnet transactions to predict optimal compute units. It learns program-specific patterns and recommends parameters with 85% accuracy.',
      tech: [
        'Data source: Helius RPC + Solscan',
        'Model: Statistical analysis on historical CU usage',
        'Training set: Jupiter (86% success), Raydium (74% success)',
        'Output: 95th percentile + 10% safety margin'
      ],
      codeSnippet: `const prediction = mlModel.predict({
  program: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  instruction: "route",
  accounts: 15
});
// Returns: { cu: 499000, confidence: 0.95 }`
    }
  },
  {
    title: 'Network Intelligence',
    subtitle: 'Real-time congestion monitoring',
    icon: Radio,
    gradient: 'from-green-500/20 to-green-600/20',
    borderColor: 'border-green-500/30',
    accentColor: 'green',
    data: [
      { label: 'Slot Time', value: '420ms' },
      { label: 'Congestion', value: '32%' },
      { label: 'Multiplier', value: '1.0x', highlight: true },
      { label: 'Status', value: 'Optimal' },
    ],
    latency: '~8ms',
    details: {
      description: 'Queries Solana RPC every 10 seconds to track network performance. When congestion hits 85%, automatically increases compute units by 30% and doubles priority fees.',
      tech: [
        'Update frequency: Every 10 seconds',
        'Data points: Last 20 performance samples',
        'Baseline: 400ms slot time (normal)',
        'Critical threshold: 1000ms+ (high congestion)'
      ],
      codeSnippet: `const samples = await connection.getRecentPerformanceSamples(20);
const avgSlotTime = samples.reduce((a, b) => 
  a + b.samplePeriodSecs / b.numSlots, 0
) / samples.length;

if (avgSlotTime > 0.8) {
  cuMultiplier = 1.3; // +30% CU
  priorityFeeMultiplier = 2.0; // 2x fee
}`
    }
  },
  {
    title: 'Dynamic Optimizer',
    subtitle: 'Intelligent parameter adjustment',
    icon: Shuffle,
    gradient: 'from-blue-500/20 to-blue-600/20',
    borderColor: 'border-blue-500/30',
    accentColor: 'blue',
    data: [
      { label: 'Base CU', value: '499k' },
      { label: 'Adjusted', value: '499k', highlight: true },
      { label: 'Priority Fee', value: '0.0001 SOL' },
      { label: 'Total Cost', value: '$0.0003' },
    ],
    latency: '~4ms',
    details: {
      description: 'Combines ML predictions with real-time network data to calculate final transaction parameters. Balances success probability with cost efficiency.',
      tech: [
        'Combines: ML base + network multiplier',
        'Fee calculation: Uses Helius Priority Fee API',
        'Auto-adjustment: Increases on retry attempts',
        'Cost optimization: Recommends 50th-95th percentile fees'
      ],
      codeSnippet: `const finalCU = Math.ceil(
  mlPrediction.cu * networkMultiplier
);

const priorityFee = await getPriorityFee({
  percentile: congestion > 0.8 ? 95 : 50,
  lookbackSlots: 150
});

return { computeUnits: finalCU, priorityFee };`
    }
  },
  {
    title: 'Multi-RPC Router',
    subtitle: '3x redundancy across providers',
    icon: Zap,
    gradient: 'from-pink-500/20 to-pink-600/20',
    borderColor: 'border-pink-500/30',
    accentColor: 'pink',
    data: [
      { label: 'Helius', value: '120ms', highlight: true },
      { label: 'Triton', value: '145ms' },
      { label: 'QuickNode', value: '132ms' },
      { label: 'Selected', value: 'Primary' },
    ],
    latency: '~120ms',
    details: {
      description: 'Maintains connections to 3 premium RPC providers. Health checks every 5 seconds. Routes to fastest endpoint and automatically fails over if one goes down.',
      tech: [
        'Providers: Helius, Triton One, QuickNode',
        'Health check: Latency + success rate',
        'Routing: Fastest endpoint with <200ms latency',
        'Failover: Automatic switch if primary fails'
      ],
      codeSnippet: `const providers = [
  { name: 'Helius', latency: 120, health: 0.99 },
  { name: 'Triton', latency: 145, health: 0.98 },
  { name: 'QuickNode', latency: 132, health: 0.97 }
];

const fastest = providers
  .filter(p => p.health > 0.95)
  .sort((a, b) => a.latency - b.latency)[0];

return fastest.connection;`
    }
  }
];

export default function ExecutionPipeline() {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  return (
    <div className="relative max-w-4xl mx-auto py-12">
      
      {/* Vertical connecting line - centered */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-x-1/2" />

      {/* Stages */}
      <div className="relative space-y-16">
        {stages.map((stage, index) => (
          <div key={index} className="relative">
            
            {/* Animated data particle flowing down */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
              style={{
                animation: `flowDown 4s ease-in-out ${index * 0.8}s infinite`,
                top: '-8px'
              }}
            />

            {/* Stage content - alternating left/right */}
            <div className={`relative flex flex-col md:flex-row items-center gap-8 ${
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            }`}>
              
              {/* Side spacer - hidden on mobile */}
              <div className="flex-1 hidden md:block" />

              {/* Center hexagon node - CLICKABLE */}
              <button
                onClick={() => setExpandedStage(expandedStage === index ? null : index)}
                className="relative flex-shrink-0 group cursor-pointer"
              >
                <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
                  {/* Outer glow ring */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} blur-xl opacity-50 rounded-full scale-150 group-hover:scale-175 transition-all duration-500`} />
                  
                  {/* Hexagon SVG */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: stage.accentColor === 'purple' ? '#a855f7' : stage.accentColor === 'green' ? '#22c55e' : stage.accentColor === 'blue' ? '#3b82f6' : '#ec4899', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: stage.accentColor === 'purple' ? '#9333ea' : stage.accentColor === 'green' ? '#16a34a' : stage.accentColor === 'blue' ? '#2563eb' : '#db2777', stopOpacity: 0.1 }} />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
                      fill={`url(#grad-${index})`}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`text-${stage.accentColor}-500/30 group-hover:scale-110 transition-transform duration-300`}
                      style={{ transformOrigin: 'center' }}
                    />
                  </svg>

                  {/* Icon inside */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <stage.icon className={`w-8 h-8 text-white transition-transform duration-300 ${
                      expandedStage === index ? 'scale-125 rotate-12' : ''
                    }`} />
                  </div>

                  {/* Click hint */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Click to expand</span>
                  </div>
                </div>

                {/* Latency badge */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                  <div className="px-2 py-0.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-sm">
                    <span className="text-[10px] text-white/60 font-mono">{stage.latency}</span>
                  </div>
                </div>
              </button>

              {/* Card content - opposite side */}
              <div className={`flex-1 w-full md:w-auto ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'} text-center`}>
                <div className={`inline-block w-full md:max-w-sm p-6 rounded-2xl bg-gradient-to-br ${stage.gradient} backdrop-blur-xl border ${stage.borderColor} shadow-2xl hover:scale-105 transition-all duration-500`}>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-1">{stage.title}</h3>
                  <p className="text-xs text-white/50 mb-4">{stage.subtitle}</p>

                  {/* Data rows */}
                  <div className="space-y-2.5">
                    {stage.data.map((item, i) => (
                      <div key={i} className={`flex items-center justify-between gap-6 text-sm ${
                        index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                      }`}>
                        <span className="text-white/50 font-medium">{item.label}</span>
                        <span className={`font-mono font-semibold ${
                          item.highlight ? 'text-white' : 'text-white/80'
                        }`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pulse indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
                    </div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Active</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Arrow pointing down (except last) */}
            {index < stages.length - 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[-32px] z-10">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-white/20" />
                  <svg width="12" height="8" viewBox="0 0 12 8" className="text-white/30">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Final result indicator */}
      <div className="mt-20 text-center">
        <div className="inline-block px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
            </div>
            <span className="text-sm font-semibold text-green-400">Transaction Confirmed</span>
            <span className="text-xs text-white/40 font-mono">~182ms total*</span>
          </div>
        </div>
        <p className="text-xs text-white/30 mt-3">*Latency varies based on network conditions and RPC provider</p>
      </div>

      {/* Expanded Detail Modal */}
      {expandedStage !== null && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setExpandedStage(null)}
        >
          <div 
            className="bg-black/80 border border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stages[expandedStage].gradient} border ${stages[expandedStage].borderColor} flex items-center justify-center flex-shrink-0`}>
                    {React.createElement(stages[expandedStage].icon, { className: 'w-8 h-8 text-white' })}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stages[expandedStage].title}</h3>
                    <p className="text-white/60">{stages[expandedStage].subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setExpandedStage(null)}
                  className="text-white/60 hover:text-white transition-colors p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-8">
                
                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${stages[expandedStage].accentColor}-400`}></div>
                    How It Works
                  </h4>
                  <p className="text-white/70 leading-relaxed">
                    {stages[expandedStage].details.description}
                  </p>
                </div>

                {/* Technical Details */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${stages[expandedStage].accentColor}-400`}></div>
                    Technical Details
                  </h4>
                  <div className="space-y-3">
                    {stages[expandedStage].details.tech.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0"></div>
                        <span className="text-white/80 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Snippet */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${stages[expandedStage].accentColor}-400`}></div>
                    Implementation
                  </h4>
                  <div className="rounded-xl border border-white/10 bg-black/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                      <span className="ml-2 text-xs text-white/40 font-mono">optimizer.ts</span>
                    </div>
                    <pre className="p-6 text-sm text-white/80 font-mono overflow-x-auto">
                      <code>{stages[expandedStage].details.codeSnippet}</code>
                    </pre>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Flowing animation */}
      <style jsx>{`
        @keyframes flowDown {
          0% {
            top: -8px;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            top: calc(100% + 8px);
            opacity: 0;
          }
        }
      `}</style>

    </div>
  );
}