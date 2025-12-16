/**
 * PineScript Compiler - Compiles AST to executable code
 */

import * as AST from './ast';
import { TechnicalIndicators, MathFunctions } from './indicators';

export interface CompiledStrategy {
  name: string;
  parameters: Record<string, any>;
  execute: (context: ExecutionContext) => StrategySignal[];
}

export interface ExecutionContext {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamp: number[];
}

export interface StrategySignal {
  type: 'BUY' | 'SELL' | 'CLOSE';
  price: number;
  timestamp: number;
  reason: string;
}

export class Compiler {
  private variables: Map<string, any> = new Map();
  private functions: Map<string, Function> = new Map();

  constructor() {
    this.registerBuiltInFunctions();
  }

  compile(ast: AST.Program): CompiledStrategy {
    let strategyName = 'Unnamed Strategy';
    let strategyParams: Record<string, any> = {};
    const statements: AST.ASTNode[] = [];

    for (const node of ast.body) {
      if (node.type === AST.NodeType.STRATEGY_DECLARATION) {
        const strategy = node as AST.StrategyDeclaration;
        strategyName = strategy.name;
        strategyParams = strategy.parameters;
      } else if (node.type === AST.NodeType.INDICATOR_DECLARATION) {
        const indicator = node as AST.IndicatorDeclaration;
        strategyName = indicator.name;
        strategyParams = indicator.parameters;
      } else {
        statements.push(node);
      }
    }

    const execute = (context: ExecutionContext): StrategySignal[] => {
      this.variables.set('open', context.open);
      this.variables.set('high', context.high);
      this.variables.set('low', context.low);
      this.variables.set('close', context.close);
      this.variables.set('volume', context.volume);

      const signals: StrategySignal[] = [];

      for (const statement of statements) {
        const result = this.evaluateNode(statement, context);
        
        // Check for strategy signals
        if (result && typeof result === 'object' && 'type' in result) {
          signals.push(result as StrategySignal);
        }
      }

      return signals;
    };

    return {
      name: strategyName,
      parameters: strategyParams,
      execute,
    };
  }

