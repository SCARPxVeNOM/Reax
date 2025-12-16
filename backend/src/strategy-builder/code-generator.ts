/**
 * Visual Strategy Builder - Code Generator
 * Converts visual strategy to PineScript code
 */

import {
  Block,
  Connection,
  VisualStrategy,
  BlockType,
  IndicatorType,
  ConditionOperator,
  ActionType,
  LogicOperator,
} from './blocks';
import { StrategyValidator } from './validator';

export class StrategyCodeGenerator {
  /**
   * Generate PineScript code from visual strategy
   */
  static generatePineScript(strategy: VisualStrategy): string {
    // Validate strategy first
    const validation = StrategyValidator.validateStrategy(strategy);
    if (!validation.valid) {
      throw new Error(`Strategy validation failed: ${validation.errors.join(', ')}`);
    }

    const executionOrder = StrategyValidator.getExecutionOrder(strategy);
    const code: string[] = [];

    // Strategy declaration
    code.push(`//@version=5`);
    code.push(`strategy("${strategy.name}", overlay=true)`);
    code.push('');

    // Generate code for each block in execution order
    const blockOutputs = new Map<string, string>();

    for (const blockId of executionOrder) {
      const block = strategy.blocks.find(b => b.id === blockId);
      if (!block) continue;

      const blockCode = this.generateBlockCode(block, strategy.connections, blockOutputs);
      if (blockCode) {
        code.push(blockCode);
      }
    }

    return code.join('\n');
  }

  /**
   * Generate code for a single block
   */
  private static generateBlockCode(
    block: Block,
    connections: Connection[],
    blockOutputs: Map<string, string>
  ): string {
    switch (block.type) {
      case BlockType.INDICATOR:
        return this.generateIndicatorCode(block, connections, blockOutputs);
      
      case BlockType.CONDITION:
        return this.generateConditionCode(block, connections, blockOutputs);
      
      case BlockType.LOGIC:
        return this.generateLogicCode(block, connections, blockOutputs);
      
      case BlockType.ACTION:
        return this.generateActionCode(block, connections, blockOutputs);
      
      default:
        return '';
    }
  }

  /**
   * Generate indicator block code
   */
  private static generateIndicatorCode(
    block: Block,
    connections: Connection[],
    blockOutputs: Map<string, string>
  ): string {
    const sourceInput = this.getInputValue(block, 'source', connections, blockOutputs) || 'close';
    const varName = `${block.subtype.toLowerCase()}_${block.id.slice(0, 8)}`;

    switch (block.subtype) {
      case IndicatorType.SMA: {
        const length = block.config.length || 20;
        blockOutputs.set(`${block.id}:output`, varName);
        return `${varName} = ta.sma(${sourceInput}, ${length})`;
      }

      case IndicatorType.EMA: {
        const length = block.config.length || 20;
        blockOutputs.set(`${block.id}:output`, varName);
        return `${varName} = ta.ema(${sourceInput}, ${length})`;
      }

      case IndicatorType.RSI: {
        const length = block.config.length || 14;
        blockOutputs.set(`${block.id}:output`, varName);
        return `${varName} = ta.rsi(${sourceInput}, ${length})`;
      }

      case IndicatorType.MACD: {
        const fast = block.config.fastLength || 12;
        const slow = block.config.slowLength || 26;
        const signal = block.config.signalLength || 9;
        const macdVar = `${varName}_macd`;
        const signalVar = `${varName}_signal`;
        const histVar = `${varName}_hist`;
        
        blockOutputs.set(`${block.id}:macd`, macdVar);
        blockOutputs.set(`${block.id}:signal`, signalVar);
        blockOutputs.set(`${block.id}:histogram`, histVar);
        
        return `[${macdVar}, ${signalVar}, ${histVar}] = ta.macd(${sourceInput}, ${fast}, ${slow}, ${signal})`;
      }

      case IndicatorType.BOLLINGER_BANDS: {
        const length = block.config.length || 20;
        const mult = block.config.stdDev || 2;
        const upperVar = `${varName}_upper`;
        const middleVar = `${varName}_middle`;
        const lowerVar = `${varName}_lower`;
        
        blockOutputs.set(`${block.id}:upper`, upperVar);
        blockOutputs.set(`${block.id}:middle`, middleVar);
        blockOutputs.set(`${block.id}:lower`, lowerVar);
        
        return `[${middleVar}, ${upperVar}, ${lowerVar}] = ta.bb(${sourceInput}, ${length}, ${mult})`;
      }

      default:
        return '';
    }
  }

