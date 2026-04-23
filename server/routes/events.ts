import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  normalizeEventRow,
  normalizeNullableTeamPriority,
  normalizeUserRow,
} from '../utils/teamDomain';

const router = Router();

const EVENT_SELECT = `
  SELECT e.*, u.name AS created_by_name
  FROM events e
  LEFT JOIN users u ON e.created_by = u.id
`;

function sanitizeNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value == null) return fallback;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === 'string');
}

function sanitizeDateArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeEventWriteInput(input: Record<string, unknown>, partial = false): Record<string, unknown> {
  const title = input.title;
  const description = input.description;
  const location = input.location;
  const startDate = input.startDate ?? input.start_date;
  const endDate = input.endDate ?? input.end_date;
  const eventType = input.eventType ?? input.event_type;
  const estimatedDuration = input.estimatedDuration ?? input.estimated_duration;
  const budget = input.budget;
  const requirements = input.requirements;
  const notes = input.notes;
  const teamPriorityRaw = input.teamPriority ?? input.team_priority;
  const allowBackupRaw = input.allowBackupLevels ?? input.allow_backup_levels ?? input.allowTeamB ?? input.allow_team_b;
  const dailyRateInicianteRaw = input.dailyRateIniciante ?? input.daily_rate_iniciante ?? input.dailyRateTeamB ?? input.daily_rate_team_b;
  const dailyRateIntermediarioRaw = input.dailyRateIntermediario ?? input.daily_rate_intermediario ?? input.dailyRateTeamB ?? input.daily_rate_team_b;
  const dailyRateAvancadoRaw = input.dailyRateAvancado ?? input.daily_rate_avancado ?? input.dailyRateTeamA ?? input.daily_rate_team_a;
  const isMultiDayRaw = input.isMultiDay ?? input.is_multi_day;
  const totalDaysRaw = input.totalDays ?? input.total_days;
  const workingDaysRaw = input.workingDays ?? input.working_days;
  const dailySchedule = input.dailySchedule ?? input.daily_schedule;
  const eventAgenda = input.eventAgenda ?? input.event_agenda;
  const specialInstructions = input.specialInstructions ?? input.special_instructions;
  const setupRequirements = input.setupRequirements ?? input.setup_requirements;
  const technicalSpecifications = input.technicalSpecifications ?? input.technical_specifications;
  const status = input.status;

  const payload: Record<string, unknown> = {};

  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw createError('Título é obrigatório', 400);
    }
    payload.title = title.trim();
  }

  if (!partial || location !== undefined) {
    if (typeof location !== 'string' || !location.trim()) {
      throw createError('Local é obrigatório', 400);
    }
    payload.location = location.trim();
  }

  if (!partial || startDate !== undefined) {
    if (typeof startDate !== 'string' || !startDate.trim()) {
      throw createError('Data inicial é obrigatória', 400);
    }
    payload.start_date = startDate;
  }

  if (!partial || endDate !== undefined) {
    if (typeof endDate !== 'string' || !endDate.trim()) {
      throw createError('Data final é obrigatória', 400);
    }
    payload.end_date = endDate;
  }

  if (!partial || eventType !== undefined) {
    if (!['normal', 'especial'].includes(String(eventType))) {
      throw createError('Tipo de evento inválido', 400);
    }
    payload.event_type = eventType;
  }

  if (description !== undefined) payload.description = description;
  if (notes !== undefined) payload.notes = notes;
  if (status !== undefined) payload.status = status;

  if (estimatedDuration !== undefined) {
    const parsed = sanitizeNumber(estimatedDuration);
    if (parsed == null) {
      throw createError('Duração estimada inválida', 400);
    }
    payload.estimated_duration = parsed;
  }

  if (budget !== undefined) {
    payload.budget = sanitizeNumber(budget);
  }

  if (requirements !== undefined) {
    payload.requirements = sanitizeStringArray(requirements);
  }

  if (!partial || teamPriorityRaw !== undefined) {
    const normalizedTeamPriority = normalizeNullableTeamPriority(teamPriorityRaw);
    if (!normalizedTeamPriority) {
      throw createError(
        'Prioridade de equipe inválida. Use iniciante, intermediario, avancado ou ambas',
        400
      );
    }
    payload.team_priority = normalizedTeamPriority;
  }

  const allowBackupLevels = sanitizeBoolean(allowBackupRaw, true);
  if (!partial || allowBackupRaw !== undefined) {
    payload.allow_backup_levels = allowBackupLevels;
    payload.allow_team_b = allowBackupLevels;
  }

  if (!partial || dailyRateInicianteRaw !== undefined || dailyRateIntermediarioRaw !== undefined || dailyRateAvancadoRaw !== undefined) {
    const dailyRateIniciante = sanitizeNumber(dailyRateInicianteRaw);
    const dailyRateIntermediario = sanitizeNumber(dailyRateIntermediarioRaw);
    const dailyRateAvancado = sanitizeNumber(dailyRateAvancadoRaw);

    if (dailyRateIniciante == null || dailyRateIntermediario == null || dailyRateAvancado == null) {
      throw createError('Valores de diária inválidos', 400);
    }

    payload.daily_rate_iniciante = dailyRateIniciante;
    payload.daily_rate_intermediario = dailyRateIntermediario;
    payload.daily_rate_avancado = dailyRateAvancado;
    payload.daily_rate_team_a = dailyRateAvancado;
    payload.daily_rate_team_b = dailyRateIniciante;
  }

  if (!partial || isMultiDayRaw !== undefined) {
    payload.is_multi_day = sanitizeBoolean(isMultiDayRaw, false);
  }

  if (!partial || totalDaysRaw !== undefined) {
    const totalDays = sanitizeNumber(totalDaysRaw);
    if (totalDays == null) {
      throw createError('Total de dias inválido', 400);
    }
    payload.total_days = totalDays;
  }

  if (!partial || workingDaysRaw !== undefined) {
    payload.working_days = sanitizeDateArray(workingDaysRaw);
  }

  if (dailySchedule !== undefined) payload.daily_schedule = dailySchedule;
  if (eventAgenda !== undefined) payload.event_agenda = eventAgenda;
  if (specialInstructions !== undefined) payload.special_instructions = specialInstructions;
  if (setupRequirements !== undefined) payload.setup_requirements = setupRequirements;
  if (technicalSpecifications !== undefined) payload.technical_specifications = technicalSpecifications;

  return payload;
}

