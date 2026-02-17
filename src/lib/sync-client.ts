// src/lib/sync-client.ts
// 🔄 Cliente de Sincronização para Front-end (Next.js)

import { setSyncStatusPatch } from "@/lib/sync-status-store";

export type SyncConfig = {
  serverUrl: string;
  machineId: string;
  syncApiKey?: string;
  autoBootstrap: boolean;
  autoSync: boolean;
  syncInterval: number; // ms
  retryAttempts: number;
  retryBaseDelay: number; // ms
  retryMaxDelay: number; // ms
  autoReconcile: boolean;
  reconcileInterval: number; // ms
  getClientSummary?: () => Promise<ClientSummary> | ClientSummary;
  getTableData?: (table: string) => Promise<SyncRecord[]>;
  divergenceStrategy: "none" | "refresh_mismatched" | "full_resync";
  onDivergence?: (result: ReconcileResponse) => void | Promise<void>;
};

export type SyncRecord = {
  id: string;
  [key: string]: any;
  updatedAt?: string;
  eventId?: string;
  _deleted?: boolean;
};

type SyncUpdateEnvelope = {
  eventId: string;
  record: SyncRecord;
};

type TableSummary = {
  table: string;
  count: number;
  latestUpdatedAt: string | null;
};

export type ClientSummary = Record<
  string,
  {
    count?: number;
    latestUpdatedAt?: string | null;
  }
>;

type ReconcileResponse = {
  success: boolean;
  isConsistent: boolean;
  serverSummary: TableSummary[];
  mismatches: Array<{
    table: string;
    reason: string;
    server: TableSummary;
    client: { count: number; latestUpdatedAt: string | null } | null;
  }>;
  timestamp: string;
};

export class SyncClient {
  private config: SyncConfig;
  private lastSync: Map<string, string> = new Map();
  private tableCache: Map<string, Map<string, SyncRecord>> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private reconcileTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = this.buildConfig(config);

    console.log(`🔄 SyncClient inicializado`);
    console.log(`   📍 Servidor: ${this.config.serverUrl}`);
    console.log(`   🖥️  Máquina ID: ${this.config.machineId}`);

