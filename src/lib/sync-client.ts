// src/lib/sync-client.ts
// 🔄 Cliente de Sincronização para Front-end (Next.js)

export type SyncConfig = {
  serverUrl: string;
  machineId: string;
  autoSync: boolean;
  syncInterval: number; // ms
};

export type SyncRecord = {
  id: string;
  [key: string]: any;
  updatedAt?: string;
};

export class SyncClient {
  private config: SyncConfig;
  private lastSync: Map<string, string> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:4000',
      machineId: config.machineId || this.generateMachineId(),
      autoSync: config.autoSync !== false,
      syncInterval: config.syncInterval || 5000, // 5 segundos por padrão
    };

    console.log(`🔄 SyncClient inicializado`);
    console.log(`   📍 Servidor: ${this.config.serverUrl}`);
    console.log(`   🖥️  Máquina ID: ${this.config.machineId}`);

    // Iniciar auto-sync
    if (this.config.autoSync) {
      this.startAutoSync();
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
      
      const response = await fetch(`${this.config.serverUrl}/api/sync/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table,
          lastSync,
          machineId: this.config.machineId,
          localUpdates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();

      // Atualizar timestamp do último sync
      this.lastSync.set(table, new Date().toISOString());

      console.log(`✅ Sincronizados ${data.synced.length} registros de ${table}`);

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

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      this.lastSync.set(table, new Date().toISOString());

      console.log(`📥 Obtidos ${data.count} registros de ${table}`);

      return data.data;
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
   * Resetar último sync (para forçar sincronização completa)
   */
  resetLastSync(table?: string): void {
    if (table) {
      this.lastSync.delete(table);
      console.log(`🔄 Reset sync para ${table}`);
    } else {
      this.lastSync.clear();
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
}

// Singleton global
let syncClient: SyncClient | null = null;

export function initSyncClient(config?: Partial<SyncConfig>): SyncClient {
  if (!syncClient) {
    syncClient = new SyncClient(config);
  }
  return syncClient;
}

export function getSyncClient(): SyncClient {
  if (!syncClient) {
    syncClient = new SyncClient();
  }
  return syncClient;
}
