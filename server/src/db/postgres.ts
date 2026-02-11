// server/src/db/postgres.ts
// 🗄️ Conexão e Inicialização do PostgreSQL

import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Criar pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'joycecakes',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'joycecakes_db',
});

// Testar conexão
pool.on('error', (err: Error) => {
  console.error('❌ Erro na pool do PostgreSQL:', err);
});

/**
 * Inicializar BD com schema
 */
export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    try {
      // Criar tabelas
      await client.query(`
        -- Tabela de Insumos (Supplies)
        CREATE TABLE IF NOT EXISTS supplies (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          unit VARCHAR(10) NOT NULL,
          costPerUnit DECIMAL(10, 2) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Produtos
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          category VARCHAR(255),
          imageUrlId VARCHAR(255),
          stock_quantity INT NOT NULL DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Pedidos
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(255) PRIMARY KEY,
          customerName VARCHAR(255) NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Itens do Pedido
        CREATE TABLE IF NOT EXISTS order_items (
          id VARCHAR(255) PRIMARY KEY,
          order_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        -- Tabela de Sincronização (rastreia mudanças)
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          action VARCHAR(20) NOT NULL,
          machine_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Eventos já processados (idempotência)
        CREATE TABLE IF NOT EXISTS sync_events (
          event_id VARCHAR(255) PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255),
          machine_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Histórico de reconciliações para auditoria
        CREATE TABLE IF NOT EXISTS reconcile_log (
          id SERIAL PRIMARY KEY,
          machine_id VARCHAR(255),
          is_consistent BOOLEAN NOT NULL,
          mismatches_count INT NOT NULL DEFAULT 0,
          server_summary JSONB NOT NULL,
          mismatches JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tombstones de exclusão para sincronizar deletes entre máquinas
        CREATE TABLE IF NOT EXISTS deleted_records (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          machine_id VARCHAR(255),
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(table_name, record_id)
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_supplies_updated ON supplies(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_sync_log_table ON sync_log(table_name);
        CREATE INDEX IF NOT EXISTS idx_sync_events_table ON sync_events(table_name);
        CREATE INDEX IF NOT EXISTS idx_reconcile_log_created ON reconcile_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_reconcile_log_machine ON reconcile_log(machine_id);
        CREATE INDEX IF NOT EXISTS idx_deleted_records_table_time ON deleted_records(table_name, deleted_at DESC);
      `);

      console.log('✅ Schema criado/verificado no PostgreSQL');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar BD:', error);
    throw error;
  }
}

/**
 * Executar query
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✓ Query executada em ${duration}ms`);
    return result;
  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  }
}

/**
 * Obter uma linha
 */
export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0];
}

/**
 * Obter todas as linhas
 */
export async function queryAll(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

export { pool };
