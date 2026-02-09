// server/src/api/sync.ts
// 🔄 Endpoint Principal de Sincronização

import express, { Request, Response, Router } from 'express';
import { queryAll, queryOne, query } from '../db/postgres';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

interface SyncRequest {
  table: string;
  lastSync?: string;
  machineId: string;
  localUpdates?: any[];
}

interface SyncResponse {
  success: boolean;
  synced: any[];
  conflicts: any[];
  timestamp: string;
}

/**
 * POST /api/sync/:table
 * Sincronizar uma tabela específica
 *
 * Body:
 * {
 *   "lastSync": "2026-02-06T10:00:00Z",
 *   "machineId": "machine-1",
 *   "localUpdates": [...]
 * }
 */
router.post('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { lastSync, machineId, localUpdates = [] }: SyncRequest = req.body;

    // Validar tabela (contra SQL injection)
    const allowedTables = ['products', 'orders', 'supplies', 'order_items'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Tabela inválida' });
    }

    console.log(`🔄 Sincronizando: ${table} (máquina: ${machineId})`);

    // 1️⃣ Inserir/atualizar dados locais no servidor
    const conflicts: any[] = [];
    
    for (const update of localUpdates) {
      try {
        await upsertRecord(table, update, machineId);
      } catch (error) {
        conflicts.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          resolution: 'skipped'
        });
      }
    }

    // 2️⃣ Buscar dados novos desde lastSync
    const syncedData = await fetchNewData(table, lastSync);

    const response: SyncResponse = {
      success: true,
      synced: syncedData,
      conflicts,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro na sincronização'
    });
  }
});

/**
 * GET /api/sync/:table?lastSync=2026-02-06T10:00:00Z
 * Apenas obter dados novos (sem enviar updates)
 */
router.get('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { lastSync } = req.query as { lastSync?: string };

    // Validar tabela
    const allowedTables = ['products', 'orders', 'supplies', 'order_items'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Tabela inválida' });
    }

    console.log(`📥 Obtendo dados de: ${table} desde ${lastSync || 'sempre'}`);

    const data = await fetchNewData(table, lastSync);

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados'
    });
  }
});

/**
 * Inserir ou atualizar registro
 */
async function upsertRecord(
  table: string,
  record: any,
  machineId: string
): Promise<void> {
  const columns = Object.keys(record)
    .filter(k => k !== 'id' && k !== 'createdAt')
    .concat('updatedAt');
  
  const values = Object.values(record)
    .filter((_, i) => !Object.keys(record)[i].match(/^(id|createdAt)$/))
    .concat(new Date());

  // Garantir que ID existe
  if (!record.id) {
    record.id = uuidv4();
  }

  // Verificar se já existe
  const existing = await queryOne(
    `SELECT id FROM ${table} WHERE id = $1`,
    [record.id]
  );

  if (existing) {
    // UPDATE
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    await query(
      `UPDATE ${table} SET ${setClause} WHERE id = $${columns.length + 1}`,
      [...values, record.id]
    );
  } else {
    // INSERT
    const placeholders = Array.from({ length: columns.length + 1 }, (_, i) => `$${i + 1}`).join(', ');
    const cols = [...columns, 'id'].join(', ');
    await query(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
      [...values, record.id]
    );
  }

  // Log de sincronização
  await query(
    `INSERT INTO sync_log (table_name, record_id, action, machine_id)
     VALUES ($1, $2, $3, $4)`,
    [table, record.id, existing ? 'UPDATE' : 'INSERT', machineId]
  );
}

/**
 * Buscar dados novos desde um timestamp
 */
async function fetchNewData(table: string, lastSync?: string): Promise<any[]> {
  if (!lastSync) {
    // Se não tem lastSync, retorna todos (primeira sincronização)
    return await queryAll(`SELECT * FROM ${table} ORDER BY updatedAt DESC LIMIT 1000`);
  }

  // Retorna apenas o que foi modificado depois de lastSync
  return await queryAll(
    `SELECT * FROM ${table} 
     WHERE updatedAt > $1 
     ORDER BY updatedAt DESC`,
    [lastSync]
  );
}

export { router as syncRouter };
