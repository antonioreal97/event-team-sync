import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar freelancers por equipe (apenas gestores)
router.get('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT 
      u.id, u.name, u.email, u.is_active, u.created_at,
      fp.team_type, fp.phone, fp.city, fp.state, fp.experience_level,
      fp.audio_visual_roles, fp.total_events_attended, fp.total_earnings
    FROM users u
    INNER JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE u.role = 'freelancer' AND u.is_active = true
    ORDER BY fp.team_type, u.name
  `);

  // Agrupar por equipe
  const teams = {
    equipe_a: result.rows.filter(user => user.team_type === 'equipe_a'),
    equipe_b: result.rows.filter(user => user.team_type === 'equipe_b'),
    sem_equipe: result.rows.filter(user => user.team_type === 'sem_equipe' || !user.team_type)
  };

  res.json({
    teams,
    stats: {
      total: result.rows.length,
      equipe_a: teams.equipe_a.length,
      equipe_b: teams.equipe_b.length,
      sem_equipe: teams.sem_equipe.length
    }
  });
}));

// Alocar freelancer em evento
router.post('/allocate', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    eventId,
    userId,
    assignedRole,
    dailyRate,
    totalDays,
    notes
  } = req.body;

  // Validações
  if (!eventId || !userId || !assignedRole || !dailyRate || !totalDays) {
    throw createError('Dados obrigatórios não fornecidos', 400);
  }

  // Verificar se evento existe
  const eventResult = await pool.query(
    'SELECT id, start_date, end_date FROM events WHERE id = $1',
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  // Verificar se usuário existe e é freelancer
  const userResult = await pool.query(
    'SELECT id, role FROM users WHERE id = $1 AND role = $2',
    [userId, 'freelancer']
  );

  if (userResult.rows.length === 0) {
    throw createError('Usuário não encontrado ou não é freelancer', 404);
  }

  // Verificar se já está alocado neste evento
  const existingAllocation = await pool.query(
    'SELECT id FROM team_allocations WHERE event_id = $1 AND user_id = $2',
    [eventId, userId]
  );

  if (existingAllocation.rows.length > 0) {
    throw createError('Usuário já está alocado neste evento', 409);
  }

  // Calcular datas de cancelamento e confirmação (5 dias antes)
  const eventStartDate = new Date(eventResult.rows[0].start_date);
  const cancellationDeadline = new Date(eventStartDate);
  cancellationDeadline.setDate(cancellationDeadline.getDate() - 5);

  // Inserir alocação
  const result = await pool.query(`
    INSERT INTO team_allocations (
      event_id, user_id, assigned_role, daily_rate, total_days,
      total_payment, cancellation_deadline, confirmation_deadline, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    eventId, userId, assignedRole, dailyRate, totalDays,
    dailyRate * totalDays, cancellationDeadline, cancellationDeadline, notes
  ]);

  // Criar registros de presença para cada dia do evento
  const event = eventResult.rows[0];
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO attendance_records (
        team_allocation_id, date, daily_payment
      ) VALUES ($1, $2, $3)
    `, [result.rows[0].id, dateStr, dailyRate]);
  }

  res.status(201).json({
    message: 'Freelancer alocado com sucesso',
    allocation: result.rows[0]
  });
}));

// Remover alocação
router.delete('/allocate/:allocationId', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { allocationId } = req.params;

  // Verificar se alocação existe
  const allocationResult = await pool.query(
    'SELECT id FROM team_allocations WHERE id = $1',
    [allocationId]
  );

  if (allocationResult.rows.length === 0) {
    throw createError('Alocação não encontrada', 404);
  }

  // Deletar alocação (cascade irá deletar registros de presença)
  await pool.query('DELETE FROM team_allocations WHERE id = $1', [allocationId]);

  res.json({
    message: 'Alocação removida com sucesso'
  });
}));

// Confirmar presença (lista de chamada)
router.post('/attendance/:allocationId', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { allocationId } = req.params;
  const { date, status, notes } = req.body;

  if (!date || !status) {
    throw createError('Data e status são obrigatórios', 400);
  }

  if (!['present', 'absent', 'late'].includes(status)) {
    throw createError('Status inválido', 400);
  }

  // Verificar se registro de presença existe
  const attendanceResult = await pool.query(
    'SELECT id FROM attendance_records WHERE team_allocation_id = $1 AND date = $2',
    [allocationId, date]
  );

  if (attendanceResult.rows.length === 0) {
    throw createError('Registro de presença não encontrado', 404);
  }

  // Atualizar status de presença
  await pool.query(`
    UPDATE attendance_records 
    SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE team_allocation_id = $3 AND date = $4
  `, [status, notes, allocationId, date]);

  res.json({
    message: 'Presença atualizada com sucesso'
  });
}));

// Confirmar pagamento diário
router.post('/payment/:allocationId/confirm', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { allocationId } = req.params;
  const { date } = req.body;

  if (!date) {
    throw createError('Data é obrigatória', 400);
  }

  // Verificar se registro de presença existe
  const attendanceResult = await pool.query(
    'SELECT id, daily_payment FROM attendance_records WHERE team_allocation_id = $1 AND date = $2',
    [allocationId, date]
  );

  if (attendanceResult.rows.length === 0) {
    throw createError('Registro de presença não encontrado', 404);
  }

  const attendance = attendanceResult.rows[0];

  // Atualizar confirmação de pagamento
  await pool.query(`
    UPDATE attendance_records 
    SET payment_confirmed = true, confirmed_by = $1, confirmed_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [req.user?.id, attendance.id]);

  // Criar registro de pagamento
  await pool.query(`
    INSERT INTO payment_records (
      team_allocation_id, amount, payment_date, payment_type, status, confirmed_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    allocationId, attendance.daily_payment, date, 'daily', 'confirmed', req.user?.id
  ]);

  res.json({
    message: 'Pagamento confirmado com sucesso'
  });
}));

// Buscar freelancers ativos por equipe
router.get('/active-freelancers', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Buscar usuários freelancers com suas equipes
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.updated_at,
        fp.team_type,
        fp.experience_level,
        fp.phone,
        fp.city,
        fp.state
      FROM users u
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE u.role = 'freelancer' AND fp.team_type IS NOT NULL
      ORDER BY fp.team_type, u.name
    `);

    // Organizar por equipe
    const teams = {
      equipe_a: { total: 0, active: 0, users: [] },
      equipe_b: { total: 0, active: 0, users: [] },
      sem_equipe: { total: 0, active: 0, users: [] }
    };

    result.rows.forEach(user => {
      const teamType = user.team_type || 'sem_equipe';
      if (teams[teamType]) {
        teams[teamType].total++;
        teams[teamType].active++; // Considerar todos como ativos por enquanto
        teams[teamType].users.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamType: user.team_type,
          experienceLevel: user.experience_level,
          phone: user.phone,
          city: user.city,
          state: user.state
        });
      }
    });

    res.json(teams);
  } catch (error) {
    console.error('Erro ao buscar freelancers ativos:', error);
    throw createError('Erro interno ao buscar freelancers ativos', 500);
  }
}));

