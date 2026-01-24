
// /src/data/seed.ts
// ARQUIVO DE DADOS DE TESTE (SEED DATA)
//
// Propósito:
// Este arquivo contém um conjunto de dados iniciais e consistentes para popular
// a aplicação durante os testes, garantindo que todos os fluxos possam ser validados.
// Ele simula um estado realista do banco de dados com insumos, fichas técnicas e produtos.

import type { Supply, TechnicalSheet, Product } from '@/types';
import { Timestamp } from 'firebase/firestore';

// --- INSUMOS (MATÉRIA-PRIMA E EMBALAGENS) ---

export const seedSupplies: Supply[] = [
  // Ingredientes
  {
    id: 'supply-farinha',
    name: 'Farinha de Trigo',
    sku: 'IN-FAR-001',
    category: 'Secos',
    type: 'ingredient',
    stock: 5000,
    minStock: 1000,
    unit: 'g',
    costPerUnit: 0.005, // R$ 5,00/kg
    supplier: 'Fornecedor A',
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'supply-acucar',
    name: 'Açúcar Refinado',
    sku: 'IN-ACU-001',
    category: 'Secos',
    type: 'ingredient',
    stock: 8000,
    minStock: 1000,
    unit: 'g',
    costPerUnit: 0.004, // R$ 4,00/kg
    supplier: 'Fornecedor A',
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'supply-ovo',
    name: 'Ovo de Galinha (Unidade)',
    sku: 'IN-OVO-001',
    category: 'Frescos',
    type: 'ingredient',
    stock: 120,
    minStock: 30,
    unit: 'un',
    costPerUnit: 0.7, // R$ 0,70/un
    supplier: 'Fornecedor B',
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'supply-leite',
    name: 'Leite Integral',
    sku: 'IN-LEI-001',
    category: 'Laticínios',
    type: 'ingredient',
    stock: 10000,
    minStock: 2000,
    unit: 'ml',
    costPerUnit: 0.0045, // R$ 4,50/L
    supplier: 'Fornecedor C',
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'supply-chocolate',
    name: 'Chocolate em Pó 50%',
    sku: 'IN-CHO-001',
    category: 'Secos',
    type: 'ingredient',
    stock: 2000,
    minStock: 500,
    unit: 'g',
    costPerUnit: 0.035, // R$ 35,00/kg
    supplier: 'Fornecedor A',
    isActive: true,
    createdAt: Timestamp.now(),
  },
  // Embalagens
  {
    id: 'supply-pote',
    name: 'Pote de Plástico 250ml',
    sku: 'EM-POT-250',
    category: 'Embalagens',
    type: 'packaging',
    stock: 500,
    minStock: 100,
    unit: 'un',
    costPerUnit: 0.8,
    supplier: 'Fornecedor D',
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    id: 'supply-tampa',
    name: 'Tampa para Pote 250ml',
    sku: 'EM-TAM-250',
    category: 'Embalagens',
    type: 'packaging',
    stock: 500,
    minStock: 100,
    unit: 'un',
    costPerUnit: 0.3,
    supplier: 'Fornecedor D',
    isActive: true,
    createdAt: Timestamp.now(),
  },
];

// --- FICHAS TÉCNICAS (RECEITAS) ---

export const seedTechnicalSheets: TechnicalSheet[] = [
  // Ficha de Base (uma receita que compõe outras)
  {
    id: 'sheet-massa-chocolate',
    name: 'Massa de Chocolate (Base)',
    description: 'Receita base para bolos de chocolate, com rendimento de aproximadamente 1kg.',
    type: 'base',
    components: [
      { componentId: 'supply-farinha', componentName: 'Farinha de Trigo', componentType: 'supply', quantity: 300, unit: 'g', lossFactor: 2 },
      { componentId: 'supply-acucar', componentName: 'Açúcar Refinado', componentType: 'supply', quantity: 250, unit: 'g', lossFactor: 1 },
      { componentId: 'supply-ovo', componentName: 'Ovo de Galinha', componentType: 'supply', quantity: 4, unit: 'un', lossFactor: 5 },
      { componentId: 'supply-leite', componentName: 'Leite Integral', componentType: 'supply', quantity: 200, unit: 'ml', lossFactor: 1 },
      { componentId: 'supply-chocolate', componentName: 'Chocolate em Pó 50%', componentType: 'supply', quantity: 100, unit: 'g', lossFactor: 2 },
    ],
    steps: '1. Misture os secos.\n2. Adicione os líquidos e os ovos.\n3. Bata até obter uma massa homogênea.\n4. Asse em forno pré-aquecido a 180°C.',
    yield: '1000g',
    totalCost: 9.98, // Custo recalculado com base na lógica
    suggestedPrice: 0, // Não aplicável para Ficha de Base
    createdAt: Timestamp.now(),
    isActive: true,
  },
];


// --- PRODUTOS VENDÁVEIS ---

export const seedProducts: Product[] = [
  {
    id: 'prod-bolo-pote',
    name: 'Bolo de Pote de Chocolate',
    description: 'Delicioso bolo de pote com massa de chocolate fofinha e recheio cremoso.',
    category: 'Sobremesas',
    components: [
      { componentId: 'sheet-massa-chocolate', componentName: 'Massa de Chocolate (Base)', componentType: 'sheet', quantity: 150, unit: 'g', lossFactor: 0 },
      { componentId: 'supply-pote', componentName: 'Pote de Plástico 250ml', componentType: 'packaging', quantity: 1, unit: 'un', lossFactor: 0 },
      { componentId: 'supply-tampa', componentName: 'Tampa para Pote 250ml', componentType: 'packaging', quantity: 1, unit: 'un', lossFactor: 0 },
    ],
    preparationTime: 5,
    laborCost: 20,
    fixedCost: 0.5,
    price: 8.86,
    costPrice: 4.43,
    stock_quantity: 0, // Estoque de produto montado (se aplicável)
    imageUrlId: 'product-desserts-1',
    createdAt: Timestamp.now(),
    isActive: true,
  },
  {
    id: 'prod-cookie',
    name: 'Cookie com Gotas de Chocolate',
    description: 'Cookie crocante por fora e macio por dentro, com gotas de chocolate.',
    category: 'Cookies',
    price: 7.50,
    costPrice: 2.80, // Custo manual
    stock_quantity: 50, // Produto de venda direta, sem montagem
    imageUrlId: 'product-cookie-1',
    createdAt: Timestamp.now(),
    isActive: true,
  }
];

    