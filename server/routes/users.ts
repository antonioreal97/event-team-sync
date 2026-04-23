import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { authenticateToken, requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  isCanonicalTeamType,
  normalizeNullableTeamType,
  normalizeTeamType,
  normalizeUserRow,
  type CanonicalTeamType,
} from '../utils/teamDomain';
import { recordTeamAssignment } from '../utils/teamAssignments';

const router = Router();

const USER_SELECT = `
  SELECT
    u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.updated_at,
    fp.team_type, fp.phone, fp.address, fp.city, fp.state, fp.cpf,
    fp.hourly_rate, fp.daily_rate, fp.experience_level,
    fp.audio_visual_roles, fp.bio, fp.portfolio, fp.linkedin,
    fp.instagram, fp.website, fp.previous_experience, fp.certifications,
    fp.equipment, fp.languages, fp.total_events_attended,
    fp.total_earnings, fp.average_rating
  FROM users u
  LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
`;

const VALID_STATES = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]);

function sanitizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function sanitizeOptionalPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return null;
  return digits;
}

function sanitizeOptionalCpf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return null;
  if (/^(\d)\1{10}$/.test(digits)) return null;
  return digits;
}

function sanitizeOptionalState(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  if (!VALID_STATES.has(trimmed)) return null;
  return trimmed;
}

function sanitizeOptionalUrl(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  return normalized.slice(0, maxLength);
}

function sanitizeOptionalInstagram(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
  return normalized.slice(0, 100);
}

function sanitizeStringArray(value: unknown, maxItems: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, maxItems);
  return normalized;
}

async function fetchUserDetails(userId: string): Promise<Record<string, unknown>> {
  const result = await pool.query(`${USER_SELECT} WHERE u.id = $1`, [userId]);
  if (result.rows.length === 0) {
    throw createError('Usuário não encontrado', 404);
  }
  return normalizeUserRow(result.rows[0]);
}

async function fetchCurrentTeamType(userId: string): Promise<CanonicalTeamType | null> {
  const result = await pool.query(
    'SELECT team_type FROM freelancer_profiles WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return normalizeTeamType(result.rows[0].team_type);
}

function validateName(name: unknown): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw createError('Nome é obrigatório', 400);
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw createError('Nome deve ter pelo menos 2 caracteres', 400);
  }
  if (trimmed.length > 255) {
    throw createError('Nome deve ter no máximo 255 caracteres', 400);
  }
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
    throw createError('Nome deve conter apenas letras e espaços', 400);
  }
  return trimmed;
}

function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !email.trim()) {
    throw createError('Email é obrigatório', 400);
  }
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw createError('Formato de email inválido', 400);
  }
  if (trimmed.length > 255) {
    throw createError('Email deve ter no máximo 255 caracteres', 400);
  }
  if (trimmed.includes(' ')) {
    throw createError('Email não pode conter espaços', 400);
  }
  if (!/^[a-zA-Z0-9@._-]+$/.test(trimmed)) {
    throw createError('Email contém caracteres inválidos', 400);
  }
  return trimmed;
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 6) {
    throw createError('Senha deve ter pelo menos 6 caracteres', 400);
  }
  if (password.length > 100) {
    throw createError('Senha deve ter no máximo 100 caracteres', 400);
  }
  if (password.includes(' ')) {
    throw createError('Senha não pode conter espaços', 400);
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    throw createError('Senha deve conter pelo menos uma letra e um número', 400);
  }
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/.test(password)) {
    throw createError('Senha contém caracteres inválidos', 400);
  }
  return password;
}

