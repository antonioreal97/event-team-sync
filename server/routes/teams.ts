import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor, requireFreelancerOrLider } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  normalizeEventRow,
  normalizeTeamType,
  normalizeUserRow,
} from '../utils/teamDomain';
import { listTeamAssignments } from '../utils/teamAssignments';

const router = Router();

/** Insere notificação; usa related_team_allocation_id se a coluna existir. */
async function insertNotification(params: {
  userId: string;
  title: string;
  message: string;
  relatedEventId: string | null;
  relatedAllocationId: string | null;
}): Promise<void> {
  const colCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications'
        AND column_name = 'related_team_allocation_id'
    ) AS ok
  `);
  const hasAllocCol = colCheck.rows[0]?.ok === true;

  if (hasAllocCol && params.relatedAllocationId) {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_event_id, related_team_allocation_id)
       VALUES ($1, $2, $3, 'info', $4, $5)`,
      [
        params.userId,
        params.title,
        params.message,
        params.relatedEventId,
        params.relatedAllocationId,
      ]
    );
  } else {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_event_id)
       VALUES ($1, $2, $3, 'info', $4)`,
      [params.userId, params.title, params.message, params.relatedEventId]
    );
  }
}

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

  const users = result.rows.map((row) => normalizeUserRow(row));
  const teams = {
    iniciante: users.filter(user => user.team_type === 'iniciante'),
    intermediario: users.filter(user => user.team_type === 'intermediario'),
    avancado: users.filter(user => user.team_type === 'avancado'),
    sem_equipe: users.filter(user => user.team_type === 'sem_equipe' || !user.team_type)
  };

  res.json({
    teams,
    stats: {
      total: result.rows.length,
      iniciante: teams.iniciante.length,
      intermediario: teams.intermediario.length,
      avancado: teams.avancado.length,
      sem_equipe: teams.sem_equipe.length
    }
  });
}));

// Alocações pendentes de confirmação de disponibilidade (gestor)
router.get('/pending-allocations', requireGestor, asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT 
      ta.id,
      ta.event_id,
      ta.user_id,
      ta.assigned_role,
      ta.status,
      ta.daily_rate,
      ta.total_days,
      ta.created_at,
      e.title AS event_title,
      e.start_date AS event_start_date,
      u.name AS user_name,
      u.email AS user_email
    FROM team_allocations ta
    INNER JOIN events e ON e.id = ta.event_id
    INNER JOIN users u ON u.id = ta.user_id
    WHERE ta.status = 'pending'
    ORDER BY e.start_date ASC, ta.created_at ASC
  `);

  res.json({ allocations: result.rows });
}));

// Minhas alocações (freelancer / líder); filtro opcional por evento
router.get('/my-allocations', asyncHandler(async (req: Request, res: Response) => {
  const role = req.user?.role;
  if (role !== 'freelancer' && role !== 'lider_freelancer') {
    throw createError('Acesso negado', 403);
  }
  const userId = req.user?.id;
  const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : null;

  let sql = `
    SELECT ta.*, e.title AS event_title, e.start_date, e.end_date, e.status AS event_status
    FROM team_allocations ta
    INNER JOIN events e ON e.id = ta.event_id
    WHERE ta.user_id = $1
  `;
  const params: string[] = [userId!];
  if (eventId) {
    sql += ` AND ta.event_id = $2`;
    params.push(eventId);
  }
  sql += ` ORDER BY ta.created_at DESC`;

  const result = await pool.query(sql, params);
  res.json({ allocations: result.rows });
}));

