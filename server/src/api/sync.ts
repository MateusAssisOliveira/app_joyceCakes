// server/src/api/sync.ts
// Endpoint principal de sincronizacao

import express, { Request, Response, Router } from 'express';
import { queryAll, queryOne, query } from '../db/postgres';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

interface SyncRequest {
  table: string;
  lastSync?: string;
  machineId: string;
  tenantId?: string;
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
  tenantId?: string;
  clientSummary?: Record<string, { count?: number; latestUpdatedAt?: string | null }>;
}

interface BootstrapRequest {
  machineId: string;
  tenantId?: string;
  localUpdates?: any[];
}

const allowedTables = ['products', 'orders', 'supplies', 'order_items', 'technical_sheets'];
const tenantScopedTables = new Set(allowedTables);
const tableColumns: Record<string, Set<string>> = {
  products: new Set([
    'tenantid',
    'name',
    'description',
    'price',
    'costprice',
    'category',
    'imageurlid',
    'stock_quantity',
    'isactive',
  ]),
  orders: new Set([
    'tenantid',
    'ordernumber',
    'customername',
    'userid',
    'cashregisterid',
    'paymentmethod',
    'total',
    'totalcost',
    'status',
  ]),
  supplies: new Set([
    'tenantid',
    'name',
    'sku',
    'category',
    'type',
    'stock',
    'unit',
    'costperunit',
    'purchaseformat',
    'packagecost',
    'packagequantity',
    'supplier',
    'lastpurchasedate',
    'expirationdate',
    'minstock',
    'isactive',
  ]),
  order_items: new Set([
    'tenantid',
    'order_id',
    'product_id',
    'quantity',
    'price',
  ]),
  technical_sheets: new Set([
    'tenantid',
    'name',
    'description',
    'type',
    'components',
    'steps',
    'yield',
    'totalcost',
    'suggestedprice',
    'preparationtime',
    'laborcost',
    'fixedcost',
    'isactive',
  ]),
};
const diagnosticsFields: Record<string, string[]> = {
  products: ['name', 'price', 'costprice', 'category', 'stock_quantity', 'isactive'],
  orders: ['ordernumber', 'customername', 'paymentmethod', 'total', 'status'],
  supplies: [
    'name',
    'type',
    'category',
    'stock',
    'unit',
    'costperunit',
    'purchaseformat',
    'packagecost',
    'packagequantity',
    'minstock',
    'isactive',
  ],
  technical_sheets: ['name', 'components', 'totalcost', 'isactive'],
};

function normalizeTenantId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function resolveTenantId(req: Request, body?: any): string | undefined {
  return (
    normalizeTenantId(body?.tenantId) ||
    normalizeTenantId(req.query?.tenantId) ||
    normalizeTenantId(req.header('x-tenant-id'))
  );
}

function tenantWhereClause(
  table: string,
  tenantId: string | undefined,
  startParamIndex: number,
  column = 'tenantId'
): { sql: string; params: unknown[] } {
  if (!tenantId || !tenantScopedTables.has(table)) {
    return { sql: '', params: [] };
  }
  return {
    sql: ` AND ${column} = $${startParamIndex}`,
    params: [tenantId],
  };
}

router.get('/reconcile', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const serverSummary = await buildServerSummary(tenantId);
    res.json({
      success: true,
      serverSummary,
      tenantId: tenantId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao reconciliar (GET):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro na reconciliacao',
    });
  }
});

router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const { machineId, clientSummary = {} }: ReconcileRequest = req.body || {};
    const tenantId = resolveTenantId(req, req.body);
    const serverSummary = await buildServerSummary(tenantId);

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

        if (!countMismatch && !latestMismatch) return null;

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
      tenantId: tenantId || null,
      serverSummary,
      mismatches: mismatches as Array<Record<string, unknown>>,
      isConsistent: mismatches.length === 0,
    });

    res.json({
      success: true,
      isConsistent: mismatches.length === 0,
      tenantId: tenantId || null,
      serverSummary,
      mismatches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao reconciliar (POST):', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro na reconciliacao',
    });
  }
});

