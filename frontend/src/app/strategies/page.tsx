'use client';

import { useState } from 'react';
import PineScriptEditor from '@/components/PineScriptEditor';
import VisualStrategyBuilder from '@/components/VisualStrategyBuilder';

export default function StrategiesPage() {
  const [mode, setMode] = useState<'pinescript' | 'visual'>('pinescript');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mode Selector */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Strategy Builder</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('pinescript')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'pinescript'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              PineScript Editor
            </button>
            <button
              onClick={() => setMode('visual')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                mode === 'visual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Visual Builder
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)]">
        {mode === 'pinescript' ? (
          <PineScriptEditor />
        ) : (
          <VisualStrategyBuilder />
        )}
      </div>
    </div>
  );
}