// Alocar freelancer em evento
router.post('/allocate', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    eventId,
    userId,
    assignedRole,
    totalDays,
    notes
  } = req.body;

  if (!eventId || !userId || !assignedRole || !totalDays) {
    throw createError('Dados obrigatórios não fornecidos', 400);
  }

  const eventResult = await pool.query(
    'SELECT id, title, start_date, end_date, event_type, daily_rate_iniciante, daily_rate_intermediario, daily_rate_avancado, daily_rate_team_a, daily_rate_team_b, created_by FROM events WHERE id = $1',
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  const event = eventResult.rows[0];

  const userResult = await pool.query(
    `
    SELECT u.id, u.role, u.name, fp.team_type
    FROM users u
    LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE u.id = $1 AND u.role IN ('freelancer', 'lider_freelancer')
  `,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw createError('Usuário não encontrado ou não é freelancer/líder', 404);
  }

  const user = userResult.rows[0];
  const normalizedUser = normalizeUserRow(user);
  const normalizedEvent = normalizeEventRow(event);

  let dailyRate: number;

  if (normalizedUser.team_type === 'iniciante') {
    dailyRate = Number(normalizedEvent.daily_rate_iniciante || 200);
  } else if (normalizedUser.team_type === 'intermediario') {
    dailyRate = Number(normalizedEvent.daily_rate_intermediario || 200);
  } else if (normalizedUser.team_type === 'avancado') {
    dailyRate = Number(normalizedEvent.daily_rate_avancado || 250);
  } else {
    dailyRate = Number(normalizedEvent.daily_rate_iniciante || 200);
  }

  const existingAllocation = await pool.query(
    'SELECT id FROM team_allocations WHERE event_id = $1 AND user_id = $2',
    [eventId, userId]
  );

  if (existingAllocation.rows.length > 0) {
    throw createError('Usuário já está alocado neste evento', 409);
  }

  const eventStartDate = new Date(eventResult.rows[0].start_date);
  const cancellationDeadline = new Date(eventStartDate);
  cancellationDeadline.setDate(cancellationDeadline.getDate() - 5);

  const result = await pool.query(
    `
    INSERT INTO team_allocations (
      event_id, user_id, assigned_role, daily_rate, total_days,
      total_payment, cancellation_deadline, confirmation_deadline, notes, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    RETURNING *
  `,
    [
      eventId,
      userId,
      assignedRole,
      dailyRate,
      totalDays,
      dailyRate * totalDays,
      cancellationDeadline,
      cancellationDeadline,
      notes ?? null,
    ]
  );

  const allocation = result.rows[0];

  const eventTitle = event.title || 'Evento';
  await insertNotification({
    userId,
    title: 'Confirme sua disponibilidade',
    message: `Você foi escalado para "${eventTitle}" no papel de ${assignedRole}. Confirme se tem disponibilidade ou recuse para liberar a vaga.`,
    relatedEventId: eventId,
    relatedAllocationId: allocation.id,
  });

  const eventData = eventResult.rows[0];
  const startDate = new Date(eventData.start_date);
  const endDate = new Date(eventData.end_date);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    await pool.query(
      `
      INSERT INTO attendance_records (
        team_allocation_id, date, daily_payment
      ) VALUES ($1, $2, $3)
    `,
      [allocation.id, dateStr, dailyRate]
    );
  }

  res.status(201).json({
    message: 'Freelancer alocado com sucesso',
    allocation: {
      ...allocation,
      team_type: normalizedUser.team_type,
      calculated_daily_rate: dailyRate,
    },
  });
}));

