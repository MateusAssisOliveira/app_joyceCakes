// server/src/index.ts
// 🖥️ Servidor Central de Sincronização para JoyceCakes

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/postgres';
import { syncRouter } from './api/sync';
import { productsRouter } from './api/products';
import { ordersRouter } from './api/orders';
import { suppliesRouter } from './api/supplies';

// Carregar variáveis de ambiente
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;
const apiSecretKey = (process.env.API_SECRET_KEY || '').trim();
const enforceApiKey = apiSecretKey.length > 0 && apiSecretKey !== 'sua_chave_secreta_aqui';
const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin: string | string[] =
  configuredCorsOrigins.length > 0 ? configuredCorsOrigins : '*';

// ✅ Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📝 Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 🚀 Rotas

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Autenticação opcional para rotas de sync (ativa quando API_SECRET_KEY foi configurada)
app.use('/api/sync', (req: Request, res: Response, next: NextFunction) => {
  if (!enforceApiKey) {
    return next();
  }

  const apiKey = req.header('x-api-key');
  if (!apiKey || apiKey !== apiSecretKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  return next();
});

// API de Sincronização (principal)
app.use('/api/sync', syncRouter);

// APIs por tabela
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/supplies', suppliesRouter);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// 🚀 Iniciar servidor
async function start() {
  try {
    // Inicializar BD
    console.log('📦 Inicializando banco de dados...');
    await initializeDatabase();
    console.log('✅ BD PostgreSQL pronto!');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
      if (configuredCorsOrigins.length > 0) {
        console.log(`🔐 CORS restrito para: ${configuredCorsOrigins.join(', ')}`);
      } else {
        console.log(`⚠️ CORS aberto (*). Configure CORS_ORIGINS para produção.`);
      }
      if (enforceApiKey) {
        console.log(`🔐 API key habilitada para /api/sync/*`);
      } else {
        console.log(`⚠️ API key desabilitada para /api/sync/*`);
      }
      console.log(`📍 Endpoints:`);
      console.log(`   GET    /health`);
      console.log(`   POST   /api/sync/products`);
      console.log(`   POST   /api/sync/orders`);
      console.log(`   POST   /api/sync/supplies`);
      console.log(`   POST   /api/sync/reconcile`);
      console.log(`   GET    /api/sync/reconcile`);
      console.log(`   GET    /api/sync/reconcile/history`);
      console.log(`   GET    /api/products`);
      console.log(`   POST   /api/products`);
      console.log(`\n✅ Pronto para sincronizar!\n`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
