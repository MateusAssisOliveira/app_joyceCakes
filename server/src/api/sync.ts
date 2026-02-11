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

interface TableSummary {
  table: string;
  count: number;
  latestUpdatedAt: string | null;
}

interface ReconcileRequest {
  machineId?: string;
  clientSummary?: Record<string, { count?: number; latestUpdatedAt?: string | null }>;
}

// Rotas permitidas para sincronização
const allowedTables = ['products', 'orders', 'supplies', 'order_items'];

/**
 * GET /api/sync/reconcile
 * Obter resumo atual do servidor por tabela.
 */
router.get('/reconcile', async (req: Request, res: Response) => {
  try {
    const serverSummary = await buildServerSummary();
    res.json({
      success: true,
      serverSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao reconciliar (GET):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro na reconciliação',
    });
  }
});

/**
 * POST /api/sync/reconcile
 * Comparar snapshot do cliente com estado do servidor.
 *
 * Body:
 * {
 *   "clientSummary": {
 *     "products": { "count": 10, "latestUpdatedAt": "2026-02-11T18:00:00.000Z" }
 *   }
 * }
 */
router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const { machineId, clientSummary = {} }: ReconcileRequest = req.body || {};
    const serverSummary = await buildServerSummary();

    const mismatches = serverSummary
      .map((serverTable) => {
        const clientTable = clientSummary[serverTable.table];
        if (!clientTable) {
          return {
            table: serverTable.table,
            reason: 'missing_client_table',
            server: serverTable,
            client: null,
          };
        }

        const countMismatch = (clientTable.count ?? 0) !== serverTable.count;
        const latestMismatch =
          normalizeTimestamp(clientTable.latestUpdatedAt) !==
          normalizeTimestamp(serverTable.latestUpdatedAt);

        if (!countMismatch && !latestMismatch) {
          return null;
        }

        return {
          table: serverTable.table,
          reason: countMismatch && latestMismatch
            ? 'count_and_latest_updatedAt_mismatch'
            : countMismatch
              ? 'count_mismatch'
              : 'latest_updatedAt_mismatch',
          server: serverTable,
          client: {
            count: clientTable.count ?? 0,
            latestUpdatedAt: clientTable.latestUpdatedAt ?? null,
          },
        };
      })
      .filter(Boolean);

    await persistReconcileResult({
      machineId: machineId || null,
      serverSummary,
      mismatches: mismatches as Array<Record<string, unknown>>,
      isConsistent: mismatches.length === 0,
    });

    res.json({
      success: true,
      isConsistent: mismatches.length === 0,
      serverSummary,
      mismatches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao reconciliar (POST):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro na reconciliação',
    });
  }
});

/**
 * GET /api/sync/reconcile/history?limit=20&machineId=machine-1&onlyInconsistent=true
 * Consultar histórico de reconciliações para auditoria.
 */
