// ARQUIVO BARREL PARA SERVIÇOS
//
// Propósito:
// Este arquivo (conhecido como "barrel file") reexporta todas as funções dos outros
// arquivos de serviço em um único local.
//
// Responsabilidade:
// - Simplificar as importações em outras partes do código. Em vez de importar de
//   `@/services/productService`, `@/services/orderService`, etc., os componentes
//   podem importar tudo diretamente de `@/services`.

export * from './productService';
export * from './orderService';
export * from './supplyService';
export * from './recipeService';
export * from './financialMovementService';
export * from './userService';
