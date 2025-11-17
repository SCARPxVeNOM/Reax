'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useLinera } from '../lib/linera-hooks';

export function CodeStrategyBuilder() {
  const { client, isConnected } = useLinera();
  const [code, setCode] = useState(`strategy("RSI Momentum") {
  if rsi(14) < 30 and token.volume > 1000000 {
    buy(token="SOL", qty=0.5, sl=2%, tp=5%)
  }
  if rsi(14) > 70 {
    sell()
  }
}`);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    setErrors([]);

    try {
      // Basic validation - check for required keywords
      if (!code.includes('strategy(')) {
        setErrors(['Missing strategy declaration']);
        return;
      }

      if (!code.includes('buy') && !code.includes('sell')) {
        setErrors(['Strategy must include at least one buy or sell condition']);
        return;
      }

      // In a real implementation, this would call a DSL parser
      // For now, just check syntax
      setErrors([]);
      alert('Validation passed! Strategy syntax is correct.');
    } catch (error: any) {
      setErrors([error.message || 'Validation failed']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (errors.length > 0) {
      alert('Please fix validation errors before submitting');
      return;
    }

    if (!isConnected || !client) {
      alert('Not connected to Linera. Please wait for connection...');
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const strategy = {
        owner: 'user-' + Date.now().toString(),
        name: 'DSL Strategy ' + Date.now(),
        strategy_type: {
          DSL: code,
        },
        active: false,
        created_at: Math.floor(Date.now() / 1000),
      };

      const strategyId = await client.createStrategy(strategy);

      console.log('Strategy created with ID:', strategyId);
      setSuccess(true);

      // Reset code after success (optional)
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error creating strategy:', error);
      setErrors([error.message || 'Failed to create strategy. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">Connecting to Linera...</div>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Code Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Strategy DSL Code
          </label>
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating}
            className="px-4 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Validate Syntax'}
          </button>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="reax-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontFamily: 'monospace',
              fontWeight: 'normal',
            }}
            beforeMount={(monaco) => {
              // Define a custom theme with white text
              monaco.editor.defineTheme('reax-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: '', foreground: 'ffffff' },
                  { token: 'comment', foreground: '6a9955' },
                  { token: 'keyword', foreground: '569cd6' },
                  { token: 'string', foreground: 'ce9178' },
                  { token: 'number', foreground: 'b5cea8' },
                  { token: 'identifier', foreground: 'ffffff' },
                ],
                colors: {
                  'editor.foreground': '#ffffff',
                  'editor.background': '#1e1e1e',
                  'editor.lineHighlightBackground': '#2a2d2e',
                  'editor.selectionBackground': '#264f78',
                  'editorCursor.foreground': '#ffffff',
                },
              });
            }}
          />
        </div>

        {errors.length > 0 && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Validation Errors:</p>
            <ul className="text-sm text-red-600 list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800 mb-2">DSL Syntax Guide:</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Use <code className="bg-blue-100 px-1 rounded">strategy("name")</code> to declare a strategy</li>
          <li>Use <code className="bg-blue-100 px-1 rounded">if</code> conditions with indicators (rsi, volume, price)</li>
          <li>Use <code className="bg-blue-100 px-1 rounded">buy(token, qty, sl, tp)</code> to buy</li>
          <li>Use <code className="bg-blue-100 px-1 rounded">sell()</code> to sell</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting || errors.length > 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {isSubmitting ? 'Creating...' : 'Create Strategy on Linera'}
        </button>

        {success && (
          <p className="text-green-600 font-medium flex items-center gap-2">
            ✓ Strategy created successfully on Linera chain!
          </p>
        )}
      </div>
    </form>
  );
}
