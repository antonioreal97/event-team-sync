import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar eventos (filtrados por usuário)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  let query = '';
  let params: any[] = [];

  if (userRole === 'gestor') {
    // Gestores veem todos os eventos
    query = `
      SELECT e.*, u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.start_date DESC
    `;
  } else {
    // Freelancers veem apenas eventos onde estão alocados
    query = `
      SELECT DISTINCT e.*, u.name as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      INNER JOIN team_allocations ta ON e.id = ta.event_id
      WHERE ta.user_id = $1
      ORDER BY e.start_date DESC
    `;
    params = [userId];
  }

  const result = await pool.query(query, params);



  res.json({
    events: result.rows
  });
}));

// Buscar evento por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Buscar evento
  const eventResult = await pool.query(`
    SELECT e.*, u.name as created_by_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = $1
  `, [id]);

  if (eventResult.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  const event = eventResult.rows[0];

  // Se for freelancer, verificar se está alocado no evento
  if (userRole === 'freelancer') {
    const allocationResult = await pool.query(
      'SELECT id FROM team_allocations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (allocationResult.rows.length === 0) {
      throw createError('Acesso negado', 403);
    }
  }

  // Buscar alocações de equipe
  const allocationsResult = await pool.query(`
    SELECT 
      ta.*,
      u.name as user_name,
      u.email as user_email,
      fp.team_type,
      fp.experience_level
    FROM team_allocations ta
    INNER JOIN users u ON ta.user_id = u.id
    LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE ta.event_id = $1
  `, [id]);

  // Buscar equipamentos alocados
  const equipmentResult = await pool.query(`
    SELECT 
      ea.*,
      e.name as equipment_name,
      e.category
    FROM equipment_allocations ea
    INNER JOIN equipments e ON ea.equipment_id = e.id
    WHERE ea.event_id = $1
  `, [id]);

  res.json({
    event: {
      ...event,
      teamAllocations: allocationsResult.rows,
      equipmentAllocations: equipmentResult.rows
    }
  });
}));

// Buscar eventos de um usuário específico
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  console.log('🔍 Buscando eventos para usuário:', userId);
  console.log('👤 Usuário atual:', currentUserId, 'Role:', currentUserRole);

  // Verificar permissões
  if (currentUserRole !== 'gestor' && currentUserId !== userId) {
    throw createError('Acesso negado', 403);
  }

  // Buscar eventos onde o usuário está alocado
  const result = await pool.query(`
    SELECT DISTINCT e.*, u.name as created_by_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    INNER JOIN team_allocations ta ON e.id = ta.event_id
    WHERE ta.user_id = $1
    ORDER BY e.start_date DESC
  `, [userId]);

  console.log('📊 Eventos encontrados para usuário:', userId);
  console.log('📋 Resultado da query:', result.rows.map(row => ({
    id: row.id,
    title: row.title,
    start_date: row.start_date,
    end_date: row.end_date,
    start_date_type: typeof row.start_date,
    end_date_type: typeof row.end_date,
    start_date_value: row.start_date,
    end_date_value: row.end_date
  })));

  res.json({
    events: result.rows
  });
}));

// Criar evento (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    location,
    startDate,
    endDate,
    eventType,
    estimatedDuration,
    budget,
    requirements,
    notes,
    teamPriority,
    allowTeamB,
    dailyRateTeamA,
    dailyRateTeamB,
    isMultiDay,
    totalDays,
    workingDays
  } = req.body;

  // Validações básicas
  if (!title || !location || !startDate || !endDate) {
    throw createError('Dados obrigatórios não fornecidos', 400);
  }

  if (!['normal', 'especial'].includes(eventType)) {
    throw createError('Tipo de evento inválido', 400);
  }

  if (!['equipe_a', 'equipe_b'].includes(teamPriority)) {
    throw createError('Prioridade de equipe inválida', 400);
  }

  // Inserir evento
  const result = await pool.query(`
    INSERT INTO events (
      title, description, location, start_date, end_date, event_type,
      estimated_duration, budget, requirements, notes, team_priority,
      allow_team_b, daily_rate_team_a, daily_rate_team_b, is_multi_day,
      total_days, working_days, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `, [
    title, description, location, startDate, endDate, eventType,
    estimatedDuration, budget, requirements, notes, teamPriority,
    allowTeamB, dailyRateTeamA, dailyRateTeamB, isMultiDay,
    totalDays, workingDays, req.user?.id
  ]);

  res.status(201).json({
    message: 'Evento criado com sucesso',
    event: result.rows[0]
  });
}));

