/**
 * PineScript Parser - Generates AST from tokens
 */

import { Token, TokenType } from './lexer';
import * as AST from './ast';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE);
  }

  parse(): AST.Program {
    const body: AST.ASTNode[] = [];
    
    while (!this.isAtEnd()) {
      body.push(this.statement());
    }
    
    return {
      type: AST.NodeType.PROGRAM,
      body,
      line: 1,
      column: 1,
    };
  }

  private statement(): AST.ASTNode {
    if (this.match(TokenType.INDICATOR)) {
      return this.indicatorDeclaration();
    }
    
    if (this.match(TokenType.STRATEGY)) {
      return this.strategyDeclaration();
    }
    
    if (this.match(TokenType.VAR)) {
      return this.variableDeclaration(true);
    }
    
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }
    
    if (this.match(TokenType.FOR)) {
      return this.forStatement();
    }
    
    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }
    
    // Check for assignment or expression
    if (this.check(TokenType.IDENTIFIER) && this.peekNext()?.type === TokenType.ASSIGN) {
      return this.assignment();
    }
    
    return this.expressionStatement();
  }

  private indicatorDeclaration(): AST.IndicatorDeclaration {
    const token = this.previous();
    this.consume(TokenType.LPAREN, "Expected '(' after 'indicator'");
    
    const name = this.consume(TokenType.STRING, 'Expected indicator name').value;
    const parameters: Record<string, any> = {};
    
    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      this.consume(TokenType.COMMA, "Expected ','");
      const key = this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value;
      this.consume(TokenType.ASSIGN, "Expected '='");
      parameters[key] = this.primary();
    }
    
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    
    return {
      type: AST.NodeType.INDICATOR_DECLARATION,
      name,
      parameters,
      line: token.line,
      column: token.column,
    };
  }

  private strategyDeclaration(): AST.StrategyDeclaration {
    const token = this.previous();
    this.consume(TokenType.LPAREN, "Expected '(' after 'strategy'");
    
    const name = this.consume(TokenType.STRING, 'Expected strategy name').value;
    const parameters: Record<string, any> = {};
    
    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      this.consume(TokenType.COMMA, "Expected ','");
      const key = this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value;
      this.consume(TokenType.ASSIGN, "Expected '='");
      parameters[key] = this.primary();
    }
    
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    
    return {
      type: AST.NodeType.STRATEGY_DECLARATION,
      name,
      parameters,
      line: token.line,
      column: token.column,
    };
  }

  private variableDeclaration(isVar: boolean): AST.VariableDeclaration {
    const token = this.previous();
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    this.consume(TokenType.ASSIGN, "Expected '=' after variable name");
    const value = this.expression();
    
    return {
      type: AST.NodeType.VARIABLE_DECLARATION,
      name,
      value,
      isVar,
      line: token.line,
      column: token.column,
    };
  }

  private assignment(): AST.Assignment {
    const token = this.advance();
    const name = token.value;
    this.consume(TokenType.ASSIGN, "Expected '='");
    const value = this.expression();
    
    return {
      type: AST.NodeType.ASSIGNMENT,
      name,
      value,
      line: token.line,
      column: token.column,
    };
  }

  private ifStatement(): AST.IfStatement {
    const token = this.previous();
    const condition = this.expression();
    const thenBranch = this.statement();
    let elseBranch: AST.ASTNode | undefined;
    
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    
    return {
      type: AST.NodeType.IF_STATEMENT,
      condition,
      thenBranch,
      elseBranch,
      line: token.line,
      column: token.column,
    };
  }

  private forStatement(): AST.ForStatement {
    const token = this.previous();
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    this.consume(TokenType.ASSIGN, "Expected '='");
    const start = this.expression();
    this.consume(TokenType.IDENTIFIER, "Expected 'to'");
    const end = this.expression();
    const body = this.statement();
    
    return {
      type: AST.NodeType.FOR_STATEMENT,
      variable,
      start,
      end,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private whileStatement(): AST.WhileStatement {
    const token = this.previous();
    const condition = this.expression();
    const body = this.statement();
    
    return {
      type: AST.NodeType.WHILE_STATEMENT,
      condition,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private expressionStatement(): AST.ASTNode {
    return this.expression();
  }

  private expression(): AST.ASTNode {
    return this.logicalOr();
  }

  private logicalOr(): AST.ASTNode {
    let expr = this.logicalAnd();
    
    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.logicalAnd();
      expr = {
        type: AST.NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return expr;
  }

  private logicalAnd(): AST.ASTNode {
    let expr = this.equality();
    
    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = {
        type: AST.NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return expr;
  }

  private equality(): AST.ASTNode {
    let expr = this.comparison();
    
    while (this.match(TokenType.EQUAL, TokenType.NOT_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = {
        type: AST.NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return expr;
  }

  private comparison(): AST.ASTNode {
    let expr = this.term();
    
    while (this.match(TokenType.GREATER_THAN, TokenType.GREATER_EQUAL, TokenType.LESS_THAN, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = {
        type: AST.NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return expr;
  }

  private term(): AST.ASTNode {
    let expr = this.factor();
    
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = {
        type: AST.NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return expr;
  }

  private factor(): AST.ASTNode {
    let expr = this.unary();
    
    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous();
      const right = this.unary();
      expr = {
        type: AST.NodeType.BINARY_EXPRESSION,
        operator: operator.value,
        left: expr,
        right,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return expr;
  }

  private unary(): AST.ASTNode {
    if (this.match(TokenType.NOT, TokenType.MINUS)) {
      const operator = this.previous();
      const operand = this.unary();
      return {
        type: AST.NodeType.UNARY_EXPRESSION,
        operator: operator.value,
        operand,
        line: operator.line,
        column: operator.column,
      };
    }
    
    return this.call();
  }

  private call(): AST.ASTNode {
    let expr = this.primary();
    
    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, 'Expected property name after "."');
        if (this.match(TokenType.LPAREN)) {
          const args = this.arguments();
          expr = {
            type: AST.NodeType.FUNCTION_CALL,
            name: `${(expr as AST.Identifier).name}.${name.value}`,
            arguments: args,
            line: name.line,
            column: name.column,
          };
        }
      } else {
        break;
      }
    }
    
    return expr;
  }

  private finishCall(callee: AST.ASTNode): AST.FunctionCall {
    const args = this.arguments();
    
    return {
      type: AST.NodeType.FUNCTION_CALL,
      name: (callee as AST.Identifier).name,
      arguments: args,
      line: (callee as AST.Identifier).line,
      column: (callee as AST.Identifier).column,
    };
  }

  private arguments(): AST.ASTNode[] {
    const args: AST.ASTNode[] = [];
    
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    
    this.consume(TokenType.RPAREN, "Expected ')' after arguments");
    return args;
  }

  private primary(): AST.ASTNode {
    const token = this.advance();
    
    if (token.type === TokenType.TRUE || token.type === TokenType.FALSE) {
      return {
        type: AST.NodeType.BOOLEAN_LITERAL,
        value: token.type === TokenType.TRUE,
        line: token.line,
        column: token.column,
      };
    }
    
    if (token.type === TokenType.NUMBER) {
      return {
        type: AST.NodeType.NUMBER_LITERAL,
        value: parseFloat(token.value),
        line: token.line,
        column: token.column,
      };
    }
    
    if (token.type === TokenType.STRING) {
      return {
        type: AST.NodeType.STRING_LITERAL,
        value: token.value,
        line: token.line,
        column: token.column,
      };
    }
    
    if (token.type === TokenType.IDENTIFIER) {
      return {
        type: AST.NodeType.IDENTIFIER,
        name: token.value,
        line: token.line,
        column: token.column,
      };
    }
    
    if (token.type === TokenType.LPAREN) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }
    
    throw new Error(`Unexpected token '${token.value}' at line ${token.line}, column ${token.column}`);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    if (this.current + 1 >= this.tokens.length) return undefined;
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    
    const token = this.peek();
    throw new Error(`${message} at line ${token.line}, column ${token.column}`);
  }
}
