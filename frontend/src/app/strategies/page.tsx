'use client';

import { useState, useRef } from 'react';
import { useLineraContext } from '@/components/LineraProvider';
import { useMicrochain } from '@/components/MicrochainContext';
import { microchainService } from '@/lib/microchain-service';
import { GlassCard, GlowButton, GlassInput, GradientText } from '@/components/ui';
import {
  Palette,
  Image as ImageIcon,
  Code,
  Plus,
  Upload,
  Play,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

type CreationMethod = 'visual' | 'image' | 'pinescript';

export default function StrategiesPage() {
  const { isConnected } = useLineraContext();
  const { addStrategy, refreshStrategies } = useMicrochain();
  const [method, setMethod] = useState<CreationMethod>('visual');
  const [strategyName, setStrategyName] = useState('');
  const [pineCode, setPineCode] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const methods = [
    { id: 'visual', name: 'Visual Builder', icon: <Palette size={24} />, desc: 'Drag & drop rule blocks' },
    { id: 'image', name: 'Image-Based', icon: <ImageIcon size={24} />, desc: 'Upload chart, mark entries' },
    { id: 'pinescript', name: 'PineScript', icon: <Code size={24} />, desc: 'Write or paste code' },
  ];

  const availableTags = ['Crypto', 'Forex', 'Stocks', 'DeFi', 'Scalping', 'Swing', 'Day Trade', 'Automated'];

  const handlePublish = async () => {
    if (!strategyName) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const strategy = await microchainService.publishStrategy({
        name: strategyName,
        creationMethod: method,
        code: method === 'pinescript' ? pineCode : undefined,
        rules: method === 'visual' ? { entries: [], exits: [] } : undefined,
        tags,
        riskLevel,
        visibility: 'public',
      });

      console.log('Strategy published:', strategy);

      // Add to context so it appears immediately on Social page
      addStrategy(strategy);

      // Refresh strategies in context
      await refreshStrategies();

      setPublished(true);
    } catch (error) {
      console.error('Failed to publish strategy:', error);
      setPublishError(error instanceof Error ? error.message : 'Failed to publish to Linera. Please check your connection.');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // PineScript Validation Function
  const validatePineScript = () => {
    setIsValidating(true);
    setValidationResult(null);

    // Simulate async validation
    setTimeout(() => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const code = pineCode.trim();

      if (!code) {
        errors.push('Script is empty. Please enter PineScript code.');
      } else {
        // Check for version declaration
        if (!code.includes('//@version=')) {
          warnings.push('Missing version declaration (e.g., //@version=5)');
        }

        // Check for strategy or indicator declaration
        if (!code.includes('strategy(') && !code.includes('indicator(')) {
          errors.push('Missing strategy() or indicator() declaration.');
        }

        // Check for entry/exit logic
        if (code.includes('strategy(')) {
          if (!code.includes('strategy.entry') && !code.includes('strategy.order')) {
            warnings.push('No entry logic found (strategy.entry or strategy.order).');
          }
          if (!code.includes('strategy.close') && !code.includes('strategy.exit')) {
            warnings.push('No exit logic found (strategy.close or strategy.exit).');
          }
        }

        // Check for common syntax patterns
        if (code.includes('if (') && !code.includes('if (') && !code.match(/^\s+/m)) {
          warnings.push('Indentation may be incorrect. PineScript uses indentation for blocks.');
        }

        // Check balanced parentheses
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing.`);
        }
      }

      setValidationResult({
        valid: errors.length === 0,
        errors,
        warnings,
      });
      setIsValidating(false);
    }, 800); // Simulate processing time
  };

  if (published) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center bg-[url('/grid.svg')] bg-center">
        <GlassCard className="p-12 max-w-2xl w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white">Strategy Published!</h1>
            <p className="text-gray-400 text-lg mb-2">
              Your strategy <span className="text-white font-bold">{strategyName}</span> is now live.
            </p>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              {isConnected
                ? 'It has been synced to your Microchain on Linera and is ready for execution.'
                : 'It is queued for sync once the Linera backend connects.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/social">
                <GlowButton size="lg" icon={<TrendingUp size={18} />}>View in Social</GlowButton>
              </Link>
              <GlowButton variant="secondary" size="lg" onClick={() => setPublished(false)}>Create Another</GlowButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-[url('/grid.svg')] bg-center bg-fixed">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4 animate-in">
          <h1 className="text-4xl md:text-5xl font-bold">
            <GradientText>Create Strategy</GradientText>
          </h1>
          <p className="text-gray-400 text-lg">Build, test, and deploy automated trading strategies</p>

          {!isConnected && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
              <AlertTriangle size={16} />
              Demo Mode - Strategies stored locally
            </div>
          )}
        </div>

        {/* Method Selector */}
        <div className="grid md:grid-cols-3 gap-6">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id as CreationMethod)}
              className={`group relative p-6 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${method === m.id
                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
            >
              {method === m.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-100 pointer-events-none" />
              )}
              <div className={`text-4xl mb-4 transition-transform duration-300 group-hover:scale-110 ${method === m.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'
                }`}>
                {m.icon}
              </div>
              <div className={`text-lg font-bold mb-1 ${method === m.id ? 'text-white' : 'text-gray-300 group-hover:text-white'
                }`}>
                {m.name}
              </div>
              <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                {m.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Strategy Name */}
        <GlassCard className="p-8">
          <div className="mb-2 text-sm font-bold text-gray-400 uppercase tracking-wider">Strategy Name</div>
          <GlassInput
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            placeholder="e.g. BTC Momentum Scalper"
            className="text-2xl font-bold bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus:ring-0 focus:border-blue-500 placeholder:text-gray-700 h-16"
          />
        </GlassCard>

        {/* Builder Area */}
        <div className="space-y-6">
          {method === 'visual' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Entry Rules */}
              <GlassCard className="p-6 border-l-4 !border-l-green-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-green-400 font-bold">
                    <TrendingUp size={20} /> Entry Rules
                  </div>
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">IF ALL TRUE</span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors cursor-move">
                    <span className="font-mono text-sm text-gray-300">RSI(14) crosses above 30</span>
                    <div className="w-1.5 h-6 rounded-full bg-gray-700/50 group-hover:bg-gray-600 transition-colors" />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors cursor-move">
                    <span className="font-mono text-sm text-gray-300">Price {'>'} EMA(50)</span>
                    <div className="w-1.5 h-6 rounded-full bg-gray-700/50 group-hover:bg-gray-600 transition-colors" />
                  </div>

                  <button className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-white hover:border-gray-500 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Condition
                  </button>
                </div>
              </GlassCard>

              {/* Exit Rules */}
              <GlassCard className="p-6 border-l-4 !border-l-red-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <TrendingDown size={20} /> Exit Rules
                  </div>
                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">IF ANY TRUE</span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors cursor-move">
                    <span className="font-mono text-sm text-gray-300">Take Profit: +5.0%</span>
                    <div className="w-1.5 h-6 rounded-full bg-gray-700/50 group-hover:bg-gray-600 transition-colors" />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors cursor-move">
                    <span className="font-mono text-sm text-gray-300">Stop Loss: -2.0%</span>
                    <div className="w-1.5 h-6 rounded-full bg-gray-700/50 group-hover:bg-gray-600 transition-colors" />
                  </div>

                  <button className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-white hover:border-gray-500 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Condition
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          {method === 'image' && (
            <GlassCard
              className={`p-12 text-center border-dashed !border-white/10 bg-white/[0.02] transition-all ${isDragging ? 'border-blue-500 bg-blue-500/5' : ''}`}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setUploadedImage(ev.target?.result as string);
                    setUploadedFileName(file.name);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setUploadedImage(ev.target?.result as string);
                      setUploadedFileName(file.name);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              {uploadedImage ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={uploadedImage}
                      alt="Strategy Chart"
                      className="max-h-64 rounded-xl border border-white/10 shadow-lg"
                    />
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadedFileName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">{uploadedFileName}</p>
                  <p className="text-xs text-green-400">✓ Image uploaded successfully</p>
                </div>
              ) : (
                <>
                  <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                    <Upload size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Strategy Chart</h3>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    {isDragging ? 'Drop your image here!' : 'Drag and drop a chart screenshot, or click to browse.'}
                  </p>
                  <GlowButton
                    variant="secondary"
                    icon={<Upload size={18} />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image File
                  </GlowButton>
                </>
              )}
            </GlassCard>
          )}

          {method === 'pinescript' && (
            <GlassCard className="p-0 overflow-hidden">
              <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  <span className="ml-2 font-mono text-xs">strategy.pine</span>
                </div>
                <button
                  onClick={validatePineScript}
                  disabled={isValidating || !pineCode.trim()}
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isValidating ? (
                    <>
                      <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Play size={12} /> Validate Script
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={pineCode}
                onChange={(e) => {
                  setPineCode(e.target.value);
                  setValidationResult(null); // Clear validation on edit
                }}
                className="w-full h-[350px] p-6 bg-[#0A0A0A] font-mono text-sm text-gray-300 resize-none focus:outline-none"
                spellCheck="false"
                placeholder={`//@version=5
strategy("My Strategy", overlay=true)

// Entry condition
longCondition = ta.crossover(ta.sma(close, 14), ta.sma(close, 28))
if (longCondition)
    strategy.entry("Long", strategy.long)

// Exit condition
shortCondition = ta.crossunder(ta.sma(close, 14), ta.sma(close, 28))
if (shortCondition)
    strategy.close("Long")`}
              />

              {/* Validation Results */}
              {validationResult && (
                <div className={`p-4 border-t ${validationResult.valid ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.valid ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-400" />
                        <span className="text-green-400 font-bold text-sm">Script is valid!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} className="text-red-400" />
                        <span className="text-red-400 font-bold text-sm">Validation failed</span>
                      </>
                    )}
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {validationResult.errors.map((err, i) => (
                        <div key={i} className="text-xs text-red-400 font-mono flex items-start gap-2">
                          <span className="text-red-500">✗</span> {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-1">
                      {validationResult.warnings.map((warn, i) => (
                        <div key={i} className="text-xs text-yellow-400 font-mono flex items-start gap-2">
                          <span className="text-yellow-500">⚠</span> {warn}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Configuration */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tags */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              🏷️ Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tags.includes(tag)
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Risk Level */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              ⚠️ Risk Level
            </h3>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  className={`flex-1 py-3 rounded-xl border font-bold text-sm uppercase tracking-wider transition-all ${riskLevel === level
                    ? level === 'low'
                      ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                      : level === 'medium'
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                        : 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'border-white/5 bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Footer Action */}
        <div className="pt-8 pb-12 flex flex-col items-center">
          <GlowButton
            size="lg"
            onClick={handlePublish}
            disabled={!strategyName || isPublishing}
            className="w-full max-w-md h-16 text-lg"
          >
            {isPublishing ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing to Microchain...
              </span>
            ) : (
              'Publish Strategy'
            )}
          </GlowButton>
          <p className="text-sm text-gray-500 mt-4">
            Publishing will deploy this strategy to your Linera microchain for execution.
          </p>
          {publishError && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="font-bold">Publishing Failed</span>
              </div>
              <p className="mt-1 text-red-300/80">{publishError}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
