# Importar receitas antigas para o tenant (technical_sheets)

## Script

Arquivo: `scripts/import-recipes-to-tenant.js`

## Formato de entrada

Pode ser `.json` ou `.csv`.

### JSON (recomendado)

```json
[
  {
    "id": "bolo-brigadeiro",
    "name": "Bolo de Brigadeiro",
    "description": "Massa de chocolate com recheio",
    "type": "base",
    "components": [
      { "componentId": "abc", "componentName": "Leite", "componentType": "supply", "quantity": 1, "unit": "L" }
    ],
    "steps": "Misturar e assar",
    "yield": "1 bolo",
    "totalCost": 32.5,
    "suggestedPrice": 75,
    "preparationTime": 90,
    "laborCost": 8,
    "fixedCost": 4,
    "isActive": true
  }
]
```

### CSV (colunas)

`id,name,description,type,components,steps,yield,totalCost,suggestedPrice,preparationTime,laborCost,fixedCost,isActive`

- `components` no CSV deve ser JSON string.

## Comando

```bash
node scripts/import-recipes-to-tenant.js "CAMINHO_DO_ARQUIVO" "TENANT_ID" "EMAIL" "SENHA"
```

Exemplo:

```bash
node scripts/import-recipes-to-tenant.js "backups/receitas.json" "ewM6EBD7uAZAJ3rGcH05spi7H3t2" "adm_doceCaixa@gmail.com" "admin123"
```

## Validar depois da importacao

```bash
curl "http://localhost:4000/api/sync/diagnostics?tenantId=ewM6EBD7uAZAJ3rGcH05spi7H3t2" -H "x-api-key: SUA_CHAVE"
```

Verifique `diagnostics.technical_sheets.total`.

## Espelhar Firestore para SQL (sync server)

Se as receitas ja estao no Firestore e voce quer refletir no SQL:

```bash
node scripts/push-firestore-recipes-to-sync-sql.js "TENANT_ID" "EMAIL" "SENHA"
```

Exemplo:

```bash
node scripts/push-firestore-recipes-to-sync-sql.js "ewM6EBD7uAZAJ3rGcH05spi7H3t2" "adm_doceCaixa@gmail.com" "admin123"
```
