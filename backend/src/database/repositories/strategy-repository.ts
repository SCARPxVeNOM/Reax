/**
 * Strategy Repository
 */

import { query } from '../connection';

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  type: 'PINESCRIPT' | 'VISUAL';
  code?: string;
  visualData?: any;
  microchainId?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  initialCapital: number;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
}

export class StrategyRepository {
  async create(strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy> {
    const result = await query(
      `INSERT INTO strategies (user_id, name, type, code, visual_data, microchain_id, status, initial_capital)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        strategy.userId,
        strategy.name,
        strategy.type,
        strategy.code,
        strategy.visualData ? JSON.stringify(strategy.visualData) : null,
        strategy.microchainId,
        strategy.status,
        strategy.initialCapital,
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<Strategy | null> {
    const result = await query('SELECT * FROM strategies WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Strategy[]> {
    const result = await query(
      'SELECT * FROM strategies WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(row => this.mapRow(row));
  }

  async findByStatus(status: Strategy['status']): Promise<Strategy[]> {
    const result = await query(
      'SELECT * FROM strategies WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows.map(row => this.mapRow(row));
  }

  async update(id: string, updates: Partial<Strategy>): Promise<Strategy | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.code !== undefined) {
      fields.push(`code = $${paramIndex++}`);
      values.push(updates.code);
    }
    if (updates.visualData !== undefined) {
      fields.push(`visual_data = $${paramIndex++}`);
      values.push(JSON.stringify(updates.visualData));
    }
    if (updates.microchainId !== undefined) {
      fields.push(`microchain_id = $${paramIndex++}`);
      values.push(updates.microchainId);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.deployedAt !== undefined) {
      fields.push(`deployed_at = $${paramIndex++}`);
      values.push(updates.deployedAt);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE strategies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM strategies WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  async findActiveStrategies(): Promise<Strategy[]> {
    return this.findByStatus('ACTIVE');
  }

  private mapRow(row: any): Strategy {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      code: row.code,
      visualData: row.visual_data,
      microchainId: row.microchain_id,
      status: row.status,
      initialCapital: parseFloat(row.initial_capital),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deployedAt: row.deployed_at,
    };
  }
}

export const strategyRepository = new StrategyRepository();
