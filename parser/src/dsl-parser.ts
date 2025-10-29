export interface ParseError {
  line: number;
  column: number;
  message: string;
}

export interface DSLStrategy {
  name: string;
  rules: Rule[];
}

export interface Rule {
  condition: Condition;
  actions: Action[];
}

export interface Condition {
  type: 'and' | 'or' | 'comparison' | 'function';
  left?: Condition | Expression;
  right?: Condition | Expression;
  operator?: string;
  expression?: Expression;
}

export interface Expression {
  type: 'tweet.contains' | 'token.volume' | 'price' | 'rsi' | 'sma' | 'ema' | 'literal';
  value?: any;
  period?: number;
}

export interface Action {
  type: 'buy' | 'sell';
  parameters: {
    token?: string;
    qty?: number;
    sl?: number; // stop loss percentage
    tp?: number; // take profit percentage
  };
}

export class DSLParser {
  parse(code: string): DSLStrategy {
    try {
      // Simple regex-based parser for MVP
      // In production, use PEG.js or similar
      const nameMatch = code.match(/strategy\s*\(\s*["']([^"']+)["']\s*\)/);
      if (!nameMatch) {
        throw new Error('Strategy name not found');
      }

      const name = nameMatch[1];
      const rules = this.parseRules(code);

      return { name, rules };
    } catch (error: any) {
      throw new Error(`Parse error: ${error.message}`);
    }
  }

  private parseRules(code: string): Rule[] {
    const rules: Rule[] = [];
    
    // Extract if blocks
    const ifPattern = /if\s+([^{]+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = ifPattern.exec(code)) !== null) {
      const conditionStr = match[1].trim();
      const actionsStr = match[2].trim();

      const condition = this.parseCondition(conditionStr);
      const actions = this.parseActions(actionsStr);

      rules.push({ condition, actions });
    }

    return rules;
  }

  private parseCondition(conditionStr: string): Condition {
    // Handle 'and' operator
    if (conditionStr.includes(' and ')) {
      const parts = conditionStr.split(' and ');
      return {
        type: 'and',
        left: this.parseCondition(parts[0].trim()),
        right: this.parseCondition(parts.slice(1).join(' and ').trim()),
      };
    }

    // Handle 'or' operator
    if (conditionStr.includes(' or ')) {
      const parts = conditionStr.split(' or ');
      return {
        type: 'or',
        left: this.parseCondition(parts[0].trim()),
        right: this.parseCondition(parts.slice(1).join(' or ').trim()),
      };
    }

    // Handle comparisons
    const comparisonMatch = conditionStr.match(/(.+?)\s*([><=]+)\s*(.+)/);
    if (comparisonMatch) {
      return {
        type: 'comparison',
        left: this.parseExpression(comparisonMatch[1].trim()),
        operator: comparisonMatch[2].trim(),
        right: this.parseExpression(comparisonMatch[3].trim()),
      };
    }

    // Handle function calls
    return {
      type: 'function',
      expression: this.parseExpression(conditionStr),
    };
  }

  private parseExpression(exprStr: string): Expression {
    // tweet.contains("text")
    const tweetContainsMatch = exprStr.match(/tweet\.contains\s*\(\s*["']([^"']+)["']\s*\)/);
    if (tweetContainsMatch) {
      return {
        type: 'tweet.contains',
        value: tweetContainsMatch[1],
      };
    }

    // token.volume
    if (exprStr === 'token.volume') {
      return { type: 'token.volume' };
    }

    // price
    if (exprStr === 'price') {
      return { type: 'price' };
    }

    // rsi(14)
    const rsiMatch = exprStr.match(/rsi\s*\(\s*(\d+)\s*\)/);
    if (rsiMatch) {
      return {
        type: 'rsi',
        period: parseInt(rsiMatch[1]),
      };
    }

    // sma(50)
    const smaMatch = exprStr.match(/sma\s*\(\s*(\d+)\s*\)/);
    if (smaMatch) {
      return {
        type: 'sma',
        period: parseInt(smaMatch[1]),
      };
    }

    // ema(20)
    const emaMatch = exprStr.match(/ema\s*\(\s*(\d+)\s*\)/);
    if (emaMatch) {
      return {
        type: 'ema',
        period: parseInt(emaMatch[1]),
      };
    }

    // Literal number
    const numMatch = exprStr.match(/^[\d.]+$/);
    if (numMatch) {
      return {
        type: 'literal',
        value: parseFloat(exprStr),
      };
    }

    throw new Error(`Unknown expression: ${exprStr}`);
  }

  private parseActions(actionsStr: string): Action[] {
    const actions: Action[] = [];

    // buy(token, qty=1, sl=2%, tp=5%)
    const buyMatch = actionsStr.match(/buy\s*\(([^)]+)\)/);
    if (buyMatch) {
      const params = this.parseActionParams(buyMatch[1]);
      actions.push({
        type: 'buy',
        parameters: params,
      });
    }

