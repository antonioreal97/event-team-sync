import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar reservas de equipamentos de um evento
router.get('/events/:eventId/equipment', asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  // Verificar se evento existe
  const event = await pool.query(
    'SELECT id, title, start_date, end_date FROM events WHERE id = $1',
    [eventId]
  );

  if (event.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  const result = await pool.query(`
    SELECT 
      eir.*,
      ei.asset_tag,
      ei.serial_number,
      ei.condition as item_condition,
      ei.status as item_status,
      e.name as equipment_name,
      e.description as equipment_description,
      ec.name as category_name,
      u1.name as reserved_by_name,
      u2.name as checked_out_by_name,
      u3.name as checked_in_by_name
    FROM equipment_item_reservations eir
    JOIN equipment_items ei ON eir.equipment_item_id = ei.id
    JOIN equipments e ON ei.equipment_id = e.id
    LEFT JOIN equipment_categories ec ON e.category_id = ec.id
    LEFT JOIN users u1 ON eir.reserved_by = u1.id
    LEFT JOIN users u2 ON eir.checked_out_by = u2.id
    LEFT JOIN users u3 ON eir.checked_in_by = u3.id
    WHERE eir.event_id = $1
    ORDER BY ec.name, e.name, ei.asset_tag
  `, [eventId]);

  res.json({
    event: event.rows[0],
    reservations: result.rows
  });
}));

// Reservar itens para um evento (apenas gestores)
router.post('/events/:eventId/equipment/reservations', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { itemIds } = req.body;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw createError('Lista de IDs dos itens é obrigatória', 400);
  }

  // Verificar se evento existe e obter datas
  const event = await pool.query(
    'SELECT id, title, start_date, end_date FROM events WHERE id = $1',
    [eventId]
  );

  if (event.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  const eventData = event.rows[0];

  // Verificar se todos os itens existem e estão disponíveis
  const items = await pool.query(`
    SELECT ei.id, ei.asset_tag, e.name as equipment_name
    FROM equipment_items ei
    JOIN equipments e ON ei.equipment_id = e.id
    WHERE ei.id = ANY($1) AND ei.status = 'in_service'
  `, [itemIds]);

  if (items.rows.length !== itemIds.length) {
    throw createError('Um ou mais itens não foram encontrados ou não estão em serviço', 404);
  }

  // Verificar conflitos de reserva para cada item
  const conflicts = [];
  for (const item of items.rows) {
    const conflictCheck = await pool.query(
      'SELECT check_equipment_reservation_conflict($1, $2, $3, $4) as has_conflict',
      [item.id, eventId, eventData.start_date, eventData.end_date]
    );

    if (conflictCheck.rows[0].has_conflict) {
      conflicts.push(item.asset_tag);
    }
  }

  if (conflicts.length > 0) {
    throw createError(`Itens com conflito de reserva: ${conflicts.join(', ')}`, 409);
  }

  // Criar reservas
  const reservations = [];
  for (const itemId of itemIds) {
    const result = await pool.query(`
      INSERT INTO equipment_item_reservations (
        event_id, equipment_item_id, reserved_by
      ) VALUES ($1, $2, $3)
      RETURNING *
    `, [eventId, itemId, req.user?.id]);

    reservations.push(result.rows[0]);
  }

  res.status(201).json({
    message: 'Reservas criadas com sucesso',
    reservations
  });
}));

// Checkout de item (retirada) - apenas líder do evento
router.post('/events/:eventId/equipment/checkout', asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { assetTag, reservationId, conditionOut } = req.body;

  if (!assetTag && !reservationId) {
    throw createError('assetTag ou reservationId é obrigatório', 400);
  }

  // Verificar se usuário é líder do evento
  const leaderCheck = await pool.query(`
    SELECT ta.id, u.name
    FROM team_allocations ta
    JOIN users u ON ta.user_id = u.id
    WHERE ta.event_id = $1 AND ta.user_id = $2 AND ta.assigned_role = 'lider'
  `, [eventId, req.user?.id]);

  if (leaderCheck.rows.length === 0) {
    throw createError('Apenas o líder do evento pode fazer checkout de equipamentos', 403);
  }

  // Buscar reserva
  let reservation;
  if (reservationId) {
    const result = await pool.query(
      'SELECT * FROM equipment_item_reservations WHERE id = $1 AND event_id = $2',
      [reservationId, eventId]
    );
    reservation = result.rows[0];
  } else {
    const result = await pool.query(`
      SELECT eir.*
      FROM equipment_item_reservations eir
      JOIN equipment_items ei ON eir.equipment_item_id = ei.id
      WHERE eir.event_id = $1 AND ei.asset_tag = $2
    `, [eventId, assetTag]);
    reservation = result.rows[0];
  }

  if (!reservation) {
    throw createError('Reserva não encontrada', 404);
  }

  if (reservation.status !== 'reserved') {
    throw createError('Item já foi retirado ou não está disponível para checkout', 409);
  }

  // Atualizar reserva para checked_out
  const result = await pool.query(`
    UPDATE equipment_item_reservations 
    SET 
      status = 'checked_out',
      checked_out_by = $1,
      checked_out_at = CURRENT_TIMESTAMP,
      condition_out = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `, [req.user?.id, conditionOut, reservation.id]);

  res.json({
    message: 'Checkout realizado com sucesso',
    reservation: result.rows[0]
  });
}));