async function updateProfileFields(userId: string, body: Record<string, unknown>): Promise<void> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const push = (column: string, value: unknown) => {
    assignments.push(`${column} = $${values.length + 1}`);
    values.push(value);
  };

  if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
    push('phone', sanitizeOptionalPhone(body.phone));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'address')) {
    push('address', sanitizeOptionalText(body.address, 500));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'city')) {
    push('city', sanitizeOptionalText(body.city, 100));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'state')) {
    push('state', sanitizeOptionalState(body.state));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'cpf')) {
    const cpf = body.cpf == null || body.cpf === '' ? null : sanitizeOptionalCpf(body.cpf);
    if (body.cpf && !cpf) {
      throw createError('CPF deve conter 11 dígitos válidos', 400);
    }
    if (cpf) {
      const existingCpf = await pool.query(
        'SELECT user_id FROM freelancer_profiles WHERE cpf = $1 AND user_id <> $2',
        [cpf, userId]
      );
      if (existingCpf.rows.length > 0) {
        throw createError('CPF já cadastrado', 409);
      }
    }
    push('cpf', cpf);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'experienceLevel')) {
    const value = body.experienceLevel;
    if (
      value != null
      && value !== ''
      && !['iniciante', 'intermediario', 'avancado', 'expert'].includes(String(value))
    ) {
      throw createError('Nível de experiência inválido', 400);
    }
    push('experience_level', value || null);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'audioVisualRoles')) {
    push('audio_visual_roles', sanitizeStringArray(body.audioVisualRoles, 10));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
    push('bio', sanitizeOptionalText(body.bio, 1000));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'portfolio')) {
    push('portfolio', sanitizeOptionalUrl(body.portfolio, 500));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'linkedin')) {
    push('linkedin', sanitizeOptionalUrl(body.linkedin, 500));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'instagram')) {
    push('instagram', sanitizeOptionalInstagram(body.instagram));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'website')) {
    push('website', sanitizeOptionalUrl(body.website, 500));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'previousExperience')) {
    push('previous_experience', sanitizeOptionalText(body.previousExperience, 2000));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'certifications')) {
    push('certifications', sanitizeStringArray(body.certifications, 20));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'equipment')) {
    push('equipment', sanitizeStringArray(body.equipment, 20));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'languages')) {
    push('languages', sanitizeStringArray(body.languages, 10));
  }

  if (assignments.length === 0) return;

  values.push(userId);
  await pool.query(
    `
    UPDATE freelancer_profiles
    SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $${values.length}
  `,
    values
  );
}

// Listar todos os usuários (apenas gestores)
router.get('/', requireGestor, asyncHandler(async (_req: Request, res: Response) => {
  const result = await pool.query(`
    ${USER_SELECT}
    WHERE u.role IN ('freelancer', 'lider_freelancer')
    ORDER BY u.name
  `);

  res.json({
    users: result.rows.map(normalizeUserRow),
  });
}));

// Buscar perfil do usuário atual
router.get('/profile/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const user = await fetchUserDetails(userId);
  res.json({ user });
}));

// Buscar usuário por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (req.user?.role !== 'gestor' && userId !== id) {
    throw createError('Acesso negado', 403);
  }

  const user = await fetchUserDetails(id);
  res.json({ user });
}));

// Cadastrar novo freelancer (apenas gestores)
router.post('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    teamType,
    phone,
    address,
    city,
    state,
    cpf,
    experienceLevel,
    audioVisualRoles,
    bio,
    portfolio,
    linkedin,
    instagram,
    website,
    previousExperience,
    certifications,
    equipment,
    languages,
  } = req.body;

  const validatedName = validateName(name);
  const validatedEmail = validateEmail(email);
  const validatedPassword = validatePassword(password);
  const normalizedTeamType = normalizeNullableTeamType(teamType);

  if (!normalizedTeamType || !isCanonicalTeamType(normalizedTeamType)) {
    throw createError(
      'Tipo de equipe inválido. Use iniciante, intermediario, avancado ou sem_equipe',
      400
    );
  }

  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [validatedEmail]
  );

  if (existingUser.rows.length > 0) {
    throw createError('Email já cadastrado', 409);
  }

  const sanitizedCpf = cpf ? sanitizeOptionalCpf(cpf) : null;
  if (cpf && !sanitizedCpf) {
    throw createError('CPF deve conter 11 dígitos válidos', 400);
  }
  if (sanitizedCpf) {
    const existingCpf = await pool.query(
      'SELECT user_id FROM freelancer_profiles WHERE cpf = $1',
      [sanitizedCpf]
    );
    if (existingCpf.rows.length > 0) {
      throw createError('CPF já cadastrado', 409);
    }
  }

  const passwordHash = await bcrypt.hash(validatedPassword, 12);

  const userResult = await pool.query(
    `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `,
    [validatedName, validatedEmail, passwordHash, 'freelancer']
  );

  const userId = userResult.rows[0].id as string;

  await pool.query(
    `
    INSERT INTO freelancer_profiles (
      user_id, team_type, phone, address, city, state, cpf,
      experience_level, audio_visual_roles, bio, portfolio, linkedin,
      instagram, website, previous_experience, certifications, equipment, languages
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18
    )
  `,
    [
      userId,
      normalizedTeamType,
      sanitizeOptionalPhone(phone),
      sanitizeOptionalText(address, 500),
      sanitizeOptionalText(city, 100),
      sanitizeOptionalState(state),
      sanitizedCpf,
      experienceLevel && ['iniciante', 'intermediario', 'avancado', 'expert'].includes(String(experienceLevel))
        ? experienceLevel
        : null,
      sanitizeStringArray(audioVisualRoles, 10),
      sanitizeOptionalText(bio, 1000),
      sanitizeOptionalUrl(portfolio, 500),
      sanitizeOptionalUrl(linkedin, 500),
      sanitizeOptionalInstagram(instagram),
      sanitizeOptionalUrl(website, 500),
      sanitizeOptionalText(previousExperience, 2000),
      sanitizeStringArray(certifications, 20),
      sanitizeStringArray(equipment, 20),
      sanitizeStringArray(languages, 10),
    ]
  );

  await recordTeamAssignment({
    userId,
    fromTeamType: null,
    toTeamType: normalizedTeamType,
    changedBy: req.user?.id,
    notes: 'Cadastro inicial do freelancer',
  });

  const user = await fetchUserDetails(userId);

  res.status(201).json({
    message: 'Freelancer cadastrado com sucesso',
    user,
  });
}));

