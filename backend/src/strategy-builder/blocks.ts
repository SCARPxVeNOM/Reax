/**
 * Visual Strategy Builder - Block Definitions
 */

export enum BlockType {
  INDICATOR = 'INDICATOR',
  CONDITION = 'CONDITION',
  ACTION = 'ACTION',
  LOGIC = 'LOGIC',
}

export enum IndicatorType {
  SMA = 'SMA',
  EMA = 'EMA',
  RSI = 'RSI',
  MACD = 'MACD',
  BOLLINGER_BANDS = 'BOLLINGER_BANDS',
}

export enum ConditionOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUAL = '==',
  GREATER_EQUAL = '>=',
  LESS_EQUAL = '<=',
  NOT_EQUAL = '!=',
  CROSSOVER = 'crossover',
  CROSSUNDER = 'crossunder',
}

export enum ActionType {
  BUY = 'BUY',
  SELL = 'SELL',
  CLOSE = 'CLOSE',
}

export enum LogicOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

export interface BlockInput {
  id: string;
  name: string;
  type: 'number' | 'series' | 'boolean';
  required: boolean;
}

export interface BlockOutput {
  id: string;
  name: string;
  type: 'number' | 'series' | 'boolean';
}

export interface BlockConfig {
  [key: string]: any;
}

export interface Block {
  id: string;
  type: BlockType;
  subtype: string;
  inputs: BlockInput[];
  outputs: BlockOutput[];
  config: BlockConfig;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  sourceBlockId: string;
  sourceOutputId: string;
  targetBlockId: string;
  targetInputId: string;
}

export interface VisualStrategy {
  id: string;
  name: string;
  blocks: Block[];
  connections: Connection[];
  createdAt: Date;
  updatedAt: Date;
}

// Block Templates
export const BLOCK_TEMPLATES: Record<string, Omit<Block, 'id' | 'position'>> = {
  // Indicators
  SMA: {
    type: BlockType.INDICATOR,
    subtype: IndicatorType.SMA,
    inputs: [
      { id: 'source', name: 'Source', type: 'series', required: true },
      { id: 'length', name: 'Length', type: 'number', required: true },
    ],
    outputs: [
      { id: 'output', name: 'SMA', type: 'series' },
    ],
    config: { length: 20 },
  },
  
  EMA: {
    type: BlockType.INDICATOR,
    subtype: IndicatorType.EMA,
    inputs: [
      { id: 'source', name: 'Source', type: 'series', required: true },
      { id: 'length', name: 'Length', type: 'number', required: true },
    ],
    outputs: [
      { id: 'output', name: 'EMA', type: 'series' },
    ],
    config: { length: 20 },
  },
  
  RSI: {
    type: BlockType.INDICATOR,
    subtype: IndicatorType.RSI,
    inputs: [
      { id: 'source', name: 'Source', type: 'series', required: true },
      { id: 'length', name: 'Length', type: 'number', required: true },
    ],
    outputs: [
      { id: 'output', name: 'RSI', type: 'series' },
    ],
    config: { length: 14 },
  },
  
  MACD: {
    type: BlockType.INDICATOR,
    subtype: IndicatorType.MACD,
    inputs: [
      { id: 'source', name: 'Source', type: 'series', required: true },
      { id: 'fastLength', name: 'Fast Length', type: 'number', required: true },
      { id: 'slowLength', name: 'Slow Length', type: 'number', required: true },
      { id: 'signalLength', name: 'Signal Length', type: 'number', required: true },
    ],
    outputs: [
      { id: 'macd', name: 'MACD', type: 'series' },
      { id: 'signal', name: 'Signal', type: 'series' },
      { id: 'histogram', name: 'Histogram', type: 'series' },
    ],
    config: { fastLength: 12, slowLength: 26, signalLength: 9 },
  },
  
  BOLLINGER_BANDS: {
    type: BlockType.INDICATOR,
    subtype: IndicatorType.BOLLINGER_BANDS,
    inputs: [
      { id: 'source', name: 'Source', type: 'series', required: true },
      { id: 'length', name: 'Length', type: 'number', required: true },
      { id: 'stdDev', name: 'Std Dev', type: 'number', required: true },
    ],
    outputs: [
      { id: 'upper', name: 'Upper Band', type: 'series' },
      { id: 'middle', name: 'Middle Band', type: 'series' },
      { id: 'lower', name: 'Lower Band', type: 'series' },
    ],
    config: { length: 20, stdDev: 2 },
  },
  
  // Conditions
  CONDITION: {
    type: BlockType.CONDITION,
    subtype: 'COMPARISON',
    inputs: [
      { id: 'left', name: 'Left', type: 'series', required: true },
      { id: 'right', name: 'Right', type: 'series', required: true },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'boolean' },
    ],
    config: { operator: ConditionOperator.GREATER_THAN },
  },
  
  // Actions
  BUY: {
    type: BlockType.ACTION,
    subtype: ActionType.BUY,
    inputs: [
      { id: 'condition', name: 'Condition', type: 'boolean', required: true },
      { id: 'quantity', name: 'Quantity', type: 'number', required: false },
    ],
    outputs: [],
    config: { quantity: 1 },
  },
  
  SELL: {
    type: BlockType.ACTION,
    subtype: ActionType.SELL,
    inputs: [
      { id: 'condition', name: 'Condition', type: 'boolean', required: true },
      { id: 'quantity', name: 'Quantity', type: 'number', required: false },
    ],
    outputs: [],
    config: { quantity: 1 },
  },
  
  CLOSE: {
    type: BlockType.ACTION,
    subtype: ActionType.CLOSE,
    inputs: [
      { id: 'condition', name: 'Condition', type: 'boolean', required: true },
    ],
    outputs: [],
    config: {},
  },
  
  // Logic
  AND: {
    type: BlockType.LOGIC,
    subtype: LogicOperator.AND,
    inputs: [
      { id: 'input1', name: 'Input 1', type: 'boolean', required: true },
      { id: 'input2', name: 'Input 2', type: 'boolean', required: true },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'boolean' },
    ],
    config: {},
  },
  
  OR: {
    type: BlockType.LOGIC,
    subtype: LogicOperator.OR,
    inputs: [
      { id: 'input1', name: 'Input 1', type: 'boolean', required: true },
      { id: 'input2', name: 'Input 2', type: 'boolean', required: true },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'boolean' },
    ],
    config: {},
  },
  
  NOT: {
    type: BlockType.LOGIC,
    subtype: LogicOperator.NOT,
    inputs: [
      { id: 'input', name: 'Input', type: 'boolean', required: true },
    ],
    outputs: [
      { id: 'output', name: 'Result', type: 'boolean' },
    ],
    config: {},
  },
};

export class BlockLibrary {
  /**
   * Create a new block from template
   */
  static createBlock(templateName: string, id: string, position: { x: number; y: number }): Block {
    const template = BLOCK_TEMPLATES[templateName];
    
    if (!template) {
      throw new Error(`Unknown block template: ${templateName}`);
    }

    return {
      id,
      ...template,
      position,
    };
  }

  /**
   * Get all available block templates
   */
  static getTemplates(): typeof BLOCK_TEMPLATES {
    return BLOCK_TEMPLATES;
  }

  /**
   * Get templates by type
   */
  static getTemplatesByType(type: BlockType): Record<string, Omit<Block, 'id' | 'position'>> {
    return Object.entries(BLOCK_TEMPLATES)
      .filter(([_, template]) => template.type === type)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }
}
