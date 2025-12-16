'use client';

import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'react-flow-renderer';
import { visualStrategyApi, strategyApi } from '@/lib/api';

const BLOCK_TYPES = {
  INDICATOR: ['SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER_BANDS'],
  CONDITION: ['CONDITION'],
  ACTION: ['BUY', 'SELL', 'CLOSE'],
  LOGIC: ['AND', 'OR', 'NOT'],
};

export default function VisualStrategyBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedBlockType, setSelectedBlockType] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addBlock = (blockType: string) => {
    const newNode: Node = {
      id: `${blockType}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: blockType,
        config: getDefaultConfig(blockType),
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultConfig = (blockType: string) => {
    switch (blockType) {
      case 'SMA':
      case 'EMA':
        return { length: 20 };
      case 'RSI':
        return { length: 14 };
      case 'MACD':
        return { fastLength: 12, slowLength: 26, signalLength: 9 };
      case 'BOLLINGER_BANDS':
        return { length: 20, stdDev: 2 };
      case 'CONDITION':
        return { operator: '>' };
      case 'BUY':
      case 'SELL':
        return { quantity: 1 };
      default:
        return {};
    }
  };

  const validateStrategy = async () => {
    try {
      const visualData = {
        blocks: nodes.map(node => ({
          id: node.id,
          type: getBlockCategory(node.data.label),
          subtype: node.data.label,
          config: node.data.config,
          position: node.position,
        })),
        connections: edges.map(edge => ({
          id: edge.id,
          sourceBlockId: edge.source,
          sourceOutputId: 'output',
          targetBlockId: edge.target,
          targetInputId: 'input',
        })),
      };

      const result = await visualStrategyApi.validate(visualData);
      
      if (result.valid) {
        setValidationErrors([]);
        alert('Strategy is valid!');
      } else {
        setValidationErrors(result.errors);
      }
    } catch (error: any) {
      setValidationErrors([error.message || 'Validation failed']);
    }
  };

  const generateCode = async () => {
    try {
      const visualData = {
        id: `strategy-${Date.now()}`,
        name: 'Visual Strategy',
        blocks: nodes.map(node => ({
          id: node.id,
          type: getBlockCategory(node.data.label),
          subtype: node.data.label,
          config: node.data.config,
          position: node.position,
          inputs: getBlockInputs(node.data.label),
          outputs: getBlockOutputs(node.data.label),
        })),
        connections: edges.map(edge => ({
          id: edge.id,
          sourceBlockId: edge.source,
          sourceOutputId: 'output',
          targetBlockId: edge.target,
          targetInputId: 'input',
        })),
      };

      const result = await visualStrategyApi.generateCode(visualData);
      setGeneratedCode(result.code);
      setShowCode(true);
    } catch (error: any) {
      alert(`Code generation failed: ${error.message}`);
    }
  };

  const saveStrategy = async () => {
    try {
      const visualData = {
        blocks: nodes,
        connections: edges,
      };

      await strategyApi.create({
        name: 'Visual Strategy',
        type: 'VISUAL',
        visualData,
      });

      alert('Strategy saved!');
    } catch (error) {
      console.error('Failed to save strategy:', error);
      alert('Failed to save strategy');
    }
  };

  const getBlockCategory = (blockType: string): string => {
    if (BLOCK_TYPES.INDICATOR.includes(blockType)) return 'INDICATOR';
    if (BLOCK_TYPES.CONDITION.includes(blockType)) return 'CONDITION';
    if (BLOCK_TYPES.ACTION.includes(blockType)) return 'ACTION';
    if (BLOCK_TYPES.LOGIC.includes(blockType)) return 'LOGIC';
    return 'UNKNOWN';
  };

  const getBlockInputs = (blockType: string) => {
    const category = getBlockCategory(blockType);
    if (category === 'INDICATOR') {
      return [{ id: 'source', name: 'Source', type: 'series', required: true }];
    }
    if (category === 'CONDITION') {
      return [
        { id: 'left', name: 'Left', type: 'series', required: true },
        { id: 'right', name: 'Right', type: 'series', required: true },
      ];
    }
    if (category === 'ACTION') {
      return [{ id: 'condition', name: 'Condition', type: 'boolean', required: true }];
    }
    if (category === 'LOGIC') {
      return blockType === 'NOT'
        ? [{ id: 'input', name: 'Input', type: 'boolean', required: true }]
        : [
            { id: 'input1', name: 'Input 1', type: 'boolean', required: true },
            { id: 'input2', name: 'Input 2', type: 'boolean', required: true },
          ];
    }
    return [];
  };

  const getBlockOutputs = (blockType: string) => {
    const category = getBlockCategory(blockType);
    if (category === 'ACTION') return [];
    return [{ id: 'output', name: 'Output', type: 'series' }];
  };

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Block Palette */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Block Palette</h2>
        
        {Object.entries(BLOCK_TYPES).map(([category, blocks]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">{category}</h3>
            <div className="space-y-2">
              {blocks.map((block) => (
                <button
                  key={block}
                  onClick={() => addBlock(block)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors text-left"
                >
                  {block}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 space-y-2">
          <button
            onClick={validateStrategy}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Validate
          </button>
          <button
            onClick={generateCode}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Generate Code
          </button>
          <button
            onClick={saveStrategy}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Save Strategy
          </button>
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-900 rounded">
            <h4 className="text-sm font-medium text-red-200 mb-2">Errors:</h4>
            <ul className="text-xs text-red-300 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color="#374151" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const category = getBlockCategory(node.data.label);
              switch (category) {
                case 'INDICATOR': return '#3B82F6';
                case 'CONDITION': return '#F59E0B';
                case 'ACTION': return '#10B981';
                case 'LOGIC': return '#8B5CF6';
                default: return '#6B7280';
              }
            }}
          />
        </ReactFlow>
      </div>

      {/* Generated Code Modal */}
      {showCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Generated PineScript Code</h3>
              <button
                onClick={() => setShowCode(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <pre className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-x-auto">
              {generatedCode}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                alert('Code copied to clipboard!');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
