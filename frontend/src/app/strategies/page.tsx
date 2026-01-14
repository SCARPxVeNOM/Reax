'use client';

import { useState } from 'react';
import PineScriptEditor from '@/components/PineScriptEditor';
import VisualStrategyBuilder from '@/components/VisualStrategyBuilder';

export default function StrategiesPage() {
  const [mode, setMode] = useState<'pinescript' | 'visual'>('pinescript');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Mode Selector */}
      <div className="relative glass border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Strategy Builder</h1>
            <p className="text-sm text-gray-400">Create and deploy trading strategies</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('pinescript')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'pinescript'
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              📊 PineScript Editor
            </button>
            <button
              onClick={() => setMode('visual')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'visual'
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              🎨 Visual Builder
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative h-[calc(100vh-100px)]">
        {mode === 'pinescript' ? (
          <PineScriptEditor />
        ) : (
          <VisualStrategyBuilder />
        )}
      </div>
    </div>
  );
}
