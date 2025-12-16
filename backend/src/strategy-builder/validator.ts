/**
 * Visual Strategy Builder - Connection and Strategy Validator
 */

import { Block, Connection, VisualStrategy, BlockType } from './blocks';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class StrategyValidator {
  /**
   * Validate a connection between two blocks
   */
  static validateConnection(
    connection: Connection,
    blocks: Block[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sourceBlock = blocks.find(b => b.id === connection.sourceBlockId);
    const targetBlock = blocks.find(b => b.id === connection.targetBlockId);

    if (!sourceBlock) {
      errors.push(`Source block ${connection.sourceBlockId} not found`);
    }

    if (!targetBlock) {
      errors.push(`Target block ${connection.targetBlockId} not found`);
    }

    if (!sourceBlock || !targetBlock) {
      return { valid: false, errors, warnings };
    }

    // Check if output exists
    const sourceOutput = sourceBlock.outputs.find(o => o.id === connection.sourceOutputId);
    if (!sourceOutput) {
      errors.push(`Output ${connection.sourceOutputId} not found on block ${sourceBlock.id}`);
    }

    // Check if input exists
    const targetInput = targetBlock.inputs.find(i => i.id === connection.targetInputId);
    if (!targetInput) {
      errors.push(`Input ${connection.targetInputId} not found on block ${targetBlock.id}`);
    }

    if (!sourceOutput || !targetInput) {
      return { valid: false, errors, warnings };
    }

    // Type checking
    if (sourceOutput.type !== targetInput.type) {
      errors.push(
        `Type mismatch: ${sourceOutput.type} cannot connect to ${targetInput.type}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire strategy
   */
  static validateStrategy(strategy: VisualStrategy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for at least one action block
    const actionBlocks = strategy.blocks.filter(b => b.type === BlockType.ACTION);
    if (actionBlocks.length === 0) {
      errors.push('Strategy must have at least one action block (BUY, SELL, or CLOSE)');
    }

    // Validate all connections
    for (const connection of strategy.connections) {
      const result = this.validateConnection(connection, strategy.blocks);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    // Check for required inputs
    for (const block of strategy.blocks) {
      for (const input of block.inputs) {
        if (input.required) {
          const hasConnection = strategy.connections.some(
            c => c.targetBlockId === block.id && c.targetInputId === input.id
          );
          
          if (!hasConnection) {
            errors.push(`Required input '${input.name}' on block ${block.id} is not connected`);
          }
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(strategy);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Check for disconnected blocks
    const disconnectedBlocks = this.findDisconnectedBlocks(strategy);
    if (disconnectedBlocks.length > 0) {
      warnings.push(`Disconnected blocks found: ${disconnectedBlocks.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Detect circular dependencies in strategy
   */
  private static detectCircularDependencies(strategy: VisualStrategy): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (blockId: string, path: string[]): void => {
      visited.add(blockId);
      recursionStack.add(blockId);
      path.push(blockId);

      // Find all blocks that this block connects to
      const outgoingConnections = strategy.connections.filter(
        c => c.sourceBlockId === blockId
      );

      for (const connection of outgoingConnections) {
        const targetId = connection.targetBlockId;

        if (!visited.has(targetId)) {
          dfs(targetId, [...path]);
        } else if (recursionStack.has(targetId)) {
          // Circular dependency found
          const cycleStart = path.indexOf(targetId);
          const cycle = path.slice(cycleStart).concat(targetId);
          cycles.push(cycle.join(' -> '));
        }
      }

      recursionStack.delete(blockId);
    };

    for (const block of strategy.blocks) {
      if (!visited.has(block.id)) {
        dfs(block.id, []);
      }
    }

    return cycles;
  }

  /**
   * Find blocks that are not connected to any action
   */
  private static findDisconnectedBlocks(strategy: VisualStrategy): string[] {
    const actionBlocks = strategy.blocks
      .filter(b => b.type === BlockType.ACTION)
      .map(b => b.id);

    const connectedBlocks = new Set<string>(actionBlocks);

    // Traverse backwards from action blocks
    const traverse = (blockId: string): void => {
      const incomingConnections = strategy.connections.filter(
        c => c.targetBlockId === blockId
      );

      for (const connection of incomingConnections) {
        if (!connectedBlocks.has(connection.sourceBlockId)) {
          connectedBlocks.add(connection.sourceBlockId);
          traverse(connection.sourceBlockId);
        }
      }
    };

    for (const actionBlockId of actionBlocks) {
      traverse(actionBlockId);
    }

    // Find blocks not in connected set
    return strategy.blocks
      .filter(b => !connectedBlocks.has(b.id))
      .map(b => b.id);
  }

  /**
   * Get execution order for blocks (topological sort)
   */
  static getExecutionOrder(strategy: VisualStrategy): string[] {
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    for (const block of strategy.blocks) {
      inDegree.set(block.id, 0);
      adjacencyList.set(block.id, []);
    }

    // Build graph
    for (const connection of strategy.connections) {
      adjacencyList.get(connection.sourceBlockId)?.push(connection.targetBlockId);
      inDegree.set(connection.targetBlockId, (inDegree.get(connection.targetBlockId) || 0) + 1);
    }

    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Add all blocks with no incoming edges
    for (const [blockId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(blockId);
      }
    }

    while (queue.length > 0) {
      const blockId = queue.shift()!;
      result.push(blockId);

      const neighbors = adjacencyList.get(blockId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }
}
