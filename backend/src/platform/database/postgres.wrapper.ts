/**
 * DatabaseWrapper - PostgreSQL
 * Isolates database operations behind a clean interface
 * ~50 lines
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface Transaction {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export class DatabaseWrapper {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const result: QueryResult = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async insert<T>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const rows = await this.query<T>(sql, values);
    return rows[0];
  }

  async update(table: string, id: string, data: Record<string, any>): Promise<void> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1}`;
    await this.pool.query(sql, [...values, id]);
  }

  async delete(table: string, id: string): Promise<void> {
    await this.pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  }

  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();

    const transaction: Transaction = {
      query: async <R>(sql: string, params?: any[]): Promise<R[]> => {
        const result = await client.query(sql, params);
        return result.rows as R[];
      },
      commit: async () => { await client.query('COMMIT'); },
      rollback: async () => { await client.query('ROLLBACK'); },
    };

    try {
      await client.query('BEGIN');
      const result = await fn(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
