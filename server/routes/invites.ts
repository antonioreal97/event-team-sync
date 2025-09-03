import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Listar convites (apenas gestores)
router.get('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT 
      fi.*,
      u.name as invited_by_name
    FROM freelancer_invites fi
    LEFT JOIN users u ON fi.invited_by = u.id
    ORDER BY fi.created_at DESC
  `);

  res.json({
    invites: result.rows
  });
}));

// Enviar convite para freelancer (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { email, teamType } = req.body;

  if (!email || !teamType) {
    throw createError('Email e tipo de equipe são obrigatórios', 400);
  }

  if (!['equipe_a', 'equipe_b'].includes(teamType)) {
    throw createError('Tipo de equipe inválido', 400);
  }

  // Verificar se email já está cadastrado
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw createError('Email já está cadastrado no sistema', 409);
  }

  // Verificar se já existe convite pendente para este email
  const existingInvite = await pool.query(
    'SELECT id FROM freelancer_invites WHERE email = $1 AND status = $2',
    [email.toLowerCase(), 'pending']
  );

  if (existingInvite.rows.length > 0) {
    throw createError('Já existe um convite pendente para este email', 409);
  }

  // Gerar token único
  const inviteToken = uuidv4();
  
  // Definir data de expiração (7 dias)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Inserir convite
  const result = await pool.query(`
    INSERT INTO freelancer_invites (
      email, invited_by, team_type, invite_token, expires_at
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    email.toLowerCase(), req.user?.id, teamType, inviteToken, expiresAt
  ]);

  // TODO: Enviar email com link de convite
  // Por enquanto, retornar o token para teste
  res.status(201).json({
    message: 'Convite enviado com sucesso',
    invite: {
      ...result.rows[0],
      inviteUrl: `${process.env.APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`
    }
  });
}));

// Verificar convite por token
router.get('/verify/:token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const result = await pool.query(`
    SELECT 
      fi.*,
      u.name as invited_by_name
    FROM freelancer_invites fi
    LEFT JOIN users u ON fi.invited_by = u.id
    WHERE fi.invite_token = $1
  `, [token]);

  if (result.rows.length === 0) {
    throw createError('Convite não encontrado', 404);
  }

  const invite = result.rows[0];

  // Verificar se expirou
  if (new Date() > new Date(invite.expires_at)) {
    throw createError('Convite expirado', 410);
  }

  // Verificar se já foi aceito
  if (invite.status === 'accepted') {
    throw createError('Convite já foi aceito', 409);
  }

  res.json({
    invite: {
      id: invite.id,
      email: invite.email,
      teamType: invite.team_type,
      invitedByName: invite.invited_by_name,
      expiresAt: invite.expires_at
    }
  });
}));

// Aceitar convite
router.post('/accept/:token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { name, password } = req.body;

  if (!name || !password) {
    throw createError('Nome e senha são obrigatórios', 400);
  }

  // Verificar convite
  const inviteResult = await pool.query(`
    SELECT * FROM freelancer_invites 
    WHERE invite_token = $1 AND status = 'pending'
  `, [token]);

  if (inviteResult.rows.length === 0) {
    throw createError('Convite inválido ou já utilizado', 404);
  }

  const invite = inviteResult.rows[0];

  // Verificar se expirou
  if (new Date() > new Date(invite.expires_at)) {
    throw createError('Convite expirado', 410);
  }

  // Hash da senha
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Inserir usuário
  const userResult = await pool.query(`
    INSERT INTO users (name, email, password_hash, role) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id, name, email, role
  `, [name, invite.email, passwordHash, 'freelancer']);

  const newUser = userResult.rows[0];

  // Criar perfil de freelancer
  await pool.query(`
    INSERT INTO freelancer_profiles (user_id, team_type) 
    VALUES ($1, $2)
  `, [newUser.id, invite.team_type]);

  // Marcar convite como aceito
  await pool.query(`
    UPDATE freelancer_invites 
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [invite.id]);

  res.json({
    message: 'Convite aceito com sucesso',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      teamType: invite.team_type
    }
  });
}));

// Cancelar convite (apenas gestores)
router.delete('/:id', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    'DELETE FROM freelancer_invites WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw createError('Convite não encontrado', 404);
  }

  res.json({
    message: 'Convite cancelado com sucesso'
  });
}));

export { router as inviteRoutes };