// Freelancer confirma disponibilidade (alocação passa a confirmed)
router.post(
  '/allocations/:allocationId/confirm-availability',
  requireFreelancerOrLider,
  asyncHandler(async (req: Request, res: Response) => {
    const { allocationId } = req.params;
    const uid = req.user?.id;

    const r = await pool.query(
      `SELECT id, user_id, status FROM team_allocations WHERE id = $1`,
      [allocationId]
    );
    if (r.rows.length === 0) {
      throw createError('Alocação não encontrada', 404);
    }
    const row = r.rows[0];
    if (row.user_id !== uid) {
      throw createError('Acesso negado', 403);
    }
    if (row.status !== 'pending') {
      throw createError('Esta alocação não está aguardando confirmação', 400);
    }

    await pool.query(
      `UPDATE team_allocations
       SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [allocationId]
    );

    res.json({ message: 'Disponibilidade confirmada', allocationId });
  })
);

// Freelancer recusa — remove alocação e notifica o gestor do evento
router.post(
  '/allocations/:allocationId/decline-availability',
  requireFreelancerOrLider,
  asyncHandler(async (req: Request, res: Response) => {
    const { allocationId } = req.params;
    const uid = req.user?.id;

    const r = await pool.query(
      `
      SELECT ta.id, ta.user_id, ta.status, ta.event_id, ta.assigned_role,
             e.title AS event_title, e.created_by,
             u.name AS freelancer_name
      FROM team_allocations ta
      INNER JOIN events e ON e.id = ta.event_id
      INNER JOIN users u ON u.id = ta.user_id
      WHERE ta.id = $1
    `,
      [allocationId]
    );
    if (r.rows.length === 0) {
      throw createError('Alocação não encontrada', 404);
    }
    const row = r.rows[0];
    if (row.user_id !== uid) {
      throw createError('Acesso negado', 403);
    }
    if (row.status !== 'pending') {
      throw createError('Esta alocação não está aguardando confirmação', 400);
    }

    await pool.query('DELETE FROM team_allocations WHERE id = $1', [allocationId]);

    const gestorId = row.created_by;
    if (gestorId) {
      await insertNotification({
        userId: gestorId,
        title: 'Escalação recusada',
        message: `${row.freelancer_name} não pôde confirmar disponibilidade para "${row.event_title}" (${row.assigned_role}). Escale outro profissional.`,
        relatedEventId: row.event_id,
        relatedAllocationId: null,
      });
    }

    res.json({ message: 'Escalação recusada; o gestor foi notificado.', allocationId });
  })
);

// Remover alocação
router.delete('/allocate/:allocationId', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { allocationId } = req.params;

  const allocationResult = await pool.query('SELECT id FROM team_allocations WHERE id = $1', [
    allocationId,
  ]);

  if (allocationResult.rows.length === 0) {
    throw createError('Alocação não encontrada', 404);
  }

  await pool.query('DELETE FROM team_allocations WHERE id = $1', [allocationId]);

  res.json({
    message: 'Alocação removida com sucesso',
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

  const attendanceResult = await pool.query(
    'SELECT id FROM attendance_records WHERE team_allocation_id = $1 AND date = $2',
    [allocationId, date]
  );

  if (attendanceResult.rows.length === 0) {
    throw createError('Registro de presença não encontrado', 404);
  }

  await pool.query(
    `
    UPDATE attendance_records 
    SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE team_allocation_id = $3 AND date = $4
  `,
    [status, notes, allocationId, date]
  );

  res.json({
    message: 'Presença atualizada com sucesso',
  });
}));

// Confirmar pagamento diário
router.post('/payment/:allocationId/confirm', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { allocationId } = req.params;
  const { date } = req.body;

  if (!date) {
    throw createError('Data é obrigatória', 400);
  }

  const attendanceResult = await pool.query(
    'SELECT id, daily_payment FROM attendance_records WHERE team_allocation_id = $1 AND date = $2',
    [allocationId, date]
  );

  if (attendanceResult.rows.length === 0) {
    throw createError('Registro de presença não encontrado', 404);
  }

  const attendance = attendanceResult.rows[0];

  await pool.query(
    `
    UPDATE attendance_records 
    SET payment_confirmed = true, confirmed_by = $1, confirmed_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `,
    [req.user?.id, attendance.id]
  );

  await pool.query(
    `
    INSERT INTO payment_records (
      team_allocation_id, amount, payment_date, payment_type, status, confirmed_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
  `,
    [allocationId, attendance.daily_payment, date, 'daily', 'confirmed', req.user?.id]
  );

  res.json({
    message: 'Pagamento confirmado com sucesso',
  });
}));

// Buscar freelancers ativos por equipe
router.get('/active-freelancers', requireGestor, asyncHandler(async (_req: Request, res: Response) => {
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
      WHERE u.role IN ('freelancer', 'lider_freelancer') AND u.is_active = true
      ORDER BY fp.team_type NULLS LAST, u.name
    `);

  const teams = {
    iniciante: { total: 0, active: 0, users: [] as object[] },
    intermediario: { total: 0, active: 0, users: [] as object[] },
    avancado: { total: 0, active: 0, users: [] as object[] },
    sem_equipe: { total: 0, active: 0, users: [] as object[] },
  };

  const keys = ['iniciante', 'intermediario', 'avancado', 'sem_equipe'] as const;
  result.rows.forEach((rawRow: Record<string, unknown>) => {
    const urow = normalizeUserRow(rawRow);
    const bucket = normalizeTeamType(urow.team_type);
    const t = teams[bucket as keyof typeof teams];
    t.total++;
    t.active++;
    t.users.push({
      id: urow.id,
      name: urow.name,
      email: urow.email,
      role: urow.role,
      teamType: urow.team_type,
      experienceLevel: urow.experience_level,
      phone: urow.phone,
      city: urow.city,
      state: urow.state,
    });
  });

  res.json(teams);
}));

// Histórico de atribuições de equipe
router.get('/assignments', requireGestor, asyncHandler(async (_req: Request, res: Response) => {
  const assignments = await listTeamAssignments();
  res.json({ assignments });
}));

// Alocações de um evento
router.get('/event/:eventId/allocations', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const result = await pool.query(
    `
    SELECT
      ta.*,
      u.name AS user_name,
      u.email AS user_email,
      fp.team_type,
      fp.experience_level
    FROM team_allocations ta
    INNER JOIN users u ON u.id = ta.user_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = u.id
    WHERE ta.event_id = $1
    ORDER BY ta.created_at ASC
  `,
    [eventId]
  );

  res.json({
    allocations: result.rows.map((row) => normalizeUserRow(row)),
  });
}));

