/**
 * PineScript Service - Main service for PineScript operations
 */

import { Lexer } from '../pinescript/lexer';
import { Parser } from '../pinescript/parser';
import { Compiler, CompiledStrategy, ExecutionContext } from '../pinescript/compiler';
import { Executor, BacktestResult } from '../pinescript/executor';

export interface CompilationResult {
  success: boolean;
  strategy?: CompiledStrategy;
  errors?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class PineScriptService {
  /**
   * Compile PineScript code to executable strategy
   */
  compile(code: string): CompilationResult {
    try {
      // Tokenize
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      // Parse
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // Compile
      const compiler = new Compiler();
      const strategy = compiler.compile(ast);

      return {
        success: true,
        strategy,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Validate PineScript syntax
   */
  validate(code: string): ValidationResult {
    const errors: string[] = [];

    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      parser.parse();

      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return { valid: false, errors };
    }
  }

  /**
   * Backtest strategy on historical data
   */
  backtest(strategy: CompiledStrategy, context: ExecutionContext, initialCapital: number = 10000): BacktestResult {
    const executor = new Executor(strategy, initialCapital);
    
    // Validate strategy
    const validation = executor.validate();
    if (!validation.valid) {
      throw new Error(`Strategy validation failed: ${validation.errors.join(', ')}`);
    }

    return executor.backtest(context);
  }

  /**
   * Execute strategy on real-time data
   */
  executeRealtime(strategy: CompiledStrategy, context: ExecutionContext) {
    const executor = new Executor(strategy);
    return executor.executeRealtime(context);
  }

  /**
   * Parse and compile in one step
   */
  parseAndCompile(code: string): CompiledStrategy {
    const result = this.compile(code);
    
    if (!result.success || !result.strategy) {
      throw new Error(`Compilation failed: ${result.errors?.join(', ')}`);
    }

    return result.strategy;
  }

  /**
   * Get strategy information
   */
  getStrategyInfo(strategy: CompiledStrategy): {
    name: string;
    parameters: Record<string, any>;
  } {
    return {
      name: strategy.name,
      parameters: strategy.parameters,
    };
  }
}

// Export singleton instance
export const pineScriptService = new PineScriptService();