router.get('/reconcile/history', async (req: Request, res: Response) => {
  try {
    const { limit, machineId, onlyInconsistent } = req.query as {
      limit?: string;
      machineId?: string;
      onlyInconsistent?: string;
    };

    const tenantId = resolveTenantId(req);
    const parsedLimit = Math.min(Math.max(parseInt(limit || '20', 10), 1), 200);
    const where: string[] = [];
    const params: unknown[] = [];

    if (machineId) {
      params.push(machineId);
      where.push(`machine_id = $${params.length}`);
    }

    if (tenantId) {
      params.push(tenantId);
      where.push(`tenant_id = $${params.length}`);
    }

    if (onlyInconsistent === 'true') {
      where.push('is_consistent = false');
    }

    params.push(parsedLimit);
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await queryAll(
      `SELECT id, machine_id, tenant_id, is_consistent, mismatches_count, server_summary, mismatches, created_at
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
    console.error('Erro ao buscar historico de reconciliacao:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar historico',
    });
  }
});

router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const output: Record<string, unknown> = {};

    for (const table of allowedTables) {
      const where = tenantId && tenantScopedTables.has(table) ? 'WHERE tenantId = $1' : '';
      const params = tenantId && tenantScopedTables.has(table) ? [tenantId] : [];
      const base = await queryOne(
        `SELECT COUNT(*)::int AS total, MAX(updatedAt) AS latest_updated_at FROM ${table} ${where}`,
        params
      );

      const required = diagnosticsFields[table] || [];
      const missingByField: Record<string, number> = {};

      for (const field of required) {
        const missing = await queryOne(
          `SELECT COUNT(*)::int AS missing
           FROM ${table}
           ${where ? `${where} AND` : 'WHERE'}
           (${field} IS NULL OR (CAST(${field} AS TEXT) = ''))`,
          params
        );
        missingByField[field] = missing?.missing ?? 0;
      }

      output[table] = {
        total: base?.total ?? 0,
        latestUpdatedAt: base?.latest_updated_at ? new Date(base.latest_updated_at).toISOString() : null,
        missingByField,
      };
    }

    res.json({
      success: true,
      tenantId: tenantId || null,
      diagnostics: output,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar diagnostico:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar diagnostico',
    });
  }
});

router.post('/bootstrap/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { machineId, localUpdates = [] }: BootstrapRequest = req.body || {};
    const tenantId = resolveTenantId(req, req.body);

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ success: false, error: 'Tabela invalida' });
    }

    if (!machineId) {
      return res.status(400).json({ success: false, error: 'machineId e obrigatorio' });
    }

    const bootstrapState = await queryOne(
      `SELECT table_name, status, machine_id FROM bootstrap_state WHERE table_name = $1`,
      [table]
    );

    if (bootstrapState?.status === 'completed') {
      return res.json({ success: true, bootstrapped: false, reason: 'already_completed' });
    }

    if (bootstrapState?.status === 'in_progress' && bootstrapState.machine_id !== machineId) {
      return res.json({ success: true, bootstrapped: false, reason: 'locked_by_other_machine' });
    }

    await query(
      `INSERT INTO bootstrap_state (table_name, status, tenant_id, machine_id, started_at, records_count)
       VALUES ($1, 'in_progress', $2, $3, NOW(), 0)
       ON CONFLICT (table_name)
       DO UPDATE SET status = 'in_progress', tenant_id = $2, machine_id = $3, started_at = NOW()`,
      [table, tenantId || null, machineId]
    );

    const countTenantFilter = tenantWhereClause(table, tenantId, 1);
    const currentCountRow = await queryOne(
      `SELECT COUNT(*)::int AS count FROM ${table} WHERE 1=1${countTenantFilter.sql}`,
      [...countTenantFilter.params]
    );

    if ((currentCountRow?.count ?? 0) > 0) {
      await query(
        `UPDATE bootstrap_state
         SET status = 'completed', completed_at = NOW(), records_count = $2
         WHERE table_name = $1`,
        [table, currentCountRow.count]
      );
      return res.json({ success: true, bootstrapped: false, reason: 'server_not_empty' });
    }

    let processed = 0;
    const conflicts: any[] = [];
    for (const update of localUpdates) {
      const { eventId, record } = normalizeUpdate(update);
      if (!record || typeof record !== 'object') continue;

      if (eventId) {
        const alreadyProcessed = await isEventProcessed(eventId);
        if (alreadyProcessed) continue;
      }

      try {
        const { recordId } = await upsertRecord(table, record, machineId, tenantId);
        if (eventId) {
          await markEventProcessed(eventId, table, recordId, machineId);
        }
        processed += 1;
      } catch (error) {
        conflicts.push({
          id: record?.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    await query(
      `UPDATE bootstrap_state
       SET status = 'completed', completed_at = NOW(), records_count = $2
       WHERE table_name = $1`,
      [table, processed]
    );

    return res.json({
      success: true,
      bootstrapped: processed > 0,
      processed,
      conflicts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no bootstrap inicial:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro no bootstrap',
    });
  }
});

router.post('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { lastSync, machineId, localUpdates = [] }: SyncRequest = req.body;
    const tenantId = resolveTenantId(req, req.body);

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Tabela invalida' });
    }

    console.log(`Sincronizando: ${table} (maquina: ${machineId}, tenant: ${tenantId || 'GLOBAL'})`);

    const conflicts: any[] = [];

    for (const update of localUpdates) {
      const { eventId, record } = normalizeUpdate(update);

      if (eventId) {
        const alreadyProcessed = await isEventProcessed(eventId);
        if (alreadyProcessed) continue;
      }

      try {
        const { recordId, action } = await upsertRecord(table, record, machineId, tenantId);

        if (eventId) {
          await markEventProcessed(eventId, table, recordId, machineId);
        }

        if (action === 'SKIP_STALE') {
          conflicts.push({
            id: recordId,
            error: 'Registro mais recente no servidor',
            resolution: 'skipped_stale',
          });
        }
      } catch (error) {
        conflicts.push({
          id: record?.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          resolution: 'skipped',
        });
      }
    }

    const syncedData = await fetchNewData(table, lastSync, tenantId);

    const response: SyncResponse = {
      success: true,
      synced: syncedData,
      conflicts,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro na sincronizacao',
    });
  }
});

router.get('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const { lastSync } = req.query as { lastSync?: string };
    const tenantId = resolveTenantId(req);

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Tabela invalida' });
    }

    console.log(`Obtendo dados de: ${table} desde ${lastSync || 'sempre'} (tenant: ${tenantId || 'GLOBAL'})`);

    const data = await fetchNewData(table, lastSync, tenantId);

    res.json({
      success: true,
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados',
    });
  }
});

async function upsertRecord(
  table: string,
  record: any,
  machineId: string,
  tenantId?: string
): Promise<{ recordId: string; action: 'UPDATE' | 'INSERT' | 'SKIP_STALE' | 'DELETE' }> {
  if (!record || typeof record !== 'object') {
    throw new Error('Registro invalido para sincronizacao');
  }

  if (record._op === 'delete') {
    if (!record.id) {
      throw new Error('Delete sem id');
    }

    const delTenantFilter = tenantWhereClause(table, tenantId, 2);
    await query(
      `DELETE FROM ${table} WHERE id = $1${delTenantFilter.sql}`,
      [record.id, ...delTenantFilter.params]
    );

    await query(
      `INSERT INTO deleted_records (table_name, record_id, tenant_id, machine_id, deleted_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (table_name, record_id)
       DO UPDATE SET deleted_at = EXCLUDED.deleted_at, machine_id = EXCLUDED.machine_id, tenant_id = EXCLUDED.tenant_id`,
      [table, record.id, tenantId || null, machineId]
    );

    await query(
      `INSERT INTO sync_log (table_name, record_id, tenant_id, action, machine_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [table, record.id, tenantId || null, 'DELETE', machineId]
    );

    return { recordId: record.id, action: 'DELETE' };
  }

  const incomingUpdatedAt = record.updatedAt ? new Date(record.updatedAt) : null;

  if (!record.id) {
    record.id = uuidv4();
  }

  if (tenantId && tenantScopedTables.has(table) && !record.tenantId) {
    record.tenantId = tenantId;
  }

  const allowedColumns = tableColumns[table] || new Set<string>();
  const sourceKeys = Object.keys(record).filter((k) => {
    if (k === 'id' || k === 'createdAt' || k === 'eventId' || k === 'updatedAt') {
      return false;
    }
    return allowedColumns.has(k.toLowerCase());
  });
  const columns = [...sourceKeys, 'updatedAt'];
  const values = [...sourceKeys.map((k) => record[k]), new Date()];

  const existsTenantFilter = tenantWhereClause(table, tenantId, 2);
  const existing = await queryOne(
    `SELECT id, updatedAt FROM ${table} WHERE id = $1${existsTenantFilter.sql}`,
    [record.id, ...existsTenantFilter.params]
  );

  if (existing) {
    if (incomingUpdatedAt && existing.updatedat && existing.updatedat > incomingUpdatedAt) {
      await query(
        `INSERT INTO sync_log (table_name, record_id, tenant_id, action, machine_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [table, record.id, tenantId || null, 'SKIP_STALE', machineId]
      );
      return { recordId: record.id, action: 'SKIP_STALE' };
    }

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const updateTenantFilter = tenantWhereClause(table, tenantId, columns.length + 2);
    await query(
      `UPDATE ${table} SET ${setClause} WHERE id = $${columns.length + 1}${updateTenantFilter.sql}`,
      [...values, record.id, ...updateTenantFilter.params]
    );
  } else {
    const placeholders = Array.from({ length: columns.length + 1 }, (_, i) => `$${i + 1}`).join(', ');
    const cols = [...columns, 'id'].join(', ');
    await query(
      `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
      [...values, record.id]
    );
  }

  await query(
    `DELETE FROM deleted_records WHERE table_name = $1 AND record_id = $2`,
    [table, record.id]
  );

  await query(
    `INSERT INTO sync_log (table_name, record_id, tenant_id, action, machine_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [table, record.id, tenantId || null, existing ? 'UPDATE' : 'INSERT', machineId]
  );

  return { recordId: record.id, action: existing ? 'UPDATE' : 'INSERT' };
}

async function fetchNewData(table: string, lastSync?: string, tenantId?: string): Promise<any[]> {
  const deletedRows = lastSync
    ? await queryAll(
        `SELECT record_id, deleted_at FROM deleted_records
         WHERE table_name = $1
           AND ($2::text IS NULL OR tenant_id = $2)
           AND deleted_at > $3
         ORDER BY deleted_at DESC`,
        [table, tenantId || null, lastSync]
      )
    : await queryAll(
        `SELECT record_id, deleted_at FROM deleted_records
         WHERE table_name = $1
           AND ($2::text IS NULL OR tenant_id = $2)
         ORDER BY deleted_at DESC
         LIMIT 1000`,
        [table, tenantId || null]
      );

  const deleted = deletedRows.map((row: { record_id: string; deleted_at: string | Date }) => ({
    id: row.record_id,
    _deleted: true,
    updatedAt: new Date(row.deleted_at).toISOString(),
  }));

  if (!lastSync) {
    const rows = tenantId
      ? await queryAll(
          `SELECT * FROM ${table}
           WHERE tenantId = $1
           ORDER BY updatedAt DESC
           LIMIT 1000`,
          [tenantId]
        )
      : await queryAll(`SELECT * FROM ${table} ORDER BY updatedAt DESC LIMIT 1000`);

    const data = [...rows, ...deleted];
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return data;
  }

  const updatedRows = tenantId
    ? await queryAll(
        `SELECT * FROM ${table}
         WHERE updatedAt > $1
           AND tenantId = $2
         ORDER BY updatedAt DESC`,
        [lastSync, tenantId]
      )
    : await queryAll(
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
  const existing = await queryOne('SELECT event_id FROM sync_events WHERE event_id = $1', [eventId]);
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

async function buildServerSummary(tenantId?: string): Promise<TableSummary[]> {
  const summaries: TableSummary[] = [];

  for (const table of allowedTables) {
    const row = tenantId
      ? await queryOne(
          `SELECT COUNT(*)::int AS count, MAX(updatedAt) AS latest_updated_at
           FROM ${table}
           WHERE tenantId = $1`,
          [tenantId]
        )
      : await queryOne(
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
  tenantId: string | null;
  isConsistent: boolean;
  serverSummary: TableSummary[];
  mismatches: Array<Record<string, unknown>>;
}): Promise<void> {
  await query(
    `INSERT INTO reconcile_log (machine_id, tenant_id, is_consistent, mismatches_count, server_summary, mismatches)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
    [
      input.machineId,
      input.tenantId,
      input.isConsistent,
      input.mismatches.length,
      JSON.stringify(input.serverSummary),
      JSON.stringify(input.mismatches),
    ]
  );
}

function normalizeTimestamp(ts?: string | null): string | null {
  if (!ts) return null;
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export { router as syncRouter };
