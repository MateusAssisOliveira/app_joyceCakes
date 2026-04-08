# Manual Unico: Transporte de Dados (JoyceCakes)

Este documento centraliza o processo completo de transporte e sincronizacao de dados do sistema.

## 1. Objetivo

Garantir que dados de `products`, `orders`, `supplies` e `order_items` trafeguem com seguranca entre maquinas e servidor central, com:

- sincronizacao incremental por `updatedAt`
- deduplicacao por `eventId`
- tratamento de divergencia (reconcile)
- suporte a delecao com tombstone (`_deleted`)
- operacao resiliente com retry/backoff

## 2. Arquitetura de transporte

- Cliente (Next.js): `src/lib/sync-client.ts`
- Servidor de sync (Express): `server/src/index.ts`
- Endpoint principal: `server/src/api/sync.ts`
- Banco central: PostgreSQL

Fluxo resumido:

1. Cliente envia atualizacoes locais para `POST /api/sync/:table`.
2. Servidor aplica `upsert` (ou delete), registra log e deduplica `eventId`.
3. Servidor devolve somente mudancas desde `lastSync`.
4. Cliente materializa cache local por tabela e atualiza `lastSync`.
5. (Opcional) Cliente roda `reconcile` periodico para detectar divergencia.

## 3. Tabelas sincronizadas

Permitidas no servidor:

- `products`
- `orders`
- `supplies`
- `order_items`

## 4. Endpoints oficiais

- `GET /health`
- `POST /api/sync/:table`
- `GET /api/sync/:table?lastSync=...`
- `POST /api/sync/bootstrap/:table`
- `POST /api/sync/reconcile`
- `GET /api/sync/reconcile`
- `GET /api/sync/reconcile/history`

## 5. Configuracao minima

## 5.1 Servidor de sync

1. Instalar dependencias:

```bash
npm --prefix server install
```

2. Configurar variaveis de ambiente no `server/.env`:

- `PORT` (padrao: `4000`)
- `DATABASE_URL` (PostgreSQL)
- `API_SECRET_KEY` (opcional, recomendado em producao)
- `CORS_ORIGINS` (opcional, recomendado em producao)

3. Subir servidor:

```bash
npm --prefix server run dev
```

4. Validar:

```bash
curl http://localhost:4000/health
```

## 5.2 Cliente (app)

1. Instalar dependencias:

```bash
npm install
```

2. Configurar URL do sync server no ambiente do app (ex.: `.env.local`):

```env
NEXT_PUBLIC_SYNC_SERVER=http://localhost:4000
```

3. Rodar app:

```bash
npm run dev
```

## 6. Protocolo de transporte

## 6.1 Envio de atualizacoes (push + pull)

Requisicao:

`POST /api/sync/products`

Corpo (resumo):

- `lastSync`: ultimo timestamp conhecido pelo cliente
- `machineId`: identificador da maquina
- `localUpdates`: lista de registros locais

Cada update pode carregar `eventId` para idempotencia.

## 6.2 Coleta incremental (pull)

Requisicao:

`GET /api/sync/products?lastSync=2026-02-18T12:00:00.000Z`

Retorno:

- registros alterados apos `lastSync`
- tombstones de delecao com `_deleted: true`

## 6.3 Reconcile (consistencia)

`POST /api/sync/reconcile` compara resumo cliente x servidor e retorna:

- `isConsistent`
- `mismatches`
- `serverSummary`

Se houver divergencia, o cliente pode executar estrategia:

- `none`
- `refresh_mismatched` (padrao)
- `full_resync`

## 6.4 Bootstrap inicial

`POST /api/sync/bootstrap/:table` envia carga inicial quando servidor esta vazio.

Regras principais:

- lock por tabela (`bootstrap_state`)
- evita corrida entre maquinas
- roda apenas quando a tabela no servidor esta vazia

## 7. Mecanismos de confiabilidade

- Retry com backoff exponencial no cliente
- Tentativas padrao: `retryAttempts = 3`
- Delay base padrao: `500ms`
- Delay maximo padrao: `5000ms`
- Status HTTP com retry: `408`, `425`, `429`, `5xx`

## 8. Resolucao de conflitos

- Regra principal: servidor ignora update stale (`SKIP_STALE`) quando o `updatedAt` do servidor e mais novo.
- Delecao usa tombstone em `deleted_records` para propagar remocao.
- Eventos repetidos sao ignorados por `sync_events.event_id`.

## 9. Seguranca minima recomendada

1. Definir `API_SECRET_KEY` no servidor.
2. Enviar `x-api-key` no cliente (`syncApiKey`).
3. Restringir `CORS_ORIGINS` para dominios/hosts validos.
4. Nao expor server sem firewall/VPN em rede publica.

## 10. Rotina operacional (passo a passo)

1. Inicie PostgreSQL.
2. Inicie sync server (`npm --prefix server run dev`).
3. Valide `GET /health`.
4. Inicie frontend (`npm run dev` ou `npm run dev:all`).
5. Execute operacao de teste (ex.: criar produto).
6. Verifique sincronizacao em outra maquina/aba.
7. Rode reconcile para validar consistencia.
8. Consulte historico em `/api/sync/reconcile/history`.

## 11. Testes essenciais de transporte

1. Sincronizacao basica: cria em maquina A, aparece em B.
2. Idempotencia: reenvio com mesmo `eventId` nao duplica.
3. Delete propagation: remove em A, some em B.
4. Divergencia: forcar mismatch e validar auto-reparo.
5. Queda de rede: validar retry/backoff.

Referencia adicional: `docs/TESTING_SYNC.md`.

## 12. Backup e restauracao

Usar scripts do projeto:

- Backup: `npm run db:backup`
- Restore: `npm run db:restore`

Importante: sempre validar reconcile apos restauracao.

## 13. Troubleshooting rapido

- `401 Unauthorized` em `/api/sync/*`:
  - confira `API_SECRET_KEY` e header `x-api-key`.
- `ECONNREFUSED`:
  - servidor nao esta ativo ou porta incorreta.
- Sem sincronizacao entre maquinas:
  - validar `NEXT_PUBLIC_SYNC_SERVER`, firewall, CORS e rede.
- Divergencia recorrente:
  - usar estrategia `refresh_mismatched` ou `full_resync` temporariamente.

## 14. Arquivos de referencia

- `src/lib/sync-client.ts`
- `server/src/index.ts`
- `server/src/api/sync.ts`
- `docs/deployment/setup-sync-server.md`
- `docs/deployment/multi-machine.md`
- `docs/ARQUITETURA_SQL_SYNC.md`
- `docs/QUICK_START_SQL_SYNC.md`
- `docs/TESTING_SYNC.md`

---

Ultima revisao: 18/02/2026
