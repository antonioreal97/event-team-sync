import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar itens de equipamento
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, status, equipmentId } = req.query;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (categoryId) {
    paramCount++;
    whereClause += ` AND e.category_id = $${paramCount}`;
    params.push(categoryId);
  }

  if (status) {
    paramCount++;
    whereClause += ` AND ei.status = $${paramCount}`;
    params.push(status);
  }

  if (equipmentId) {
    paramCount++;
    whereClause += ` AND ei.equipment_id = $${paramCount}`;
    params.push(equipmentId);
  }

  const result = await pool.query(`
    SELECT 
      ei.*,
      e.name as equipment_name,
      e.description as equipment_description,
      ec.name as category_name
    FROM equipment_items ei
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    ${whereClause}
    ORDER BY ec.name, e.name, ei.asset_tag
  `, params);

  res.json({
    items: result.rows
  });
}));

// Buscar item por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT 
      ei.*,
      e.name as equipment_name,
      e.description as equipment_description,
      ec.name as category_name
    FROM equipment_items ei
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    WHERE ei.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw createError('Item não encontrado', 404);
  }

  res.json({
    item: result.rows[0]
  });
}));

// Buscar item por asset_tag
router.get('/by-tag/:assetTag', asyncHandler(async (req: Request, res: Response) => {
  const { assetTag } = req.params;

  const result = await pool.query(`
    SELECT 
      ei.*,
      e.name as equipment_name,
      e.description as equipment_description,
      ec.name as category_name
    FROM equipment_items ei
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    WHERE ei.asset_tag = $1
  `, [assetTag]);

  if (result.rows.length === 0) {
    throw createError('Item não encontrado', 404);
  }

  res.json({
    item: result.rows[0]
  });
}));

// Verificar disponibilidade de itens
router.get('/available', asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, categoryId } = req.query;

  if (!startDate || !endDate) {
    throw createError('startDate e endDate são obrigatórios', 400);
  }

  let whereClause = 'WHERE ei.status = \'in_service\'';
  const params: any[] = [startDate, endDate];
  let paramCount = 2;

  if (categoryId) {
    paramCount++;
    whereClause += ` AND e.category_id = $${paramCount}`;
    params.push(categoryId);
  }

  const result = await pool.query(`
    SELECT 
      ei.*,
      e.name as equipment_name,
      e.description as equipment_description,
      ec.name as category_name,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM equipment_item_reservations eir
          JOIN events ev ON eir.event_id = ev.id
          WHERE eir.equipment_item_id = ei.id
            AND eir.status IN ('reserved', 'checked_out')
            AND NOT (ev.end_date <= $1 OR ev.start_date >= $2)
        ) THEN false
        ELSE true
      END as is_available
    FROM equipment_items ei
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    ${whereClause}
    ORDER BY ec.name, e.name, ei.asset_tag
  `, params);

  res.json({
    items: result.rows
  });
}));

// Criar item (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    equipmentId,
    assetTag,
    serialNumber,
    condition,
    status,
    location,
    notes
  } = req.body;

  if (!equipmentId || !assetTag) {
    throw createError('equipmentId e assetTag são obrigatórios', 400);
  }

  // Verificar se equipamento existe
  const equipment = await pool.query(
    'SELECT id FROM equipments WHERE id = $1',
    [equipmentId]
  );

  if (equipment.rows.length === 0) {
    throw createError('Equipamento não encontrado', 404);
  }

  // Verificar se asset_tag já existe
  const existingItem = await pool.query(
    'SELECT id FROM equipment_items WHERE asset_tag = $1',
    [assetTag]
  );

  if (existingItem.rows.length > 0) {
    throw createError('Já existe um item com esta etiqueta de patrimônio', 409);
  }

  const result = await pool.query(`
    INSERT INTO equipment_items (
      equipment_id, asset_tag, serial_number, condition, status, location, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [equipmentId, assetTag, serialNumber, condition, status, location, notes]);

  res.status(201).json({
    message: 'Item criado com sucesso',
    item: result.rows[0]
  });
}));

// Atualizar item (apenas gestores)
router.put('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Verificar se item existe
  const existingItem = await pool.query(
    'SELECT id FROM equipment_items WHERE id = $1',
    [id]
  );

  if (existingItem.rows.length === 0) {
    throw createError('Item não encontrado', 404);
  }

  // Se está alterando asset_tag, verificar se não existe outro com a mesma tag
  if (updateData.assetTag) {
    const duplicateTag = await pool.query(
      'SELECT id FROM equipment_items WHERE asset_tag = $1 AND id != $2',
      [updateData.assetTag, id]
    );

    if (duplicateTag.rows.length > 0) {
      throw createError('Já existe um item com esta etiqueta de patrimônio', 409);
    }
  }

  const fields = Object.keys(updateData).filter(key => 
    key !== 'id' && key !== 'created_at' && key !== 'updated_at'
  );

  if (fields.length === 0) {
    throw createError('Nenhum campo válido para atualização', 400);
  }

  const setClause = fields.map((field, index) => 
    `${field} = $${index + 2}`
  ).join(', ');

  const query = `
    UPDATE equipment_items 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING *
  `;

  const values = [id, ...fields.map(field => updateData[field])];
  const result = await pool.query(query, values);

  res.json({
    message: 'Item atualizado com sucesso',
    item: result.rows[0]
  });
}));

// Deletar item (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar se item existe
  const existingItem = await pool.query(
    'SELECT id FROM equipment_items WHERE id = $1',
    [id]
  );

  if (existingItem.rows.length === 0) {
    throw createError('Item não encontrado', 404);
  }

  // Verificar se há reservas ativas para este item
  const activeReservations = await pool.query(
    'SELECT COUNT(*) as count FROM equipment_item_reservations WHERE equipment_item_id = $1 AND status IN (\'reserved\', \'checked_out\')',
    [id]
  );

  if (parseInt(activeReservations.rows[0].count) > 0) {
    throw createError('Não é possível deletar item que possui reservas ativas', 409);
  }

  await pool.query('DELETE FROM equipment_items WHERE id = $1', [id]);

  res.json({
    message: 'Item deletado com sucesso'
  });
}));

export { router as equipmentItemsRoutes };