async function fetchEventById(eventId: string): Promise<Record<string, unknown>> {
  const result = await pool.query(`${EVENT_SELECT} WHERE e.id = $1`, [eventId]);
  if (result.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }
  return normalizeEventRow(result.rows[0]);
}

async function fetchEventAllocations(eventId: string): Promise<Record<string, unknown>[]> {
  const result = await pool.query(
    `
    SELECT
      ta.*,
      u.name AS user_name,
      u.email AS user_email,
      fp.team_type,
      fp.experience_level
    FROM team_allocations ta
    INNER JOIN users u ON ta.user_id = u.id
    LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE ta.event_id = $1
    ORDER BY ta.created_at ASC
  `,
    [eventId]
  );

  return result.rows.map((row) => normalizeUserRow(row));
}

// Listar eventos (filtrados por usuário)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const result = userRole === 'gestor'
    ? await pool.query(`${EVENT_SELECT} ORDER BY e.start_date DESC`)
    : await pool.query(
        `
        ${EVENT_SELECT}
        INNER JOIN team_allocations ta ON e.id = ta.event_id
        WHERE ta.user_id = $1
        ORDER BY e.start_date DESC
      `,
        [userId]
      );

  res.json({
    events: result.rows.map(normalizeEventRow),
  });
}));

// Buscar eventos com interesses confirmados (apenas gestores)
router.get('/with-interests', requireGestor, asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT DISTINCT
      e.*,
      u.name AS created_by_name,
      COUNT(eic.id) AS interest_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN event_interest_confirmations eic ON e.id = eic.event_id
    WHERE e.status = 'planning'
    GROUP BY e.id, u.name
    HAVING COUNT(eic.id) > 0
    ORDER BY e.start_date ASC
  `);

  res.json({
    events: result.rows.map(normalizeEventRow),
  });
}));

// Buscar eventos de um usuário específico
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  if (currentUserRole !== 'gestor' && currentUserId !== userId) {
    throw createError('Acesso negado', 403);
  }

  const result = currentUserRole === 'gestor'
    ? await pool.query(`${EVENT_SELECT} ORDER BY e.start_date DESC`)
    : await pool.query(
        `
        ${EVENT_SELECT}
        INNER JOIN team_allocations ta ON e.id = ta.event_id
        WHERE ta.user_id = $1
        ORDER BY e.start_date DESC
      `,
        [userId]
      );

  res.json({
    events: result.rows.map(normalizeEventRow),
  });
}));

// Buscar evento por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const event = await fetchEventById(id);

  if (userRole === 'freelancer' || userRole === 'lider_freelancer') {
    if (event.status !== 'confirmed') {
      const allocationResult = await pool.query(
        'SELECT id FROM team_allocations WHERE event_id = $1 AND user_id = $2',
        [id, userId]
      );

      if (allocationResult.rows.length === 0) {
        throw createError('Acesso negado', 403);
      }
    }
  }

  const teamAllocations = await fetchEventAllocations(id);
  const equipmentResult = await pool.query(
    `
    SELECT
      ea.*,
      e.name AS equipment_name,
      e.category
    FROM equipment_allocations ea
    INNER JOIN equipments e ON ea.equipment_id = e.id
    WHERE ea.event_id = $1
  `,
    [id]
  );

  res.json({
    event: normalizeEventRow({
      ...event,
      teamAllocations,
      equipmentAllocations: equipmentResult.rows,
    }),
  });
}));

// Criar evento (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const payload = normalizeEventWriteInput(req.body as Record<string, unknown>);

  const result = await pool.query(
    `
    INSERT INTO events (
      title, description, location, start_date, end_date, status,
      created_by, event_type, estimated_duration, budget, requirements,
      notes, team_priority, allow_backup_levels, allow_team_b,
      daily_rate_iniciante, daily_rate_intermediario, daily_rate_avancado,
      daily_rate_team_a, daily_rate_team_b, is_multi_day, total_days,
      working_days, daily_schedule, event_agenda, special_instructions,
      setup_requirements, technical_specifications
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18,
      $19, $20, $21, $22,
      $23, $24, $25, $26,
      $27, $28
    )
    RETURNING *
  `,
    [
      payload.title,
      payload.description ?? null,
      payload.location,
      payload.start_date,
      payload.end_date,
      payload.status ?? 'planning',
      req.user?.id,
      payload.event_type,
      payload.estimated_duration ?? null,
      payload.budget ?? null,
      payload.requirements ?? [],
      payload.notes ?? null,
      payload.team_priority,
      payload.allow_backup_levels,
      payload.allow_team_b,
      payload.daily_rate_iniciante,
      payload.daily_rate_intermediario,
      payload.daily_rate_avancado,
      payload.daily_rate_team_a,
      payload.daily_rate_team_b,
      payload.is_multi_day ?? false,
      payload.total_days ?? 1,
      payload.working_days ?? [],
      payload.daily_schedule ?? null,
      payload.event_agenda ?? null,
      payload.special_instructions ?? null,
      payload.setup_requirements ?? null,
      payload.technical_specifications ?? null,
    ]
  );

  res.status(201).json({
    message: 'Evento criado com sucesso',
    event: normalizeEventRow(result.rows[0]),
  });
}));

// Atualizar status do evento (apenas gestores)
router.patch('/:id/status', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['planning', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    throw createError(
      'Status inválido. Status permitidos: planning, confirmed, in_progress, completed, cancelled',
      400
    );
  }

  const existingEvent = await fetchEventById(id);
  const result = await pool.query(
    'UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );

  res.json({
    message: `Status do evento "${existingEvent.title}" atualizado para "${status}" com sucesso`,
    event: normalizeEventRow(result.rows[0]),
  });
}));

// Atualizar evento (apenas gestores)
router.put('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await fetchEventById(id);

  const payload = normalizeEventWriteInput(req.body as Record<string, unknown>, true);
  const fields = Object.entries(payload);

  if (fields.length === 0) {
    throw createError('Nenhum campo válido para atualização', 400);
  }

  const setClause = fields
    .map(([column], index) => `${column} = $${index + 2}`)
    .join(', ');

  const values = [id, ...fields.map(([, value]) => value)];
  const result = await pool.query(
    `
    UPDATE events
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `,
    values
  );

  res.json({
    message: 'Evento atualizado com sucesso',
    event: normalizeEventRow(result.rows[0]),
  });
}));

// Deletar evento (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await fetchEventById(id);

  await pool.query('DELETE FROM events WHERE id = $1', [id]);

  res.json({
    message: 'Evento deletado com sucesso',
  });
}));

// Confirmar interesse em evento (apenas freelancers)
router.post('/:id/confirm-interest', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole !== 'freelancer') {
    throw createError('Apenas freelancers podem confirmar interesse em eventos', 403);
  }

  const eventResult = await pool.query(
    'SELECT id, title FROM events WHERE id = $1',
    [id]
  );

  if (eventResult.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  const existingInterest = await pool.query(
    'SELECT id FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existingInterest.rows.length > 0) {
    throw createError('Usuário já confirmou interesse neste evento', 400);
  }

  const allocationResult = await pool.query(
    'SELECT id, status FROM team_allocations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (allocationResult.rows.length > 0 && allocationResult.rows[0].status === 'confirmed') {
    throw createError(
      'Usuário já está confirmado para este evento. Não é necessário confirmar interesse.',
      400
    );
  }

  const confirmationResult = await pool.query(
    `
    INSERT INTO event_interest_confirmations (
      event_id, user_id, status, created_at, updated_at
    ) VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `,
    [id, userId]
  );

  const adminUsers = await pool.query("SELECT id FROM users WHERE role = 'gestor'");
  const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
  const userName = userResult.rows[0]?.name || 'Freelancer';

  for (const admin of adminUsers.rows) {
    await pool.query(
      `
      INSERT INTO notifications (
        user_id, title, message, type, related_event_id, priority, action_required, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `,
      [
        admin.id,
        'Novo Interesse Confirmado',
        `O freelancer ${userName} confirmou interesse no evento "${eventResult.rows[0].title}"`,
        'allocation',
        id,
        'medium',
        true,
      ]
    );
  }

  res.status(201).json({
    message: 'Interesse confirmado com sucesso',
    confirmation: confirmationResult.rows[0],
  });
}));

// Verificar status de interesse em evento
router.get('/:id/interest-status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const result = await pool.query(
    'SELECT * FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (result.rows.length === 0) {
    res.json({
      hasInterest: false,
      status: null,
      message: 'Usuário não confirmou interesse ainda',
    });
    return;
  }

  res.json({
    hasInterest: true,
    status: result.rows[0].status,
    confirmation: result.rows[0],
  });
}));

// Cancelar interesse em evento
router.delete('/:id/cancel-interest', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (userRole !== 'freelancer') {
    throw createError('Apenas freelancers podem cancelar interesse em eventos', 403);
  }

  const existingInterest = await pool.query(
    'SELECT id FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existingInterest.rows.length === 0) {
    throw createError('Confirmação de interesse não encontrada', 404);
  }

  const allocationResult = await pool.query(
    'SELECT id, status FROM team_allocations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (allocationResult.rows.length > 0 && allocationResult.rows[0].status === 'confirmed') {
    throw createError(
      'Não é possível cancelar interesse após ser escalado para o evento. Entre em contato com o administrador.',
      403
    );
  }

  await pool.query(
    'DELETE FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  res.json({
    message: 'Interesse cancelado com sucesso',
  });
}));

export { router as eventRoutes };
