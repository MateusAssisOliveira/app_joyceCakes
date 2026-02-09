# ⚡ QUICKSTART - 5 Minutos

Leia este arquivo para entender as melhorias em 5 minutos.

---

## 🎯 O Essencial

### 1. **Logger**
```typescript
import { createLogger } from '@/lib/logger';
const logger = createLogger('MyModule');

logger.info('Algo aconteceu');
logger.error('Erro!', erro);
```

### 2. **Validação**
```typescript
import { validateData, CreateOrderSchema } from '@/lib/validators';

const dados_validos = validateData(CreateOrderSchema, dados);
// Se inválido → erro com mensagem clara
// Se válido → type-safe guarantee
```

### 3. **Datas**
```typescript
import { formatDate } from '@/lib/timestamp-utils';

formatDate(timestamp);  // "6 de fevereiro de 2026"
```

### 4. **Erros**
```typescript
import { handleError } from '@/lib/error-handler';

try { ... }
catch(e) {
  const { message } = handleError(e, 'context');
  toast({ description: message });
}
```

### 5. **Paginação**
```typescript
import { executePaginatedQuery } from '@/lib/pagination';

const { items, hasMore } = await executePaginatedQuery(query, 20);
```

---

## 📁 Arquivos Criados

```
src/lib/logger.ts              ← Use para logs
src/lib/validators.ts          ← Use para validação
src/lib/timestamp-utils.ts     ← Use para datas
src/lib/error-handler.ts       ← Use para erros
src/lib/pagination.ts          ← Use para queries grandes
```

---

## 📖 Leitura Recomendada

| Arquivo | Tempo | Conteúdo |
|---------|-------|----------|
| Este (QUICKSTART) | 5 min | Overview |
| README_MELHORIAS | 15 min | Exemplos práticos |
| MELHORIAS.md | 30 min | Tudo em detalhe |
| ERROS_TIPO.md | 20 min | O que corrigir |

---

## ✅ Dev Checklist

- [ ] `npm run build` passa
- [ ] `npm run dev` inicia sem erros
- [ ] Leu este arquivo
- [ ] Leu README_MELHORIAS.md
- [ ] Entendeu logger, validação, erro

---

**Pronto? Comece a usar!** 🚀
