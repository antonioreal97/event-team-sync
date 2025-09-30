import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar ordens de manutenção
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, equipmentItemId } = req.query;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    whereClause += ` AND mo.status = $${paramCount}`;
    params.push(status);
  }

  if (equipmentItemId) {
    paramCount++;
    whereClause += ` AND mo.equipment_item_id = $${paramCount}`;
    params.push(equipmentItemId);
  }

  const result = await pool.query(`
    SELECT 
      mo.*,
      ei.asset_tag,
      ei.serial_number,
      e.name as equipment_name,
      ec.name as category_name,
      u.name as opened_by_name,
      ev.title as event_title
    FROM maintenance_orders mo
    JOIN equipment_items ei ON mo.equipment_item_id = ei.id
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    LEFT JOIN users u ON mo.opened_by = u.id
    LEFT JOIN events ev ON mo.event_id = ev.id
    ${whereClause}
    ORDER BY mo.created_at DESC
  `, params);

  res.json({
    orders: result.rows
  });
}));

// Buscar ordem por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT 
      mo.*,
      ei.asset_tag,
      ei.serial_number,
      ei.condition as item_condition,
      ei.status as item_status,
      e.name as equipment_name,
      e.description as equipment_description,
      ec.name as category_name,
      u.name as opened_by_name,
      ev.title as event_title,
      ev.start_date as event_start_date,
      ev.end_date as event_end_date
    FROM maintenance_orders mo
    JOIN equipment_items ei ON mo.equipment_item_id = ei.id
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    LEFT JOIN users u ON mo.opened_by = u.id
    LEFT JOIN events ev ON mo.event_id = ev.id
    WHERE mo.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw createError('Ordem de manutenção não encontrada', 404);
  }

  res.json({
    order: result.rows[0]
  });
}));

// Criar ordem de manutenção manual (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    equipmentItemId,
    eventId,
    requestedAction,
    notes
  } = req.body;

  if (!equipmentItemId || !requestedAction) {
    throw createError('equipmentItemId e requestedAction são obrigatórios', 400);
  }

  if (!['maintenance', 'replace'].includes(requestedAction)) {
    throw createError('requestedAction deve ser "maintenance" ou "replace"', 400);
  }

  // Verificar se item existe
  const item = await pool.query(
    'SELECT id, status FROM equipment_items WHERE id = $1',
    [equipmentItemId]
  );

  if (item.rows.length === 0) {
    throw createError('Item não encontrado', 404);
  }

  // Verificar se evento existe (se fornecido)
  if (eventId) {
    const event = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );

    if (event.rows.length === 0) {
      throw createError('Evento não encontrado', 404);
    }
  }

  // Verificar se já existe ordem aberta para este item
  const existingOrder = await pool.query(
    'SELECT id FROM maintenance_orders WHERE equipment_item_id = $1 AND status IN (\'open\', \'in_progress\')',
    [equipmentItemId]
  );

  if (existingOrder.rows.length > 0) {
    throw createError('Já existe uma ordem de manutenção aberta para este item', 409);
  }

  const result = await pool.query(`
    INSERT INTO maintenance_orders (
      equipment_item_id, event_id, opened_by, requested_action, notes
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [equipmentItemId, eventId, req.user?.id, requestedAction, notes]);

  // Atualizar status do item para maintenance
  await pool.query(`
    UPDATE equipment_items 
    SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [equipmentItemId]);

  res.status(201).json({
    message: 'Ordem de manutenção criada com sucesso',
    order: result.rows[0]
  });
}));

// Atualizar ordem de manutenção (apenas gestores)
router.put('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    throw createError('Status é obrigatório', 400);
  }

  if (!['open', 'in_progress', 'completed', 'discarded'].includes(status)) {
    throw createError('Status inválido', 400);
  }

  // Verificar se ordem existe
  const existingOrder = await pool.query(
    'SELECT * FROM maintenance_orders WHERE id = $1',
    [id]
  );

  if (existingOrder.rows.length === 0) {
    throw createError('Ordem de manutenção não encontrada', 404);
  }

  const order = existingOrder.rows[0];

  // Atualizar ordem
  const result = await pool.query(`
    UPDATE maintenance_orders 
    SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `, [status, notes, id]);

  // Se completada, atualizar status do item
  if (status === 'completed') {
    await pool.query(`
      UPDATE equipment_items 
      SET status = 'in_service', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [order.equipment_item_id]);
  }

  res.json({
    message: 'Ordem de manutenção atualizada com sucesso',
    order: result.rows[0]
  });
}));

// Deletar ordem de manutenção (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar se ordem existe
  const existingOrder = await pool.query(
    'SELECT * FROM maintenance_orders WHERE id = $1',
    [id]
  );

  if (existingOrder.rows.length === 0) {
    throw createError('Ordem de manutenção não encontrada', 404);
  }

  const order = existingOrder.rows[0];

  // Só permite deletar se estiver em status open ou discarded
  if (!['open', 'discarded'].includes(order.status)) {
    throw createError('Só é possível deletar ordens em status "open" ou "discarded"', 409);
  }

  await pool.query('DELETE FROM maintenance_orders WHERE id = $1', [id]);

  res.json({
    message: 'Ordem de manutenção deletada com sucesso'
  });
}));

// Estatísticas de manutenção
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'open') as open_orders,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_orders,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
      COUNT(*) FILTER (WHERE status = 'discarded') as discarded_orders,
      COUNT(*) FILTER (WHERE requested_action = 'maintenance') as maintenance_orders,
      COUNT(*) FILTER (WHERE requested_action = 'replace') as replace_orders
    FROM maintenance_orders
  `);

  const itemsInMaintenance = await pool.query(`
    SELECT COUNT(*) as count
    FROM equipment_items
    WHERE status = 'maintenance'
  `);

  res.json({
    orders: stats.rows[0],
    itemsInMaintenance: parseInt(itemsInMaintenance.rows[0].count)
  });
}));

export { router as maintenanceRoutes };

