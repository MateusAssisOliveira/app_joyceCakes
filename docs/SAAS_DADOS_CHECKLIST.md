# Checklist de dados SaaS (SQL + Firestore)

## 1) Subir servidor de sync com schema atualizado

```bash
cd server
npm run build
npm start
```

Ao iniciar, o `initializeDatabase()` aplica os `ALTER TABLE` automaticamente.

## 2) Validar CORS para frontend local

No `.env` do servidor, configure:

```env
CORS_ORIGINS=http://localhost:3000
```

Reinicie o servidor.

## 3) Rodar diagnostico por tenant

```bash
curl "http://localhost:4000/api/sync/diagnostics?tenantId=SEU_TENANT_ID" -H "x-api-key: SUA_CHAVE_OPCIONAL"
```

O retorno mostra:
- `total`: total de registros por tabela
- `latestUpdatedAt`: ultima atualizacao
- `missingByField`: campos obrigatorios com lacunas

## 4) Reconciliar cliente x servidor

```bash
curl "http://localhost:4000/api/sync/reconcile?tenantId=SEU_TENANT_ID" -H "x-api-key: SUA_CHAVE_OPCIONAL"
```

Se houver divergencia, forcar sync no app e verificar logs do navegador.

## 5) O que ja foi alinhado no schema

- `supplies`: `sku`, `category`, `type`, `purchaseFormat`, `packageCost`, `packageQuantity`, `supplier`, `lastPurchaseDate`, `expirationDate`, `minStock`, `isActive`
- `technical_sheets`: `preparationTime`, `laborCost`, `fixedCost`
- `products`: `isActive`
- indices por `tenantId` e `updatedAt`

## 6) Regra de operacao

- Sempre que incluir um novo campo no SaaS, incluir o mesmo campo no SQL (`server/src/db/postgres.ts`) e no payload de sync (`src/lib/firestore-client-summary.ts`).
- Sempre validar no endpoint `/api/sync/diagnostics` antes de liberar.
