// server/src/api/supplies.ts
// 📦 API de Insumos

import express, { Request, Response, Router } from 'express';
import { queryAll, queryOne, query } from '../db/postgres';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

// GET /api/supplies - Listar todos
router.get('/', async (req: Request, res: Response) => {
  try {
    const supplies = await queryAll('SELECT * FROM supplies ORDER BY updatedAt DESC');
    res.json({ success: true, data: supplies });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

// GET /api/supplies/:id - Obter um
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supply = await queryOne('SELECT * FROM supplies WHERE id = $1', [req.params.id]);
    if (!supply) {
      return res.status(404).json({ success: false, error: 'Insumo não encontrado' });
    }
    res.json({ success: true, data: supply });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

// POST /api/supplies - Criar
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, stock = 0, unit, costPerUnit } = req.body;
    const id = uuidv4();

    await query(
      `INSERT INTO supplies (id, name, stock, unit, costPerUnit, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, name, stock, unit, costPerUnit]
    );

    res.status(201).json({ success: true, data: { id, name, stock, unit, costPerUnit } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Erro' });
  }
});

export { router as suppliesRouter };