router.get('/reconcile/history', async (req: Request, res: Response) => {
  try {
    const { limit, machineId, onlyInconsistent } = req.query as {
      limit?: string;
      machineId?: string;
      onlyInconsistent?: string;
    };

    const parsedLimit = Math.min(Math.max(parseInt(limit || '20', 10), 1), 200);
    const where: string[] = [];
    const params: unknown[] = [];

    if (machineId) {
      params.push(machineId);
      where.push(`machine_id = $${params.length}`);
    }

    if (onlyInconsistent === 'true') {
      where.push('is_consistent = false');
    }

    params.push(parsedLimit);
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await queryAll(
      `SELECT id, machine_id, is_consistent, mismatches_count, server_summary, mismatches, created_at
       FROM reconcile_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de reconciliação:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar histórico',
    });
  }
});

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
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Tabela inválida' });
    }

    console.log(`🔄 Sincronizando: ${table} (máquina: ${machineId})`);

    // 1️⃣ Inserir/atualizar dados locais no servidor
    const conflicts: any[] = [];
    
    for (const update of localUpdates) {
      const { eventId, record } = normalizeUpdate(update);

      if (eventId) {
        const alreadyProcessed = await isEventProcessed(eventId);
        if (alreadyProcessed) {
          continue;
        }
      }

      try {
        const { recordId, action } = await upsertRecord(table, record, machineId);

        if (eventId) {
          await markEventProcessed(eventId, table, recordId, machineId);
        }

        if (action === 'SKIP_STALE') {
          conflicts.push({
            id: recordId,
            error: 'Registro mais recente no servidor',
            resolution: 'skipped_stale'
          });
        }
      } catch (error) {
        conflicts.push({
          id: record?.id,
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
): Promise<{ recordId: string; action: 'UPDATE' | 'INSERT' | 'SKIP_STALE' | 'DELETE' }> {
  if (!record || typeof record !== 'object') {
    throw new Error('Registro inválido para sincronização');
  }

  if (record._op === 'delete') {
    if (!record.id) {
      throw new Error('Delete sem id');
    }

    await query(`DELETE FROM ${table} WHERE id = $1`, [record.id]);
    await query(
      `INSERT INTO deleted_records (table_name, record_id, machine_id, deleted_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (table_name, record_id)
       DO UPDATE SET deleted_at = EXCLUDED.deleted_at, machine_id = EXCLUDED.machine_id`,
      [table, record.id, machineId]
    );
    await query(
      `INSERT INTO sync_log (table_name, record_id, action, machine_id)
       VALUES ($1, $2, $3, $4)`,
      [table, record.id, 'DELETE', machineId]
    );

    return { recordId: record.id, action: 'DELETE' };
  }

  const incomingUpdatedAt = record.updatedAt ? new Date(record.updatedAt) : null;

  const columns = Object.keys(record)
    .filter(k => k !== 'id' && k !== 'createdAt' && k !== 'eventId' && k !== 'updatedAt')
    .concat('updatedAt');
  
  const values = Object.values(record)
    .filter((_, i) => !Object.keys(record)[i].match(/^(id|createdAt|eventId|updatedAt)$/))
    .concat(new Date());

  // Garantir que ID existe
  if (!record.id) {
    record.id = uuidv4();
  }

  // Verificar se já existe
  const existing = await queryOne(
    `SELECT id, updatedAt FROM ${table} WHERE id = $1`,
    [record.id]
  );

  if (existing) {
    if (incomingUpdatedAt && existing.updatedat && existing.updatedat > incomingUpdatedAt) {
      await query(
        `INSERT INTO sync_log (table_name, record_id, action, machine_id)
         VALUES ($1, $2, $3, $4)`,
        [table, record.id, 'SKIP_STALE', machineId]
      );
      return { recordId: record.id, action: 'SKIP_STALE' };
    }

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

  // Se o registro foi recriado/atualizado, remove tombstone antigo
  await query(
    `DELETE FROM deleted_records WHERE table_name = $1 AND record_id = $2`,
    [table, record.id]
  );

  // Log de sincronização
  await query(
    `INSERT INTO sync_log (table_name, record_id, action, machine_id)
     VALUES ($1, $2, $3, $4)`,
    [table, record.id, existing ? 'UPDATE' : 'INSERT', machineId]
  );

  return { recordId: record.id, action: existing ? 'UPDATE' : 'INSERT' };
}

/**
 * Buscar dados novos desde um timestamp
 */
async function fetchNewData(table: string, lastSync?: string): Promise<any[]> {
  const deletedRows = lastSync
    ? await queryAll(
        `SELECT record_id, deleted_at FROM deleted_records
         WHERE table_name = $1 AND deleted_at > $2
         ORDER BY deleted_at DESC`,
        [table, lastSync]
      )
    : await queryAll(
        `SELECT record_id, deleted_at FROM deleted_records
         WHERE table_name = $1
         ORDER BY deleted_at DESC
         LIMIT 1000`,
        [table]
      );

  const deleted = deletedRows.map((row) => ({
    id: row.record_id,
    _deleted: true,
    updatedAt: new Date(row.deleted_at).toISOString(),
  }));

  if (!lastSync) {
    // Se não tem lastSync, retorna todos (primeira sincronização)
    const rows = await queryAll(`SELECT * FROM ${table} ORDER BY updatedAt DESC LIMIT 1000`);
    const data = [...rows, ...deleted];
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return data;
  }

  // Retorna apenas o que foi modificado depois de lastSync
  const updatedRows = await queryAll(
    `SELECT * FROM ${table} 
     WHERE updatedAt > $1 
     ORDER BY updatedAt DESC`,
    [lastSync]
  );
  const data = [...updatedRows, ...deleted];
  data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return data;
}

function normalizeUpdate(update: any): { eventId?: string; record: any } {
  if (update && typeof update === 'object') {
    if ('record' in update) {
      const record = (update as { record: any }).record;
      const eventId = (update as { eventId?: string }).eventId;
      return { eventId, record };
    }

    if ('eventId' in update) {
      const { eventId, ...rest } = update as { eventId?: string };
      return { eventId, record: rest };
    }
  }

  return { record: update };
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await queryOne(
    'SELECT event_id FROM sync_events WHERE event_id = $1',
    [eventId]
  );
  return Boolean(existing);
}

async function markEventProcessed(
  eventId: string,
  table: string,
  recordId: string,
  machineId: string
): Promise<void> {
  await query(
    `INSERT INTO sync_events (event_id, table_name, record_id, machine_id)
     VALUES ($1, $2, $3, $4)`,
    [eventId, table, recordId, machineId]
  );
}

async function buildServerSummary(): Promise<TableSummary[]> {
  const summaries: TableSummary[] = [];

  for (const table of allowedTables) {
    const row = await queryOne(
      `SELECT COUNT(*)::int AS count, MAX(updatedAt) AS latest_updated_at FROM ${table}`
    );
    summaries.push({
      table,
      count: row?.count ?? 0,
      latestUpdatedAt: row?.latest_updated_at ? new Date(row.latest_updated_at).toISOString() : null,
    });
  }

  return summaries;
}

async function persistReconcileResult(input: {
  machineId: string | null;
  isConsistent: boolean;
  serverSummary: TableSummary[];
  mismatches: Array<Record<string, unknown>>;
}): Promise<void> {
  await query(
    `INSERT INTO reconcile_log (machine_id, is_consistent, mismatches_count, server_summary, mismatches)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
    [
      input.machineId,
      input.isConsistent,
      input.mismatches.length,
      JSON.stringify(input.serverSummary),
      JSON.stringify(input.mismatches),
    ]
  );
}

function normalizeTimestamp(ts?: string | null): string | null {
  if (!ts) {
    return null;
  }
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export { router as syncRouter };
