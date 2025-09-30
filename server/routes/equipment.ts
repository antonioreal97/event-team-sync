import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar equipamentos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT 
      e.*,
      ec.name as category_name,
      ec.description as category_description
    FROM equipments e
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    ORDER BY COALESCE(ec.name, e.category), e.name
  `);

  res.json({
    equipments: result.rows
  });
}));

// Buscar equipamento por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT 
      e.*,
      ec.name as category_name,
      ec.description as category_description
    FROM equipments e
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    WHERE e.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw createError('Equipamento não encontrado', 404);
  }

  res.json({
    equipment: result.rows[0]
  });
}));

// Criar equipamento (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    totalQuantity,
    description,
    categoryId,
    category, // Manter compatibilidade com campo legado
    hourlyRate,
    dailyRate,
    condition,
    location,
    lastMaintenance
  } = req.body;

  if (!name || !totalQuantity) {
    throw createError('Nome e quantidade total são obrigatórios', 400);
  }

  // Se categoryId não fornecido, tentar buscar por category (legado)
  let finalCategoryId = categoryId;
  if (!finalCategoryId && category) {
    const categoryResult = await pool.query(
      'SELECT id FROM equipment_categories WHERE name = $1',
      [category]
    );
    if (categoryResult.rows.length > 0) {
      finalCategoryId = categoryResult.rows[0].id;
    }
  }

  const result = await pool.query(`
    INSERT INTO equipments (
      name, total_quantity, description, category_id, category, hourly_rate, 
      daily_rate, condition, location, last_maintenance
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    name, totalQuantity, description, finalCategoryId, category, hourlyRate,
    dailyRate, condition, location, lastMaintenance
  ]);

  res.status(201).json({
    message: 'Equipamento criado com sucesso',
    equipment: result.rows[0]
  });
}));

// Atualizar equipamento (apenas gestores)
router.put('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const existingEquipment = await pool.query(
    'SELECT id FROM equipments WHERE id = $1',
    [id]
  );

  if (existingEquipment.rows.length === 0) {
    throw createError('Equipamento não encontrado', 404);
  }

  const fields = Object.keys(updateData).filter(key => 
    key !== 'id' && key !== 'created_at'
  );

  if (fields.length === 0) {
    throw createError('Nenhum campo válido para atualização', 400);
  }

  const setClause = fields.map((field, index) => 
    `${field} = $${index + 2}`
  ).join(', ');

  const query = `
    UPDATE equipments 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING *
  `;

  const values = [id, ...fields.map(field => updateData[field])];
  const result = await pool.query(query, values);

  res.json({
    message: 'Equipamento atualizado com sucesso',
    equipment: result.rows[0]
  });
}));

// Deletar equipamento (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingEquipment = await pool.query(
    'SELECT id FROM equipments WHERE id = $1',
    [id]
  );

  if (existingEquipment.rows.length === 0) {
    throw createError('Equipamento não encontrado', 404);
  }

  await pool.query('DELETE FROM equipments WHERE id = $1', [id]);

  res.json({
    message: 'Equipamento deletado com sucesso'
  });
}));

export { router as equipmentRoutes };