// Atualizar usuário
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorId = req.user?.id;
  const actorRole = req.user?.role;

  if (actorRole !== 'gestor' && actorId !== id) {
    throw createError('Acesso negado', 403);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    const validatedName = validateName(req.body.name);
    await pool.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [validatedName, id]
    );
  }

  if (actorRole === 'gestor' && Object.prototype.hasOwnProperty.call(req.body, 'isActive')) {
    if (typeof req.body.isActive !== 'boolean') {
      throw createError('Status deve ser um valor booleano', 400);
    }
    await pool.query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [req.body.isActive, id]
    );
  }

  const currentTeamType = await fetchCurrentTeamType(id);
  let nextTeamType = currentTeamType;

  if (Object.prototype.hasOwnProperty.call(req.body, 'teamType')) {
    if (actorRole !== 'gestor') {
      throw createError('Freelancers não podem alterar seu tipo de equipe', 403);
    }

    const normalizedTeamType = normalizeNullableTeamType(req.body.teamType);
    if (!normalizedTeamType || !isCanonicalTeamType(normalizedTeamType)) {
      throw createError(
        'Tipo de equipe inválido. Use iniciante, intermediario, avancado ou sem_equipe',
        400
      );
    }

    nextTeamType = normalizedTeamType;
    await pool.query(
      `
      UPDATE freelancer_profiles
      SET team_type = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `,
      [normalizedTeamType, id]
    );
  }

  await updateProfileFields(id, req.body as Record<string, unknown>);

  if (actorRole === 'gestor' && currentTeamType !== nextTeamType && nextTeamType) {
    await recordTeamAssignment({
      userId: id,
      fromTeamType: currentTeamType,
      toTeamType: nextTeamType,
      changedBy: actorId,
      notes: typeof req.body.notes === 'string' ? req.body.notes : null,
    });
  }

  const user = await fetchUserDetails(id);

  res.json({
    message: 'Usuário atualizado com sucesso',
    user,
  });
}));

// Atualizar tipo de equipe (apenas gestores)
router.patch('/:id/team', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const normalizedTeamType = normalizeNullableTeamType(req.body.teamType);

  if (!normalizedTeamType || !isCanonicalTeamType(normalizedTeamType)) {
    throw createError(
      'Tipo de equipe inválido. Use iniciante, intermediario, avancado ou sem_equipe',
      400
    );
  }

  const currentTeamType = await fetchCurrentTeamType(id);

  await pool.query(
    'UPDATE freelancer_profiles SET team_type = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [normalizedTeamType, id]
  );

  const assignment = currentTeamType !== normalizedTeamType
    ? await recordTeamAssignment({
        userId: id,
        fromTeamType: currentTeamType,
        toTeamType: normalizedTeamType,
        changedBy: req.user?.id,
        notes: typeof req.body.notes === 'string' ? req.body.notes : null,
      })
    : null;

  const user = await fetchUserDetails(id);

  res.json({
    message: 'Tipo de equipe atualizado com sucesso',
    teamType: normalizedTeamType,
    assignment,
    user,
  });
}));

// Desativar/ativar usuário (apenas gestores)
router.patch('/:id/status', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw createError('Status deve ser um valor booleano', 400);
  }

  await pool.query(
    'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [isActive, id]
  );

  const user = await fetchUserDetails(id);

  res.json({
    message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
    isActive,
    user,
  });
}));

export { router as userRoutes };
