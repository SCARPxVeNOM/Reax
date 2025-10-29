'use client';

import { useState } from 'react';
import { FormStrategyBuilder } from './FormStrategyBuilder';
import { CodeStrategyBuilder } from './CodeStrategyBuilder';

export type BuilderMode = 'form' | 'code';

export function StrategyBuilder() {
  const [mode, setMode] = useState<BuilderMode>('form');

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Strategy Builder</h1>
        <p className="text-gray-600 mb-6">
          Create trading strategies using our no-code form builder or write custom DSL code
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('form')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Form Mode
          </button>
          <button
            onClick={() => setMode('code')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'code'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Code Mode
          </button>
        </div>
      </div>

      {/* Builder Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {mode === 'form' ? <FormStrategyBuilder /> : <CodeStrategyBuilder />}
      </div>
    </div>
  );
}
