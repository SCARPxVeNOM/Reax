/**
 * PineScript Lexer - Tokenizes PineScript v5 code
 */

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOL = 'BOOL',
  
  // Identifiers and Keywords
  IDENTIFIER = 'IDENTIFIER',
  INDICATOR = 'INDICATOR',
  STRATEGY = 'STRATEGY',
  VAR = 'VAR',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NA = 'NA',
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  ASSIGN = 'ASSIGN',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_EQUAL = 'LESS_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  COMMA = 'COMMA',
  DOT = 'DOT',
  ARROW = 'ARROW',
  NEWLINE = 'NEWLINE',
  
  // Special
  EOF = 'EOF',
  COMMENT = 'COMMENT',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  
  private keywords: Map<string, TokenType> = new Map([
    ['indicator', TokenType.INDICATOR],
    ['strategy', TokenType.STRATEGY],
    ['var', TokenType.VAR],
    ['if', TokenType.IF],
    ['else', TokenType.ELSE],
    ['for', TokenType.FOR],
    ['while', TokenType.WHILE],
    ['true', TokenType.TRUE],
    ['false', TokenType.FALSE],
    ['na', TokenType.NA],
    ['and', TokenType.AND],
    ['or', TokenType.OR],
    ['not', TokenType.NOT],
  ]);

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.position < this.input.length) {
      const token = this.nextToken();
      if (token.type !== TokenType.COMMENT) {
        tokens.push(token);
      }
    }
    
    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });
    
    return tokens;
  }

  private nextToken(): Token {
    this.skipWhitespace();
    
    if (this.position >= this.input.length) {
      return this.makeToken(TokenType.EOF, '');
    }
    
    const char = this.input[this.position];
    
    // Comments
    if (char === '/' && this.peek() === '/') {
      return this.readComment();
    }
    
    // Numbers
    if (this.isDigit(char)) {
      return this.readNumber();
    }
    
    // Strings
    if (char === '"' || char === "'") {
      return this.readString(char);
    }
    
    // Identifiers and keywords
    if (this.isAlpha(char) || char === '_') {
      return this.readIdentifier();
    }
    
    // Operators and delimiters
    return this.readOperator();
  }

  private readComment(): Token {
    const start = this.position;
    const startColumn = this.column;
    
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      this.advance();
    }
    
    return {
      type: TokenType.COMMENT,
      value: this.input.slice(start, this.position),
      line: this.line,
      column: startColumn,
    };
  }

  private readNumber(): Token {
    const start = this.position;
    const startColumn = this.column;
    
    while (this.isDigit(this.input[this.position])) {
      this.advance();
    }
    
    if (this.input[this.position] === '.' && this.isDigit(this.input[this.position + 1])) {
      this.advance(); // consume '.'
      while (this.isDigit(this.input[this.position])) {
        this.advance();
      }
    }
    
    return {
      type: TokenType.NUMBER,
      value: this.input.slice(start, this.position),
      line: this.line,
      column: startColumn,
    };
  }

  private readString(quote: string): Token {
    const start = this.position;
    const startColumn = this.column;
    
    this.advance(); // consume opening quote
    
    while (this.position < this.input.length && this.input[this.position] !== quote) {
      if (this.input[this.position] === '\\') {
        this.advance(); // skip escape character
      }
      this.advance();
    }
    
    if (this.position >= this.input.length) {
      throw new Error(`Unterminated string at line ${this.line}, column ${startColumn}`);
    }
    
    this.advance(); // consume closing quote
    
    return {
      type: TokenType.STRING,
      value: this.input.slice(start + 1, this.position - 1),
      line: this.line,
      column: startColumn,
    };
  }

  private readIdentifier(): Token {
    const start = this.position;
    const startColumn = this.column;
    
    while (this.isAlphaNumeric(this.input[this.position]) || this.input[this.position] === '_') {
      this.advance();
    }
    
    const value = this.input.slice(start, this.position);
    const type = this.keywords.get(value) || TokenType.IDENTIFIER;
    
    return {
      type,
      value,
      line: this.line,
      column: startColumn,
    };
  }

  private readOperator(): Token {
    const char = this.input[this.position];
    const startColumn = this.column;
    
    this.advance();
    
    switch (char) {
      case '+': return this.makeToken(TokenType.PLUS, '+', startColumn);
      case '-': return this.makeToken(TokenType.MINUS, '-', startColumn);
      case '*': return this.makeToken(TokenType.MULTIPLY, '*', startColumn);
      case '/': return this.makeToken(TokenType.DIVIDE, '/', startColumn);
      case '%': return this.makeToken(TokenType.MODULO, '%', startColumn);
      case '(': return this.makeToken(TokenType.LPAREN, '(', startColumn);
      case ')': return this.makeToken(TokenType.RPAREN, ')', startColumn);
      case '[': return this.makeToken(TokenType.LBRACKET, '[', startColumn);
      case ']': return this.makeToken(TokenType.RBRACKET, ']', startColumn);
      case ',': return this.makeToken(TokenType.COMMA, ',', startColumn);
      case '.': return this.makeToken(TokenType.DOT, '.', startColumn);
      case '\n': 
        this.line++;
        this.column = 1;
        return this.makeToken(TokenType.NEWLINE, '\n', startColumn);
      case '=':
        if (this.input[this.position] === '=') {
          this.advance();
          return this.makeToken(TokenType.EQUAL, '==', startColumn);
        }
        if (this.input[this.position] === '>') {
          this.advance();
          return this.makeToken(TokenType.ARROW, '=>', startColumn);
        }
        return this.makeToken(TokenType.ASSIGN, '=', startColumn);
      case '!':
        if (this.input[this.position] === '=') {
          this.advance();
          return this.makeToken(TokenType.NOT_EQUAL, '!=', startColumn);
        }
        return this.makeToken(TokenType.NOT, '!', startColumn);
      case '<':
        if (this.input[this.position] === '=') {
          this.advance();
          return this.makeToken(TokenType.LESS_EQUAL, '<=', startColumn);
        }
        return this.makeToken(TokenType.LESS_THAN, '<', startColumn);
      case '>':
        if (this.input[this.position] === '=') {
          this.advance();
          return this.makeToken(TokenType.GREATER_EQUAL, '>=', startColumn);
        }
        return this.makeToken(TokenType.GREATER_THAN, '>', startColumn);
      default:
        throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${startColumn}`);
    }
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private advance(): void {
    this.position++;
    this.column++;
  }

  private peek(): string {
    return this.input[this.position + 1] || '';
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private makeToken(type: TokenType, value: string, column?: number): Token {
    return {
      type,
      value,
      line: this.line,
      column: column || this.column,
    };
  }
}