    // Iniciar auto-sync
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    if (this.config.autoReconcile) {
      this.startAutoReconcile();
    }
  }

  updateConfig(config: Partial<SyncConfig> = {}): void {
    this.config = this.buildConfig({
      ...this.config,
      ...config,
      machineId: config.machineId || this.config.machineId,
    });

    if (this.config.autoSync && !this.syncInterval) {
      this.startAutoSync();
    } else if (!this.config.autoSync && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.config.autoReconcile && !this.reconcileTimer) {
      this.startAutoReconcile();
    } else if (!this.config.autoReconcile && this.reconcileTimer) {
      clearInterval(this.reconcileTimer);
      this.reconcileTimer = null;
    }
  }

  /**
   * Sincronizar tabela específica
   * @param table - Nome da tabela (products, orders, supplies)
   * @param localUpdates - Dados locais para enviar ao servidor
   */
  async sync(table: string, localUpdates: SyncRecord[] = []): Promise<any> {
    try {
      const lastSync = this.lastSync.get(table);
      const updatesWithEventId = localUpdates.map((update) =>
        this.normalizeUpdate(update)
      );
      
      const response = await this.requestWithRetry(
        () =>
          fetch(`${this.config.serverUrl}/api/sync/${table}`, {
            method: 'POST',
            headers: this.getJsonHeaders(),
            body: JSON.stringify({
              table,
              lastSync,
              machineId: this.config.machineId,
              localUpdates: updatesWithEventId,
            }),
          }),
        `sync:${table}`
      );

      const data = await this.parseJsonResponse<{
        success?: boolean;
        error?: string;
        synced?: SyncRecord[];
        conflicts?: unknown[];
      }>(response, `sync:${table}`);
      if (data.success !== true) {
        throw new Error(data.error || `Falha ao sincronizar ${table}`);
      }
      if (Array.isArray(data.synced)) {
        this.materializeTableData(table, data.synced as SyncRecord[]);
      }

      // Atualizar timestamp do último sync
      this.lastSync.set(table, new Date().toISOString());

      console.log(`✅ Sincronizados ${(data.synced || []).length} registros de ${table}`);

      return data;
    } catch (error) {
      console.error(`❌ Erro ao sincronizar ${table}:`, error);
      throw error;
    }
  }

  /**
   * Apenas buscar dados (sem enviar updates)
   */
  async fetch(table: string): Promise<SyncRecord[]> {
    try {
      const lastSync = this.lastSync.get(table);
      const url = new URL(`${this.config.serverUrl}/api/sync/${table}`);
      
      if (lastSync) {
        url.searchParams.set('lastSync', lastSync);
      }

      const response = await this.requestWithRetry(
        () => fetch(url.toString(), { headers: this.getJsonHeaders() }),
        `fetch:${table}`
      );

      const data = await this.parseJsonResponse<{
        success?: boolean;
        error?: string;
        data?: SyncRecord[];
        count?: number;
      }>(response, `fetch:${table}`);
      if (data.success !== true) {
        throw new Error(data.error || `Falha ao buscar ${table}`);
      }
      const incoming = Array.isArray(data.data) ? (data.data as SyncRecord[]) : [];
      const materialized = this.materializeTableData(table, incoming);
      this.lastSync.set(table, new Date().toISOString());

      console.log(`📥 Obtidos ${data.count ?? incoming.length} registros de ${table}`);

      return materialized;
    } catch (error) {
      console.error(`❌ Erro ao buscar ${table}:`, error);
      throw error;
    }
  }

  /**
   * Iniciar sincronização automática
   */
  private startAutoSync(): void {
    const tables = ['products', 'orders', 'supplies'];

    this.syncInterval = setInterval(async () => {
      for (const table of tables) {
        try {
          await this.fetch(table);
        } catch (error) {
          console.error(`Erro ao sync automático de ${table}:`, error);
        }
      }
    }, this.config.syncInterval);

    console.log(`🔄 Auto-sync iniciado (a cada ${this.config.syncInterval}ms)`);
  }

  /**
   * Parar sincronização automática
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log(`🛑 Auto-sync parado`);
    }

    if (this.reconcileTimer) {
      clearInterval(this.reconcileTimer);
      this.reconcileTimer = null;
      console.log(`🛑 Auto-reconcile parado`);
    }
  }

  /**
   * Executa reconciliação cliente x servidor uma vez
   */
  async reconcileNow(): Promise<ReconcileResponse> {
    if (!this.config.getClientSummary) {
      throw new Error('getClientSummary não configurado para reconciliação');
    }

    const clientSummary = await this.config.getClientSummary();
    const response = await this.requestWithRetry(
      () =>
        fetch(`${this.config.serverUrl}/api/sync/reconcile`, {
          method: 'POST',
          headers: this.getJsonHeaders(),
          body: JSON.stringify({
            machineId: this.config.machineId,
            clientSummary,
          }),
        }),
      'reconcile'
    );

    let result = await this.parseJsonResponse<ReconcileResponse & { error?: string }>(
      response,
      "reconcile"
    );
    if (
      result.success !== true ||
      typeof result.isConsistent !== "boolean" ||
      !Array.isArray(result.mismatches) ||
      !Array.isArray(result.serverSummary)
    ) {
      throw new Error(result.error || "Resposta invalida em reconcile");
    }
    const bootstrapApplied = await this.tryAutoBootstrap(result);

    if (bootstrapApplied) {
      // Re-run reconcile after bootstrap to confirm convergence.
      const recheckResponse = await this.requestWithRetry(
        () =>
          fetch(`${this.config.serverUrl}/api/sync/reconcile`, {
            method: 'POST',
            headers: this.getJsonHeaders(),
            body: JSON.stringify({
              machineId: this.config.machineId,
              clientSummary,
            }),
          }),
        'reconcile:post-bootstrap'
      );
      result = await this.parseJsonResponse<ReconcileResponse & { error?: string }>(
        recheckResponse,
        "reconcile:post-bootstrap"
      );
      if (
        result.success !== true ||
        typeof result.isConsistent !== "boolean" ||
        !Array.isArray(result.mismatches) ||
        !Array.isArray(result.serverSummary)
      ) {
        throw new Error(result.error || "Resposta invalida em reconcile:post-bootstrap");
      }
    }

    if (!result.isConsistent) {
      console.warn(
        `⚠️ Divergência detectada em ${result.mismatches.length} tabela(s):`,
        result.mismatches
      );
      await this.handleDivergence(result);
    } else {
      console.log('✅ Reconciliação consistente');
    }

    return result;
  }

  /**
   * Gerar ID único para esta máquina
   */
  private generateMachineId(): string {
    let id = localStorage?.getItem('machineId');
    
    if (!id) {
      id = 'machine-' + Math.random().toString(36).substr(2, 9);
      localStorage?.setItem('machineId', id);
    }

    return id;
  }

  /**
   * Executar request com retry e backoff exponencial
   */
  private async requestWithRetry(
    requestFn: () => Promise<Response>,
    operationName: string
  ): Promise<Response> {
    let lastError: unknown = null;
    setSyncStatusPatch({
      health: "syncing",
      currentOperation: operationName,
    });

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await requestFn();
        if (!response.ok) {
          const detail = await this.extractErrorDetail(response);
          const message = `Erro HTTP ${response.status} em ${operationName}${detail ? `: ${detail}` : ""}`;
          if (this.shouldRetryStatus(response.status, attempt)) {
            throw new Error(message);
          }
          throw new Error(message);
        }
        setSyncStatusPatch({
          health: "ok",
          currentOperation: null,
          lastSuccessAt: new Date().toISOString(),
          lastErrorMessage: null,
        });
        return response;
      } catch (error) {
        lastError = error;
        if (attempt >= this.config.retryAttempts) {
          break;
        }

        const delayMs = this.calculateBackoffDelay(attempt);
        console.warn(
          `Tentativa ${attempt + 1} falhou em ${operationName}. Retry em ${delayMs}ms.`
        );
        await this.sleep(delayMs);
      }
    }

    setSyncStatusPatch({
      health: "error",
      currentOperation: null,
      lastErrorAt: new Date().toISOString(),
      lastErrorMessage: lastError instanceof Error ? lastError.message : "Erro de sincronização",
    });

    throw lastError instanceof Error
      ? lastError
      : new Error(`Falha em ${operationName}`);
  }

  private shouldRetryStatus(status: number, attempt: number): boolean {
    if (attempt >= this.config.retryAttempts) {
      return false;
    }
    return status === 408 || status === 425 || status === 429 || status >= 500;
  }

  private calculateBackoffDelay(attempt: number): number {
    const expDelay = this.config.retryBaseDelay * Math.pow(2, attempt);
    return Math.min(expDelay, this.config.retryMaxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async parseJsonResponse<T>(response: Response, operationName: string): Promise<T> {
    const raw = await response.text();
    if (!raw) {
      return {} as T;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      const contentType = response.headers.get("content-type") || "desconhecido";
      const preview = raw.slice(0, 200).replace(/\s+/g, " ").trim();
      throw new Error(
        `Resposta invalida em ${operationName} (status ${response.status}, content-type ${contentType}): ${preview}`
      );
    }
  }

  private async extractErrorDetail(response: Response): Promise<string> {
    try {
      const contentType = response.headers.get("content-type") || "";
      const bodyText = await response.text();
      if (!bodyText) {
        return "";
      }

      if (contentType.includes("application/json")) {
        const parsed = JSON.parse(bodyText) as { error?: string; message?: string };
        return parsed.error || parsed.message || bodyText.slice(0, 200);
      }

      return bodyText.slice(0, 200).replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }

  private getJsonHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.syncApiKey) {
      headers['x-api-key'] = this.config.syncApiKey;
    }

    return headers;
  }

  private async tryAutoBootstrap(result: ReconcileResponse): Promise<boolean> {
    if (!this.config.autoBootstrap || !this.config.getTableData || result.isConsistent) {
      return false;
    }

    let didBootstrap = false;
    for (const mismatch of result.mismatches) {
      if (!mismatch?.table || !mismatch.client || !mismatch.server) {
        continue;
      }

      const isServerEmpty = mismatch.server.count === 0;
      const clientHasData = (mismatch.client.count || 0) > 0;
      const countRelated =
        mismatch.reason === "count_mismatch" ||
        mismatch.reason === "count_and_latest_updatedAt_mismatch";

      if (!isServerEmpty || !clientHasData || !countRelated) {
        continue;
      }

      try {
        const tableData = await this.config.getTableData(mismatch.table);
        if (!tableData || tableData.length === 0) {
          continue;
        }

        const localUpdates = tableData.map((record) => this.normalizeUpdate(record));
        const response = await this.requestWithRetry(
          () =>
            fetch(`${this.config.serverUrl}/api/sync/bootstrap/${mismatch.table}`, {
              method: "POST",
              headers: this.getJsonHeaders(),
              body: JSON.stringify({
                machineId: this.config.machineId,
                localUpdates,
              }),
            }),
          `bootstrap:${mismatch.table}`
        );
        const payload = await this.parseJsonResponse<{
          success?: boolean;
          error?: string;
          bootstrapped?: boolean;
          processed?: number;
        }>(response, `bootstrap:${mismatch.table}`);
        if (payload.success !== true) {
          throw new Error(payload.error || `Falha no bootstrap de ${mismatch.table}`);
        }
        if (payload?.bootstrapped) {
          didBootstrap = true;
          console.log(`🌱 Bootstrap concluído para ${mismatch.table}: ${payload.processed} registros.`);
        }
      } catch (error) {
        console.error(`Falha no bootstrap automático de ${mismatch.table}:`, error);
      }
    }

    return didBootstrap;
  }

  private async handleDivergence(result: ReconcileResponse): Promise<void> {
    setSyncStatusPatch({
      health: "warning",
      lastErrorAt: new Date().toISOString(),
      lastErrorMessage: `Divergência detectada em ${result.mismatches.length} tabela(s)`,
    });

    if (this.config.onDivergence) {
      await this.config.onDivergence(result);
    }

    if (this.config.divergenceStrategy === "none") {
      return;
    }

    if (this.config.divergenceStrategy === "full_resync") {
      this.resetLastSync();
      for (const table of ["products", "orders", "supplies", "order_items"]) {
        await this.safeFetch(table);
      }
      return;
    }

    const tableSet = new Set<string>();
    for (const mismatch of result.mismatches) {
      if (mismatch?.table) {
        tableSet.add(mismatch.table);
      }
    }

    for (const table of tableSet) {
      this.resetLastSync(table);
      await this.safeFetch(table);
    }
  }

  private async safeFetch(table: string): Promise<void> {
    try {
      await this.fetch(table);
    } catch (error) {
      console.error(`Falha ao reparar tabela ${table}:`, error);
    }
  }

  /**
   * Iniciar reconciliação automática
   */
  private startAutoReconcile(): void {
    if (!this.config.getClientSummary) {
      console.warn(
        'Auto-reconcile habilitado, mas getClientSummary não foi configurado.'
      );
      return;
    }

    this.reconcileTimer = setInterval(async () => {
      try {
        await this.reconcileNow();
      } catch (error) {
        console.error('Erro na reconciliação automática:', error);
      }
    }, this.config.reconcileInterval);

    console.log(
      `🔎 Auto-reconcile iniciado (a cada ${this.config.reconcileInterval}ms)`
    );
  }

  /**
   * Normalizar update com eventId para idempotência
   */
  private normalizeUpdate(update: SyncRecord | SyncUpdateEnvelope): SyncUpdateEnvelope {
    const envelope = update as Partial<SyncUpdateEnvelope>;
    if (envelope.record && typeof envelope.eventId === 'string') {
      return {
        eventId: envelope.eventId,
        record: envelope.record,
      };
    }

    const syncRecord = update as SyncRecord;
    const eventId = syncRecord.eventId || this.generateEventId();
    const record = { ...syncRecord };
    delete record.eventId;
    return { eventId, record };
  }

  /**
   * Gerar eventId único para deduplicação
   */
  private generateEventId(): string {
    const cryptoObj = (globalThis as any).crypto;
    if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
      return cryptoObj.randomUUID();
    }
    return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private buildConfig(config: Partial<SyncConfig>): SyncConfig {
    return {
      serverUrl: config.serverUrl || 'http://localhost:4000',
      machineId: config.machineId || this.generateMachineId(),
      syncApiKey: config.syncApiKey,
      autoBootstrap: config.autoBootstrap ?? true,
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 5000,
      retryAttempts: config.retryAttempts ?? 3,
      retryBaseDelay: config.retryBaseDelay ?? 500,
      retryMaxDelay: config.retryMaxDelay ?? 5000,
      autoReconcile: config.autoReconcile ?? false,
      reconcileInterval: config.reconcileInterval ?? 60000,
      getClientSummary: config.getClientSummary,
      getTableData: config.getTableData,
      divergenceStrategy: config.divergenceStrategy || "refresh_mismatched",
      onDivergence: config.onDivergence,
    };
  }

  /**
   * Resetar último sync (para forçar sincronização completa)
   */
  resetLastSync(table?: string): void {
    if (table) {
      this.lastSync.delete(table);
      this.tableCache.delete(table);
      console.log(`🔄 Reset sync para ${table}`);
    } else {
      this.lastSync.clear();
      this.tableCache.clear();
      console.log(`🔄 Reset sync para todas as tabelas`);
    }
  }

  /**
   * Obter status do sync
   */
  getStatus(): { table: string; lastSync: string | null }[] {
    return Array.from(this.lastSync.entries()).map(([table, lastSync]) => ({
      table,
      lastSync,
    }));
  }

  private materializeTableData(table: string, incoming: SyncRecord[]): SyncRecord[] {
    let tableState = this.tableCache.get(table);
    if (!tableState) {
      tableState = new Map<string, SyncRecord>();
      this.tableCache.set(table, tableState);
    }

    for (const record of incoming) {
      if (!record?.id) {
        continue;
      }

      if (record._deleted) {
        tableState.delete(record.id);
        continue;
      }

      const normalized = { ...record };
      delete normalized._deleted;
      delete normalized.eventId;
      tableState.set(record.id, normalized as SyncRecord);
    }

    return Array.from(tableState.values()).sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }
}

// Singleton global
let syncClient: SyncClient | null = null;

export function initSyncClient(config?: Partial<SyncConfig>): SyncClient {
  if (!syncClient) {
    syncClient = new SyncClient(config);
  } else if (config) {
    syncClient.updateConfig(config);
  }
  return syncClient;
}

export function getSyncClient(): SyncClient {
  if (!syncClient) {
    syncClient = new SyncClient();
  }
  return syncClient;
}