// Verificar se toda a equipe de um evento está confirmada
router.get('/event/:eventId/confirmation-status', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    // Verificar se a tabela event_interest_confirmations existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_interest_confirmations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Se a tabela não existe, considerar como não confirmado
      return res.json({ isFullyConfirmed: false });
    }

    // Buscar todas as alocações para o evento
    const allocationsResult = await pool.query(`
      SELECT user_id FROM team_allocations 
      WHERE event_id = $1
    `, [eventId]);

    if (allocationsResult.rows.length === 0) {
      return res.json({ isFullyConfirmed: false });
    }

    const allocatedUserIds = allocationsResult.rows.map(row => row.user_id);

    // Verificar se todos os usuários alocados confirmaram interesse
    const confirmationsResult = await pool.query(`
      SELECT COUNT(*) as confirmed_count
      FROM event_interest_confirmations 
      WHERE event_id = $1 AND user_id = ANY($2) AND status = 'confirmed'
    `, [eventId, allocatedUserIds]);

    const confirmedCount = parseInt(confirmationsResult.rows[0].confirmed_count);
    const isFullyConfirmed = confirmedCount === allocatedUserIds.length;

    res.json({ 
      isFullyConfirmed,
      totalAllocated: allocatedUserIds.length,
      confirmedCount
    });
  } catch (error) {
    console.error('Erro ao verificar status da equipe:', error);
    throw createError('Erro interno ao verificar status da equipe', 500);
  }
}));

export { router as teamRoutes };