    // sell(token, qty=1)
    const sellMatch = actionsStr.match(/sell\s*\(([^)]*)\)/);
    if (sellMatch) {
      const params = this.parseActionParams(sellMatch[1]);
      actions.push({
        type: 'sell',
        parameters: params,
      });
    }

    return actions;
  }

  private parseActionParams(paramsStr: string): any {
    const params: any = {};
    
    if (!paramsStr.trim()) {
      return params;
    }

    const parts = paramsStr.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      // key=value format
      if (trimmed.includes('=')) {
        const [key, value] = trimmed.split('=').map(s => s.trim());
        
        // Handle percentages
        if (value.endsWith('%')) {
          params[key] = parseFloat(value.replace('%', ''));
        } else {
          params[key] = parseFloat(value) || value;
        }
      } else {
        // First positional argument is token
        if (!params.token) {
          params.token = trimmed;
        }
      }
    }

    return params;
  }

  validate(code: string): ParseError[] {
    const errors: ParseError[] = [];

    try {
      this.parse(code);
    } catch (error: any) {
      errors.push({
        line: 1,
        column: 1,
        message: error.message,
      });
    }

    return errors;
  }

  toJSON(strategy: DSLStrategy): string {
    return JSON.stringify(strategy, null, 2);
  }
}

export class DSLEvaluator {
  evaluate(strategy: DSLStrategy, signal: any, marketData?: any): boolean {
    for (const rule of strategy.rules) {
      if (this.evaluateCondition(rule.condition, signal, marketData)) {
        return true;
      }
    }
    return false;
  }

  private evaluateCondition(condition: Condition, signal: any, marketData?: any): boolean {
    switch (condition.type) {
      case 'and':
        return (
          this.evaluateCondition(condition.left as Condition, signal, marketData) &&
          this.evaluateCondition(condition.right as Condition, signal, marketData)
        );

      case 'or':
        return (
          this.evaluateCondition(condition.left as Condition, signal, marketData) ||
          this.evaluateCondition(condition.right as Condition, signal, marketData)
        );

      case 'comparison':
        const leftValue = this.evaluateExpression(condition.left as Expression, signal, marketData);
        const rightValue = this.evaluateExpression(condition.right as Expression, signal, marketData);
        return this.compare(leftValue, condition.operator!, rightValue);

      case 'function':
        return this.evaluateExpression(condition.expression!, signal, marketData) as boolean;

      default:
        return false;
    }
  }

  private evaluateExpression(expr: Expression, signal: any, marketData?: any): any {
    switch (expr.type) {
      case 'tweet.contains':
        return signal.text?.toLowerCase().includes(expr.value.toLowerCase());

      case 'token.volume':
        return marketData?.volume || 0;

      case 'price':
        return marketData?.price || 0;

      case 'rsi':
        return this.calculateRSI(marketData?.prices || [], expr.period || 14);

      case 'sma':
        return this.calculateSMA(marketData?.prices || [], expr.period || 50);

      case 'ema':
        return this.calculateEMA(marketData?.prices || [], expr.period || 20);

      case 'literal':
        return expr.value;

      default:
        return null;
    }
  }

  private compare(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      case '==':
        return left == right;
      default:
        return false;
    }
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;

    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }
}

export const createDSLParser = (): DSLParser => new DSLParser();
export const createDSLEvaluator = (): DSLEvaluator => new DSLEvaluator();


// Security sandbox for DSL execution
export class DSLSandbox {
  private readonly MAX_EXECUTION_TIME = 1000; // 1 second
  private readonly ALLOWED_OPERATIONS = new Set([
    'contains', 'volume', 'price', 'rsi', 'sma', 'ema',
    'buy', 'sell', 'and', 'or', 'comparison', 'function',
    'tweet.contains', 'token.volume'
  ]);

  validateAndExecute(ast: any, evaluator: (ast: any) => any): any {
    const startTime = Date.now();

    // Validate AST structure
    this.validateAST(ast);

    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('DSL execution timeout')), this.MAX_EXECUTION_TIME);
    });

    const executionPromise = Promise.resolve(evaluator(ast));

    return Promise.race([executionPromise, timeoutPromise]);
  }

  private validateAST(node: any, depth: number = 0): void {
    // Prevent deep recursion attacks
    if (depth > 50) {
      throw new Error('Maximum AST depth exceeded');
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    // Check for allowed operations
    if (node.type && !this.ALLOWED_OPERATIONS.has(node.type)) {
      throw new Error(`Disallowed operation: ${node.type}`);
    }

    // Prevent dangerous patterns
    const dangerousPatterns = ['require', 'import', 'eval', 'Function', 'fs', 'process', 'child_process'];
    const nodeStr = JSON.stringify(node);
    for (const pattern of dangerousPatterns) {
      if (nodeStr.includes(pattern)) {
        throw new Error(`Potentially dangerous operation detected: ${pattern}`);
      }
    }

    // Recursively validate children
    if (node.conditions && Array.isArray(node.conditions)) {
      node.conditions.forEach((child: any) => this.validateAST(child, depth + 1));
    }
    if (node.actions && Array.isArray(node.actions)) {
      node.actions.forEach((child: any) => this.validateAST(child, depth + 1));
    }
    if (node.left) this.validateAST(node.left, depth + 1);
    if (node.right) this.validateAST(node.right, depth + 1);
  }
}
