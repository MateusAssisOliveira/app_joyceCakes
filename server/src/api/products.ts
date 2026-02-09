// server/src/api/products.ts
// 📦 API de Produtos

import express, { Request, Response, Router } from 'express';
import { queryAll, queryOne, query } from '../db/postgres';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

// GET /api/products - Listar todos
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await queryAll('SELECT * FROM products ORDER BY updatedAt DESC');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

// GET /api/products/:id - Obter um
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await queryOne('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

// POST /api/products - Criar
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, stock_quantity = 0 } = req.body;
    const id = uuidv4();

    await query(
      `INSERT INTO products (id, name, description, price, category, stock_quantity, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, name, description, price, category, stock_quantity]
    );

    res.status(201).json({ success: true, data: { id, name, description, price, category, stock_quantity } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

export { router as productsRouter };
