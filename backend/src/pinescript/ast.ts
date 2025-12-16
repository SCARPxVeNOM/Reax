/**
 * PineScript Abstract Syntax Tree (AST) definitions
 */

export enum NodeType {
  PROGRAM = 'PROGRAM',
  INDICATOR_DECLARATION = 'INDICATOR_DECLARATION',
  STRATEGY_DECLARATION = 'STRATEGY_DECLARATION',
  VARIABLE_DECLARATION = 'VARIABLE_DECLARATION',
  ASSIGNMENT = 'ASSIGNMENT',
  FUNCTION_CALL = 'FUNCTION_CALL',
  BINARY_EXPRESSION = 'BINARY_EXPRESSION',
  UNARY_EXPRESSION = 'UNARY_EXPRESSION',
  IDENTIFIER = 'IDENTIFIER',
  NUMBER_LITERAL = 'NUMBER_LITERAL',
  STRING_LITERAL = 'STRING_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',
  IF_STATEMENT = 'IF_STATEMENT',
  FOR_STATEMENT = 'FOR_STATEMENT',
  WHILE_STATEMENT = 'WHILE_STATEMENT',
  BLOCK = 'BLOCK',
}

export interface ASTNode {
  type: NodeType;
  line: number;
  column: number;
}

export interface Program extends ASTNode {
  type: NodeType.PROGRAM;
  body: ASTNode[];
}

export interface IndicatorDeclaration extends ASTNode {
  type: NodeType.INDICATOR_DECLARATION;
  name: string;
  parameters: Record<string, any>;
}

export interface StrategyDeclaration extends ASTNode {
  type: NodeType.STRATEGY_DECLARATION;
  name: string;
  parameters: Record<string, any>;
}

export interface VariableDeclaration extends ASTNode {
  type: NodeType.VARIABLE_DECLARATION;
  name: string;
  value: ASTNode;
  isVar: boolean;
}

export interface Assignment extends ASTNode {
  type: NodeType.ASSIGNMENT;
  name: string;
  value: ASTNode;
}

export interface FunctionCall extends ASTNode {
  type: NodeType.FUNCTION_CALL;
  name: string;
  arguments: ASTNode[];
}

export interface BinaryExpression extends ASTNode {
  type: NodeType.BINARY_EXPRESSION;
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpression extends ASTNode {
  type: NodeType.UNARY_EXPRESSION;
  operator: string;
  operand: ASTNode;
}

export interface Identifier extends ASTNode {
  type: NodeType.IDENTIFIER;
  name: string;
}

export interface NumberLiteral extends ASTNode {
  type: NodeType.NUMBER_LITERAL;
  value: number;
}

export interface StringLiteral extends ASTNode {
  type: NodeType.STRING_LITERAL;
  value: string;
}

export interface BooleanLiteral extends ASTNode {
  type: NodeType.BOOLEAN_LITERAL;
  value: boolean;
}

export interface IfStatement extends ASTNode {
  type: NodeType.IF_STATEMENT;
  condition: ASTNode;
  thenBranch: ASTNode;
  elseBranch?: ASTNode;
}

export interface ForStatement extends ASTNode {
  type: NodeType.FOR_STATEMENT;
  variable: string;
  start: ASTNode;
  end: ASTNode;
  body: ASTNode;
}

export interface WhileStatement extends ASTNode {
  type: NodeType.WHILE_STATEMENT;
  condition: ASTNode;
  body: ASTNode;
}

export interface Block extends ASTNode {
  type: NodeType.BLOCK;
  statements: ASTNode[];
}