  private evaluateNode(node: AST.ASTNode, context: ExecutionContext): any {
    switch (node.type) {
      case AST.NodeType.VARIABLE_DECLARATION:
        return this.evaluateVariableDeclaration(node as AST.VariableDeclaration, context);
      
      case AST.NodeType.ASSIGNMENT:
        return this.evaluateAssignment(node as AST.Assignment, context);
      
      case AST.NodeType.FUNCTION_CALL:
        return this.evaluateFunctionCall(node as AST.FunctionCall, context);
      
      case AST.NodeType.BINARY_EXPRESSION:
        return this.evaluateBinaryExpression(node as AST.BinaryExpression, context);
      
      case AST.NodeType.UNARY_EXPRESSION:
        return this.evaluateUnaryExpression(node as AST.UnaryExpression, context);
      
      case AST.NodeType.IDENTIFIER:
        return this.evaluateIdentifier(node as AST.Identifier);
      
      case AST.NodeType.NUMBER_LITERAL:
        return (node as AST.NumberLiteral).value;
      
      case AST.NodeType.STRING_LITERAL:
        return (node as AST.StringLiteral).value;
      
      case AST.NodeType.BOOLEAN_LITERAL:
        return (node as AST.BooleanLiteral).value;
      
      case AST.NodeType.IF_STATEMENT:
        return this.evaluateIfStatement(node as AST.IfStatement, context);
      
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private evaluateVariableDeclaration(node: AST.VariableDeclaration, context: ExecutionContext): void {
    const value = this.evaluateNode(node.value, context);
    this.variables.set(node.name, value);
  }

  private evaluateAssignment(node: AST.Assignment, context: ExecutionContext): void {
    const value = this.evaluateNode(node.value, context);
    this.variables.set(node.name, value);
  }

  private evaluateFunctionCall(node: AST.FunctionCall, context: ExecutionContext): any {
    const func = this.functions.get(node.name);
    
    if (!func) {
      throw new Error(`Unknown function: ${node.name}`);
    }

    const args = node.arguments.map(arg => this.evaluateNode(arg, context));
    return func(...args, context);
  }

  private evaluateBinaryExpression(node: AST.BinaryExpression, context: ExecutionContext): any {
    const left = this.evaluateNode(node.left, context);
    const right = this.evaluateNode(node.right, context);

    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '>=': return left >= right;
      case 'and': return left && right;
      case 'or': return left || right;
      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  private evaluateUnaryExpression(node: AST.UnaryExpression, context: ExecutionContext): any {
    const operand = this.evaluateNode(node.operand, context);

    switch (node.operator) {
      case '-': return -operand;
      case 'not':
      case '!': return !operand;
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  private evaluateIdentifier(node: AST.Identifier): any {
    if (!this.variables.has(node.name)) {
      throw new Error(`Undefined variable: ${node.name}`);
    }
    return this.variables.get(node.name);
  }

  private evaluateIfStatement(node: AST.IfStatement, context: ExecutionContext): any {
    const condition = this.evaluateNode(node.condition, context);
    
    if (condition) {
      return this.evaluateNode(node.thenBranch, context);
    } else if (node.elseBranch) {
      return this.evaluateNode(node.elseBranch, context);
    }
  }

  private registerBuiltInFunctions(): void {
    // Technical Indicators
    this.functions.set('ta.sma', (source: number[], length: number) => {
      return TechnicalIndicators.sma(source, length);
    });

    this.functions.set('ta.ema', (source: number[], length: number) => {
      return TechnicalIndicators.ema(source, length);
    });

    this.functions.set('ta.rsi', (source: number[], length: number = 14) => {
      return TechnicalIndicators.rsi(source, length);
    });

    this.functions.set('ta.macd', (source: number[], fast: number = 12, slow: number = 26, signal: number = 9) => {
      return TechnicalIndicators.macd(source, fast, slow, signal);
    });

    this.functions.set('ta.bb', (source: number[], length: number = 20, mult: number = 2) => {
      return TechnicalIndicators.bollingerBands(source, length, mult);
    });

    this.functions.set('ta.crossover', (series1: number[], series2: number[]) => {
      return TechnicalIndicators.crossover(series1, series2);
    });

    this.functions.set('ta.crossunder', (series1: number[], series2: number[]) => {
      return TechnicalIndicators.crossunder(series1, series2);
    });

    // Math Functions
    this.functions.set('math.max', (...values: number[]) => {
      return MathFunctions.max(...values);
    });

    this.functions.set('math.min', (...values: number[]) => {
      return MathFunctions.min(...values);
    });

    this.functions.set('math.abs', (value: number) => {
      return MathFunctions.abs(value);
    });

    this.functions.set('math.avg', (...values: number[]) => {
      return MathFunctions.avg(...values);
    });

    this.functions.set('math.sum', (...values: number[]) => {
      return MathFunctions.sum(...values);
    });

    this.functions.set('math.round', (value: number, decimals: number = 0) => {
      return MathFunctions.round(value, decimals);
    });

    // Strategy Functions
    this.functions.set('strategy.entry', (direction: string, qty: number, context: ExecutionContext) => {
      const currentIndex = context.close.length - 1;
      return {
        type: direction === 'long' ? 'BUY' : 'SELL',
        price: context.close[currentIndex],
        timestamp: context.timestamp[currentIndex],
        reason: 'Strategy entry signal',
      };
    });

    this.functions.set('strategy.close', (context: ExecutionContext) => {
      const currentIndex = context.close.length - 1;
      return {
        type: 'CLOSE',
        price: context.close[currentIndex],
        timestamp: context.timestamp[currentIndex],
        reason: 'Strategy close signal',
      };
    });
  }
}