  /**
   * Generate condition block code
   */
  private static generateConditionCode(
    block: Block,
    connections: Connection[],
    blockOutputs: Map<string, string>
  ): string {
    const left = this.getInputValue(block, 'left', connections, blockOutputs);
    const right = this.getInputValue(block, 'right', connections, blockOutputs);
    
    if (!left || !right) return '';

    const varName = `condition_${block.id.slice(0, 8)}`;
    const operator = block.config.operator as ConditionOperator;

    let condition: string;
    switch (operator) {
      case ConditionOperator.CROSSOVER:
        condition = `ta.crossover(${left}, ${right})`;
        break;
      case ConditionOperator.CROSSUNDER:
        condition = `ta.crossunder(${left}, ${right})`;
        break;
      default:
        condition = `${left} ${operator} ${right}`;
    }

    blockOutputs.set(`${block.id}:output`, varName);
    return `${varName} = ${condition}`;
  }

  /**
   * Generate logic block code
   */
  private static generateLogicCode(
    block: Block,
    connections: Connection[],
    blockOutputs: Map<string, string>
  ): string {
    const varName = `logic_${block.id.slice(0, 8)}`;

    switch (block.subtype) {
      case LogicOperator.AND: {
        const input1 = this.getInputValue(block, 'input1', connections, blockOutputs);
        const input2 = this.getInputValue(block, 'input2', connections, blockOutputs);
        if (!input1 || !input2) return '';
        
        blockOutputs.set(`${block.id}:output`, varName);
        return `${varName} = ${input1} and ${input2}`;
      }

      case LogicOperator.OR: {
        const input1 = this.getInputValue(block, 'input1', connections, blockOutputs);
        const input2 = this.getInputValue(block, 'input2', connections, blockOutputs);
        if (!input1 || !input2) return '';
        
        blockOutputs.set(`${block.id}:output`, varName);
        return `${varName} = ${input1} or ${input2}`;
      }

      case LogicOperator.NOT: {
        const input = this.getInputValue(block, 'input', connections, blockOutputs);
        if (!input) return '';
        
        blockOutputs.set(`${block.id}:output`, varName);
        return `${varName} = not ${input}`;
      }

      default:
        return '';
    }
  }

  /**
   * Generate action block code
   */
  private static generateActionCode(
    block: Block,
    connections: Connection[],
    blockOutputs: Map<string, string>
  ): string {
    const condition = this.getInputValue(block, 'condition', connections, blockOutputs);
    if (!condition) return '';

    const code: string[] = [];
    code.push(`if ${condition}`);

    switch (block.subtype) {
      case ActionType.BUY: {
        const qty = block.config.quantity || 1;
        code.push(`    strategy.entry("Long", strategy.long, qty=${qty})`);
        break;
      }

      case ActionType.SELL: {
        const qty = block.config.quantity || 1;
        code.push(`    strategy.entry("Short", strategy.short, qty=${qty})`);
        break;
      }

      case ActionType.CLOSE: {
        code.push(`    strategy.close_all()`);
        break;
      }
    }

    return code.join('\n');
  }

  /**
   * Get input value for a block
   */
  private static getInputValue(
    block: Block,
    inputId: string,
    connections: Connection[],
    blockOutputs: Map<string, string>
  ): string | null {
    const connection = connections.find(
      c => c.targetBlockId === block.id && c.targetInputId === inputId
    );

    if (!connection) return null;

    const outputKey = `${connection.sourceBlockId}:${connection.sourceOutputId}`;
    return blockOutputs.get(outputKey) || null;
  }

  /**
   * Generate TypeScript code for execution
   */
  static generateTypeScript(strategy: VisualStrategy): string {
    const pineScript = this.generatePineScript(strategy);
    
    return `
import { pineScriptService } from '../services/pinescript-service';

export const strategy = pineScriptService.parseAndCompile(\`
${pineScript}
\`);

export const strategyName = "${strategy.name}";
export const strategyId = "${strategy.id}";
`;
  }
}