// Checkin de item (devolução) - apenas líder do evento
router.post('/events/:eventId/equipment/checkin', asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { assetTag, reservationId, conditionIn, postEventStatus, notes } = req.body;

  if (!assetTag && !reservationId) {
    throw createError('assetTag ou reservationId é obrigatório', 400);
  }

  if (!conditionIn || !postEventStatus) {
    throw createError('conditionIn e postEventStatus são obrigatórios', 400);
  }

  // Verificar se usuário é líder do evento
  const leaderCheck = await pool.query(`
    SELECT ta.id, u.name
    FROM team_allocations ta
    JOIN users u ON ta.user_id = u.id
    WHERE ta.event_id = $1 AND ta.user_id = $2 AND ta.assigned_role = 'lider'
  `, [eventId, req.user?.id]);

  if (leaderCheck.rows.length === 0) {
    throw createError('Apenas o líder do evento pode fazer checkin de equipamentos', 403);
  }

  // Buscar reserva
  let reservation;
  if (reservationId) {
    const result = await pool.query(
      'SELECT * FROM equipment_item_reservations WHERE id = $1 AND event_id = $2',
      [reservationId, eventId]
    );
    reservation = result.rows[0];
  } else {
    const result = await pool.query(`
      SELECT eir.*
      FROM equipment_item_reservations eir
      JOIN equipment_items ei ON eir.equipment_item_id = ei.id
      WHERE eir.event_id = $1 AND ei.asset_tag = $2
    `, [eventId, assetTag]);
    reservation = result.rows[0];
  }

  if (!reservation) {
    throw createError('Reserva não encontrada', 404);
  }

  if (reservation.status !== 'checked_out') {
    throw createError('Item não foi retirado ou já foi devolvido', 409);
  }

  // Atualizar reserva para returned
  const result = await pool.query(`
    UPDATE equipment_item_reservations 
    SET 
      status = 'returned',
      checked_in_by = $1,
      checked_in_at = CURRENT_TIMESTAMP,
      condition_in = $2,
      post_event_status = $3,
      notes = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
  `, [req.user?.id, conditionIn, postEventStatus, notes, reservation.id]);

  // Criar ordem de manutenção se necessário
  let maintenanceOrderId = null;
  if (['maintenance', 'replace', 'damaged', 'lost'].includes(postEventStatus)) {
    const maintenanceResult = await pool.query(
      'SELECT create_maintenance_order_if_needed($1, $2, $3, $4, $5) as order_id',
      [reservation.equipment_item_id, eventId, req.user?.id, postEventStatus, notes]
    );
    maintenanceOrderId = maintenanceResult.rows[0].order_id;
  }

  res.json({
    message: 'Checkin realizado com sucesso',
    reservation: result.rows[0],
    maintenanceOrderId
  });
}));

// Resolver asset_tag para item e reserva ativa
router.post('/equipment/scan/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { assetTag, eventId } = req.body;

  if (!assetTag) {
    throw createError('assetTag é obrigatório', 400);
  }

  // Buscar item
  const item = await pool.query(`
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

  if (item.rows.length === 0) {
    throw createError('Item não encontrado', 404);
  }

  const itemData = item.rows[0];

  // Buscar reserva ativa se eventId fornecido
  let activeReservation = null;
  if (eventId) {
    const reservation = await pool.query(`
      SELECT eir.*
      FROM equipment_item_reservations eir
      WHERE eir.equipment_item_id = $1 AND eir.event_id = $2
    `, [itemData.id, eventId]);

    if (reservation.rows.length > 0) {
      activeReservation = reservation.rows[0];
    }
  }

  res.json({
    item: itemData,
    activeReservation
  });
}));

// Cancelar reserva (apenas gestores)
router.delete('/events/:eventId/equipment/reservations/:reservationId', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId, reservationId } = req.params;

  // Verificar se reserva existe e pertence ao evento
  const reservation = await pool.query(
    'SELECT * FROM equipment_item_reservations WHERE id = $1 AND event_id = $2',
    [reservationId, eventId]
  );

  if (reservation.rows.length === 0) {
    throw createError('Reserva não encontrada', 404);
  }

  if (reservation.rows[0].status === 'checked_out') {
    throw createError('Não é possível cancelar reserva de item já retirado', 409);
  }

  // Atualizar status para cancelled
  await pool.query(`
    UPDATE equipment_item_reservations 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [reservationId]);

  res.json({
    message: 'Reserva cancelada com sucesso'
  });
}));

export { router as equipmentReservationsRoutes };

