import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email e senha são obrigatórios', 400);
  }

  // Buscar usuário
  const result = await pool.query(
    'SELECT id, email, password_hash, role, name, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw createError('Credenciais inválidas', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw createError('Usuário inativo', 401);
  }

  // Verificar senha
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError('Credenciais inválidas', 401);
  }

  // Gerar token JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError('Erro de configuração do servidor', 500);
  }

  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    secret,
    { expiresIn: '24h' }
  );

  // Buscar perfil de freelancer se aplicável
  let freelancerProfile = null;
  if (user.role === 'freelancer') {
    const profileResult = await pool.query(
      'SELECT * FROM freelancer_profiles WHERE user_id = $1',
      [user.id]
    );
    if (profileResult.rows.length > 0) {
      freelancerProfile = profileResult.rows[0];
    }
  }

  res.json({
    message: 'Login realizado com sucesso',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: freelancerProfile
    }
  });
}));

// Registrar novo usuário (apenas gestores podem registrar freelancers)
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    teamType,
    phone,
    address,
    city,
    state,
    cpf,
    experienceLevel,
    audioVisualRoles,
    bio
  } = req.body;

  // Validações básicas
  if (!name || !email || !password || !role) {
    throw createError('Dados obrigatórios não fornecidos', 400);
  }

  if (role !== 'gestor' && role !== 'freelancer') {
    throw createError('Role inválido', 400);
  }

  if (role === 'freelancer' && !teamType) {
    throw createError('Tipo de equipe é obrigatório para freelancers', 400);
  }

  // Verificar se email já existe
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw createError('Email já cadastrado', 409);
  }

  // Hash da senha
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Inserir usuário
  const userResult = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    [name, email.toLowerCase(), passwordHash, role]
  );

  const newUser = userResult.rows[0];

  // Se for freelancer, criar perfil
  if (role === 'freelancer') {
    await pool.query(
      `INSERT INTO freelancer_profiles (
        user_id, team_type, phone, address, city, state, cpf, 
        experience_level, audio_visual_roles, bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newUser.id, teamType, phone, address, city, state, cpf,
        experienceLevel, audioVisualRoles, bio
      ]
    );
  }

  res.status(201).json({
    message: 'Usuário registrado com sucesso',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
}));

// Verificar token
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw createError('Token não fornecido', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError('Erro de configuração do servidor', 500);
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    
    // Buscar usuário atualizado
    const result = await pool.query(
      'SELECT id, email, role, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw createError('Usuário não encontrado', 401);
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      throw createError('Usuário inativo', 401);
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Token inválido', 403);
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      throw createError('Token expirado', 401);
    }

    throw error;
  }
}));

export { router as authRoutes };
