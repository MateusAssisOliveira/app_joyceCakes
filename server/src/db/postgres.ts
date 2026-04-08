// server/src/db/postgres.ts
// Conexao e inicializacao do PostgreSQL

import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'joycecakes',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'joycecakes_db',
      }
);

pool.on('error', (err: Error) => {
  console.error('Erro na pool do PostgreSQL:', err);
});

export async function initializeDatabase() {
  try {
    const client = await pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS supplies (
          id VARCHAR(255) PRIMARY KEY,
          tenantId VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          sku VARCHAR(100) DEFAULT '',
          category VARCHAR(120) DEFAULT 'Geral',
          type VARCHAR(20) DEFAULT 'ingredient',
          stock INT NOT NULL DEFAULT 0,
          unit VARCHAR(10) NOT NULL,
          costPerUnit DECIMAL(10, 2) NOT NULL,
          purchaseFormat VARCHAR(30) DEFAULT 'unidade',
          packageCost DECIMAL(10, 2),
          packageQuantity DECIMAL(12, 3),
          supplier VARCHAR(255),
          lastPurchaseDate TIMESTAMP NULL,
          expirationDate TIMESTAMP NULL,
          minStock DECIMAL(12, 3) NOT NULL DEFAULT 0,
          isActive BOOLEAN NOT NULL DEFAULT true,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(255) PRIMARY KEY,
          tenantId VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          costPrice DECIMAL(10, 2) DEFAULT 0,
          category VARCHAR(255),
          imageUrlId VARCHAR(255),
          stock_quantity INT NOT NULL DEFAULT 0,
          isActive BOOLEAN NOT NULL DEFAULT true,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(255) PRIMARY KEY,
          tenantId VARCHAR(255),
          orderNumber VARCHAR(255),
          customerName VARCHAR(255) NOT NULL,
          userId VARCHAR(255),
          cashRegisterId VARCHAR(255),
          paymentMethod VARCHAR(100),
          total DECIMAL(10, 2) NOT NULL,
          totalCost DECIMAL(10, 2) NOT NULL DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id VARCHAR(255) PRIMARY KEY,
          tenantId VARCHAR(255),
          order_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS technical_sheets (
          id VARCHAR(255) PRIMARY KEY,
          tenantId VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL DEFAULT 'base',
          components JSONB NOT NULL DEFAULT '[]'::jsonb,
          steps TEXT,
          yield VARCHAR(255),
          totalCost DECIMAL(10, 2) NOT NULL DEFAULT 0,
          suggestedPrice DECIMAL(10, 2) NOT NULL DEFAULT 0,
          preparationTime INT,
          laborCost DECIMAL(10, 2) NOT NULL DEFAULT 0,
          fixedCost DECIMAL(10, 2) NOT NULL DEFAULT 0,
          isActive BOOLEAN NOT NULL DEFAULT true,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          tenant_id VARCHAR(255),
          action VARCHAR(20) NOT NULL,
          machine_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sync_events (
          event_id VARCHAR(255) PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255),
          machine_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reconcile_log (
          id SERIAL PRIMARY KEY,
          machine_id VARCHAR(255),
          tenant_id VARCHAR(255),
          is_consistent BOOLEAN NOT NULL,
          mismatches_count INT NOT NULL DEFAULT 0,
          server_summary JSONB NOT NULL,
          mismatches JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS deleted_records (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          tenant_id VARCHAR(255),
          machine_id VARCHAR(255),
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(table_name, record_id)
        );

        CREATE TABLE IF NOT EXISTS bootstrap_state (
          table_name VARCHAR(50) PRIMARY KEY,
          status VARCHAR(20) NOT NULL,
          tenant_id VARCHAR(255),
          machine_id VARCHAR(255),
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          records_count INT NOT NULL DEFAULT 0
        );

        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS tenantId VARCHAR(255);
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS sku VARCHAR(100) DEFAULT '';
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS category VARCHAR(120) DEFAULT 'Geral';
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'ingredient';
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS purchaseFormat VARCHAR(30) DEFAULT 'unidade';
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS packageCost DECIMAL(10, 2);
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS packageQuantity DECIMAL(12, 3);
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS lastPurchaseDate TIMESTAMP NULL;
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS expirationDate TIMESTAMP NULL;
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS minStock DECIMAL(12, 3) DEFAULT 0;
        ALTER TABLE supplies ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS tenantId VARCHAR(255);
        ALTER TABLE products ADD COLUMN IF NOT EXISTS costPrice DECIMAL(10, 2) DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenantId VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS orderNumber VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS userId VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashRegisterId VARCHAR(255);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(100);
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS totalCost DECIMAL(10, 2) DEFAULT 0;
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tenantId VARCHAR(255);
        ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
        ALTER TABLE reconcile_log ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
        ALTER TABLE deleted_records ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
        ALTER TABLE bootstrap_state ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
        ALTER TABLE technical_sheets ADD COLUMN IF NOT EXISTS preparationTime INT;
        ALTER TABLE technical_sheets ADD COLUMN IF NOT EXISTS laborCost DECIMAL(10, 2) DEFAULT 0;
        ALTER TABLE technical_sheets ADD COLUMN IF NOT EXISTS fixedCost DECIMAL(10, 2) DEFAULT 0;

        UPDATE supplies
        SET sku = COALESCE(sku, ''),
            category = COALESCE(NULLIF(category, ''), 'Geral'),
            type = COALESCE(NULLIF(type, ''), 'ingredient'),
            purchaseFormat = COALESCE(NULLIF(purchaseFormat, ''), CASE WHEN unit = 'un' THEN 'unidade' ELSE 'pacote' END),
            packageQuantity = COALESCE(packageQuantity, 1),
            packageCost = COALESCE(packageCost, costPerUnit * COALESCE(packageQuantity, 1)),
            minStock = COALESCE(minStock, 0),
            isActive = COALESCE(isActive, true)
        WHERE sku IS NULL
           OR category IS NULL
           OR type IS NULL
           OR purchaseFormat IS NULL
           OR packageQuantity IS NULL
           OR packageCost IS NULL
           OR minStock IS NULL
           OR isActive IS NULL;

        CREATE INDEX IF NOT EXISTS idx_supplies_updated ON supplies(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_supplies_tenant_updated ON supplies(tenantId, updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_supplies_tenant_type ON supplies(tenantId, type);
        CREATE INDEX IF NOT EXISTS idx_supplies_tenant_category ON supplies(tenantId, category);
        CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_products_tenant_updated ON products(tenantId, updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_tenant_updated ON orders(tenantId, updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_order_items_tenant_updated ON order_items(tenantId, updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_technical_sheets_updated ON technical_sheets(updatedAt DESC);
        CREATE INDEX IF NOT EXISTS idx_technical_sheets_tenant_updated ON technical_sheets(tenantId, updatedAt DESC);

        CREATE INDEX IF NOT EXISTS idx_sync_log_table ON sync_log(table_name);
        CREATE INDEX IF NOT EXISTS idx_sync_log_tenant_table ON sync_log(tenant_id, table_name);
        CREATE INDEX IF NOT EXISTS idx_sync_events_table ON sync_events(table_name);
        CREATE INDEX IF NOT EXISTS idx_reconcile_log_created ON reconcile_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_reconcile_log_machine ON reconcile_log(machine_id);
        CREATE INDEX IF NOT EXISTS idx_reconcile_log_tenant ON reconcile_log(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_deleted_records_table_time ON deleted_records(table_name, deleted_at DESC);
        CREATE INDEX IF NOT EXISTS idx_deleted_records_tenant_table_time ON deleted_records(tenant_id, table_name, deleted_at DESC);
        CREATE INDEX IF NOT EXISTS idx_bootstrap_state_status ON bootstrap_state(status);
        CREATE INDEX IF NOT EXISTS idx_bootstrap_state_tenant_table ON bootstrap_state(tenant_id, table_name);
      `);

      console.log('Schema criado/verificado no PostgreSQL');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao inicializar BD:', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Query executada em ${duration}ms`);
    return result;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
}

export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0];
}

export async function queryAll(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

export { pool };