// Lista de presença de um evento em uma data
router.get('/event/:eventId/attendance', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const requestedDate = typeof req.query.date === 'string' ? req.query.date : null;

  const eventResult = await pool.query(
    'SELECT id, start_date FROM events WHERE id = $1',
    [eventId]
  );

  if (eventResult.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  const eventDate = requestedDate || String(eventResult.rows[0].start_date).split('T')[0];

  const result = await pool.query(
    `
    SELECT
      ta.id AS allocation_id,
      ta.user_id,
      ta.assigned_role,
      ta.daily_rate,
      u.name AS user_name,
      fp.team_type,
      ar.id AS attendance_id,
      ar.date,
      ar.status AS attendance_status,
      ar.daily_payment,
      ar.payment_confirmed,
      ar.notes,
      ar.confirmed_at,
      ar.confirmed_by
    FROM team_allocations ta
    INNER JOIN users u ON u.id = ta.user_id
    LEFT JOIN freelancer_profiles fp ON fp.user_id = u.id
    LEFT JOIN attendance_records ar
      ON ar.team_allocation_id = ta.id
     AND ar.date = $2
    WHERE ta.event_id = $1
    ORDER BY u.name ASC
  `,
    [eventId, eventDate]
  );

  const allocations = result.rows.map((row) => {
    const normalizedRow = normalizeUserRow(row);
    return {
      allocationId: normalizedRow.allocation_id,
      userId: normalizedRow.user_id,
      userName: normalizedRow.user_name,
      assignedRole: normalizedRow.assigned_role,
      teamType: normalizedRow.team_type,
      attendance: {
        id: normalizedRow.attendance_id ?? '',
        date: normalizedRow.date ?? eventDate,
        status: normalizedRow.attendance_status ?? 'pending',
        dailyPayment: Number(normalizedRow.daily_payment ?? normalizedRow.daily_rate ?? 0),
        paymentConfirmed: Boolean(normalizedRow.payment_confirmed),
        notes: normalizedRow.notes ?? '',
        confirmedAt: normalizedRow.confirmed_at ?? undefined,
        confirmedBy: normalizedRow.confirmed_by ?? undefined,
      },
    };
  });

  res.json({
    attendanceList: {
      eventId,
      eventDate,
      allocations,
      totalPresent: allocations.filter((item) => item.attendance.status === 'present').length,
      totalAbsent: allocations.filter((item) => item.attendance.status === 'absent').length,
      totalLate: allocations.filter((item) => item.attendance.status === 'late').length,
      totalPending: allocations.filter((item) => item.attendance.status === 'pending').length,
    },
  });
}));

// Verificar se toda a equipe de um evento está confirmada (por status da alocação)
router.get('/event/:eventId/confirmation-status', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const allocationsResult = await pool.query(
    `
    SELECT id, status FROM team_allocations 
    WHERE event_id = $1
  `,
    [eventId]
  );

  if (allocationsResult.rows.length === 0) {
    return res.json({
      isFullyConfirmed: false,
      totalAllocated: 0,
      confirmedCount: 0,
    });
  }

  const totalAllocated = allocationsResult.rows.length;
  const confirmedCount = allocationsResult.rows.filter((a: { status: string }) => a.status === 'confirmed').length;
  const isFullyConfirmed = confirmedCount === totalAllocated;

  res.json({
    isFullyConfirmed,
    totalAllocated,
    confirmedCount,
  });
}));

export { router as teamRoutes };