// Atualizar evento (apenas gestores)
router.put('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log('Atualizando evento:', id);
  console.log('Dados recebidos:', updateData);


  // Verificar se evento existe
  const existingEvent = await pool.query(
    'SELECT id FROM events WHERE id = $1',
    [id]
  );

  if (existingEvent.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  // Construir query de atualização dinamicamente
  const fields = Object.keys(updateData).filter(key => 
    key !== 'id' && key !== 'created_by' && key !== 'created_at'
  );

  console.log('Campos para atualização:', fields);

  if (fields.length === 0) {
    throw createError('Nenhum campo válido para atualização', 400);
  }

  // Tratar campos especiais (JSONB, arrays, etc.)
  const processedFields = fields.map(field => {
    const value = updateData[field];
    
    // Para campos JSONB, garantir que seja JSON válido
    if (field === 'daily_schedule' && value) {
      try {
        // Se já é um array/objeto, converter para JSON
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        // Se é string, verificar se é JSON válido
        if (typeof value === 'string') {
          JSON.parse(value); // Validar JSON
          return value;
        }
        return JSON.stringify(value);
      } catch (jsonError) {
        console.error(`Erro ao processar campo JSONB ${field}:`, jsonError);
        console.error('Valor recebido:', value);
        throw createError(`Campo ${field} contém JSON inválido`, 400);
      }
    }
    
    // Para arrays de datas (working_days), validar formato
    if (field === 'working_days' && Array.isArray(value)) {
      try {
        // Validar que todas as datas são strings válidas
        const validDates = value.map(dateStr => {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            throw new Error(`Data inválida: ${dateStr}`);
          }
          return dateStr;
        });
        return validDates;
      } catch (dateError) {
        console.error(`Erro ao processar campo de datas ${field}:`, dateError);
        throw createError(`Campo ${field} contém datas inválidas`, 400);
      }
    }
    
    // Para arrays, converter para formato PostgreSQL
    if (Array.isArray(value)) {
      return value;
    }
    
    return value;
  });

  const setClause = fields.map((field, index) => 
    `${field} = $${index + 2}`
  ).join(', ');

  const query = `
    UPDATE events 
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING *
  `;

  const values = [id, ...processedFields];
  
  console.log('Query SQL:', query);
  console.log('Valores processados:', values);
  console.log('Tipos dos valores:', values.map(v => typeof v));

  try {
    const result = await pool.query(query, values);
    console.log('Evento atualizado com sucesso:', result.rows[0]);

    res.json({
      message: 'Evento atualizado com sucesso',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao executar query:', error);
    console.error('Query que falhou:', query);
    console.error('Valores que causaram erro:', values);
    
    // Retornar erro mais específico
    if (error.code === '22P02') {
      throw createError('Dados inválidos para atualização - verifique os tipos de dados', 400);
    } else if (error.code === '23502') {
      throw createError('Campo obrigatório não pode ser nulo', 400);
    } else {
      throw createError(`Erro no banco de dados: ${error.message}`, 500);
    }
  }
}));

// Deletar evento (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar se evento existe
  const existingEvent = await pool.query(
    'SELECT id FROM events WHERE id = $1',
    [id]
  );

  if (existingEvent.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  // Deletar evento (cascade irá deletar alocações relacionadas)
  await pool.query('DELETE FROM events WHERE id = $1', [id]);

  res.json({
    message: 'Evento deletado com sucesso'
  });
}));

// Confirmar interesse em evento (apenas freelancers)
router.post('/:id/confirm-interest', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Verificar se usuário é freelancer
  if (userRole !== 'freelancer') {
    throw createError('Apenas freelancers podem confirmar interesse em eventos', 403);
  }

  // Verificar se evento existe
  const eventResult = await pool.query(
    'SELECT id, title FROM events WHERE id = $1',
    [id]
  );

  if (eventResult.rows.length === 0) {
    throw createError('Evento não encontrado', 404);
  }

  // Verificar se usuário já confirmou interesse
  const existingInterest = await pool.query(
    'SELECT id FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existingInterest.rows.length > 0) {
    throw createError('Usuário já confirmou interesse neste evento', 400);
  }

  // Verificar se usuário está alocado no evento
  const allocationResult = await pool.query(
    'SELECT id, status FROM team_allocations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  // Se o usuário já está confirmado na alocação, não permitir confirmação de interesse
  if (allocationResult.rows.length > 0 && allocationResult.rows[0].status === 'confirmed') {
    throw createError('Usuário já está confirmado para este evento. Não é necessário confirmar interesse.', 400);
  }

  // Se o usuário não está alocado, permitir confirmação de interesse
  // Se estiver alocado mas não confirmado, também permitir confirmação de interesse

  // Criar confirmação de interesse
  const confirmationResult = await pool.query(`
    INSERT INTO event_interest_confirmations (
      event_id, user_id, status, created_at, updated_at
    ) VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `, [id, userId]);

  const confirmation = confirmationResult.rows[0];

  // Criar notificação para o administrador
  const adminUsers = await pool.query(
    "SELECT id FROM users WHERE role = 'gestor'"
  );

  // Buscar nome do usuário freelancer
  const userResult = await pool.query(
    'SELECT name FROM users WHERE id = $1',
    [userId]
  );

  const userName = userResult.rows[0]?.name || 'Freelancer';

  for (const admin of adminUsers.rows) {
    await pool.query(`
      INSERT INTO notifications (
        user_id, title, message, type, related_event_id, priority, action_required, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [
      admin.id,
      'Novo Interesse Confirmado',
      `O freelancer ${userName} confirmou interesse no evento "${eventResult.rows[0].title}"`,
      'allocation',
      id,
      'medium',
      true
    ]);
  }

  res.status(201).json({
    message: 'Interesse confirmado com sucesso',
    confirmation
  });
}));

// Verificar status de interesse em evento
router.get('/:id/interest-status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar se usuário está autenticado
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  // Buscar confirmação de interesse
  const result = await pool.query(
    'SELECT * FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw createError('Confirmação de interesse não encontrada', 404);
  }

  res.json({
    confirmation: result.rows[0]
  });
}));

// Cancelar interesse em evento
router.delete('/:id/cancel-interest', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Verificar se usuário é freelancer
  if (userRole !== 'freelancer') {
    throw createError('Apenas freelancers podem cancelar interesse em eventos', 403);
  }

  // Verificar se confirmação de interesse existe
  const existingInterest = await pool.query(
    'SELECT id FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existingInterest.rows.length === 0) {
    throw createError('Confirmação de interesse não encontrada', 404);
  }

  // Deletar confirmação de interesse
  await pool.query(
    'DELETE FROM event_interest_confirmations WHERE event_id = $1 AND user_id = $2',
    [id, userId]
  );

  res.json({
    message: 'Interesse cancelado com sucesso'
  });
}));

export { router as eventRoutes };





