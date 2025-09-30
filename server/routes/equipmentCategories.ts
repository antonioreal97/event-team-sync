import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar categorias de equipamentos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT * FROM equipment_categories 
    ORDER BY name
  `);

  res.json({
    categories: result.rows
  });
}));

// Buscar categoria por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM equipment_categories WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('Categoria não encontrada', 404);
  }

  res.json({
    category: result.rows[0]
  });
}));

// Criar categoria (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    throw createError('Nome da categoria é obrigatório', 400);
  }

  // Verificar se já existe categoria com o mesmo nome
  const existingCategory = await pool.query(
    'SELECT id FROM equipment_categories WHERE name = $1',
    [name]
  );

  if (existingCategory.rows.length > 0) {
    throw createError('Já existe uma categoria com este nome', 409);
  }

  const result = await pool.query(`
    INSERT INTO equipment_categories (name, description)
    VALUES ($1, $2)
    RETURNING *
  `, [name, description]);

  res.status(201).json({
    message: 'Categoria criada com sucesso',
    category: result.rows[0]
  });
}));

// Atualizar categoria (apenas gestores)
router.put('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    throw createError('Nome da categoria é obrigatório', 400);
  }

  // Verificar se categoria existe
  const existingCategory = await pool.query(
    'SELECT id FROM equipment_categories WHERE id = $1',
    [id]
  );

  if (existingCategory.rows.length === 0) {
    throw createError('Categoria não encontrada', 404);
  }

  // Verificar se já existe outra categoria com o mesmo nome
  const duplicateCategory = await pool.query(
    'SELECT id FROM equipment_categories WHERE name = $1 AND id != $2',
    [name, id]
  );

  if (duplicateCategory.rows.length > 0) {
    throw createError('Já existe uma categoria com este nome', 409);
  }

  const result = await pool.query(`
    UPDATE equipment_categories 
    SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `, [name, description, id]);

  res.json({
    message: 'Categoria atualizada com sucesso',
    category: result.rows[0]
  });
}));

// Deletar categoria (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar se categoria existe
  const existingCategory = await pool.query(
    'SELECT id FROM equipment_categories WHERE id = $1',
    [id]
  );

  if (existingCategory.rows.length === 0) {
    throw createError('Categoria não encontrada', 404);
  }

  // Verificar se há equipamentos usando esta categoria
  const equipmentsUsingCategory = await pool.query(
    'SELECT COUNT(*) as count FROM equipments WHERE category_id = $1',
    [id]
  );

  if (parseInt(equipmentsUsingCategory.rows[0].count) > 0) {
    throw createError('Não é possível deletar categoria que está sendo usada por equipamentos', 409);
  }

  await pool.query('DELETE FROM equipment_categories WHERE id = $1', [id]);

  res.json({
    message: 'Categoria deletada com sucesso'
  });
}));

export { router as equipmentCategoriesRoutes };

