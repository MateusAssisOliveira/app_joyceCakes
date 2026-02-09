// server/src/api/orders.ts
// 📦 API de Pedidos

import express, { Request, Response, Router } from 'express';
import { queryAll, queryOne, query } from '../db/postgres';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

// GET /api/orders - Listar todos
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await queryAll('SELECT * FROM orders ORDER BY updatedAt DESC');
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

// GET /api/orders/:id - Obter um com itens
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await queryOne('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }

    const items = await queryAll('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    
    res.json({ success: true, data: { ...order, items } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

// POST /api/orders - Criar
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerName, total, status = 'Pendente', items = [] } = req.body;
    const id = uuidv4();

    await query(
      `INSERT INTO orders (id, customerName, total, status, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [id, customerName, total, status]
    );

    // Inserir itens
    for (const item of items) {
      const itemId = uuidv4();
      await query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [itemId, id, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json({ success: true, data: { id, customerName, total, status, items } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

export { router as ordersRouter };
