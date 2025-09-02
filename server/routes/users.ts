import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor, requireFreelancer } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import * as bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Listar todos os usuários (apenas gestores)
router.get('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT 
      u.id, u.name, u.email, u.role, u.is_active, u.created_at,
      fp.team_type, fp.phone, fp.city, fp.state, fp.experience_level,
      fp.audio_visual_roles, fp.total_events_attended, fp.total_earnings
    FROM users u
    LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE u.role = 'freelancer'
    ORDER BY u.name
  `);

  res.json({
    users: result.rows
  });
}));

// Buscar usuário por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Usuários só podem ver seus próprios dados, gestores podem ver todos
  if (req.user?.role !== 'gestor' && userId !== id) {
    throw createError('Acesso negado', 403);
  }

  const result = await pool.query(`
    SELECT 
      u.id, u.name, u.email, u.role, u.is_active, u.created_at,
      fp.team_type, fp.phone, fp.address, fp.city, fp.state, fp.cpf,
      fp.hourly_rate, fp.daily_rate, fp.experience_level,
      fp.audio_visual_roles, fp.bio, fp.portfolio, fp.linkedin,
      fp.instagram, fp.website, fp.previous_experience, fp.certifications,
      fp.equipment, fp.languages, fp.total_events_attended, 
      fp.total_earnings, fp.average_rating
    FROM users u
    LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
    WHERE u.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw createError('Usuário não encontrado', 404);
  }

  res.json({
    user: result.rows[0]
  });
}));

// Buscar perfil do usuário atual
router.get('/profile/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const result = await pool.query(`
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
    WHERE u.id = $1
  `, [userId]);

  if (result.rows.length === 0) {
    throw createError('Usuário não encontrado', 404);
  }

  res.json({
    user: result.rows[0]
  });
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
    languages
  } = req.body;

  // Validações
  if (!name || !name.trim()) {
    throw createError('Nome é obrigatório', 400);
  }
  
  if (name.trim().length < 2) {
    throw createError('Nome deve ter pelo menos 2 caracteres', 400);
  }
  
  if (name.trim().length > 255) {
    throw createError('Nome deve ter no máximo 255 caracteres', 400);
  }
  
  // Validar se o nome não contém caracteres especiais inválidos
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
    throw createError('Nome deve conter apenas letras e espaços', 400);
  }
  
  // Validar se o nome não contém números
  if (/\d/.test(name.trim())) {
    throw createError('Nome não pode conter números', 400);
  }
  
  // Validar se o nome não contém caracteres especiais
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
    throw createError('Nome deve conter apenas letras e espaços', 400);
  }
  
  if (!email || !email.trim()) {
    throw createError('Email é obrigatório', 400);
  }
  
  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw createError('Formato de email inválido', 400);
  }
  
  if (email.trim().length > 255) {
    throw createError('Email deve ter no máximo 255 caracteres', 400);
  }
  
  // Validar se o email não contém espaços
  if (email.includes(' ')) {
    throw createError('Email não pode conter espaços', 400);
  }
  
  // Validar se o email não contém caracteres especiais
  if (!/^[a-zA-Z0-9@._-]+$/.test(email.trim())) {
    throw createError('Email contém caracteres inválidos', 400);
  }
  
  if (!password || password.length < 6) {
    throw createError('Senha deve ter pelo menos 6 caracteres', 400);
  }
  
  if (password.length > 100) {
    throw createError('Senha deve ter no máximo 100 caracteres', 400);
  }
  
  // Validar se a senha não contém espaços
  if (password.includes(' ')) {
    throw createError('Senha não pode conter espaços', 400);
  }
  
  // Validar se a senha contém pelo menos uma letra e um número
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    throw createError('Senha deve conter pelo menos uma letra e um número', 400);
  }
  
  // Validar se a senha não contém caracteres especiais
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password)) {
    throw createError('Senha contém caracteres inválidos', 400);
  }
  
  if (!teamType) {
    throw createError('Tipo de equipe é obrigatório', 400);
  }
  
  if (!['equipe_a', 'equipe_b'].includes(teamType)) {
    throw createError('Tipo de equipe inválido. Deve ser "equipe_a" ou "equipe_b"', 400);
  }

  // Verificar se email já existe
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw createError('Email já cadastrado', 409);
  }

      // Verificar se CPF já existe (apenas se fornecido)
  if (cpf && cpf.trim()) {
    // Validar formato do CPF (apenas números)
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      throw createError('CPF deve conter 11 dígitos', 400);
    }
    
    // Validar se todos os dígitos não são iguais
    if (/^(\d)\1{10}$/.test(cpfClean)) {
      throw createError('CPF inválido', 400);
    }
    
    // Validar se o CPF não é muito longo
    if (cpf.trim().length > 14) {
      throw createError('CPF deve ter no máximo 14 caracteres', 400);
    }

    const existingCPF = await pool.query(
      'SELECT id FROM freelancer_profiles WHERE cpf = $1',
      [cpfClean]
    );

    if (existingCPF.rows.length > 0) {
      throw createError('CPF já cadastrado', 409);
    }
  }

  // Hash da senha
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Inserir usuário
  const userResult = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    [name, email.toLowerCase(), passwordHash, 'freelancer']
  );

  const newUser = userResult.rows[0];

  // Criar perfil de freelancer com campos opcionais
  const profileFields = ['user_id', 'team_type'];
  const profileValues = [newUser.id, teamType];
  let paramCount = 2;

  // Adicionar campos opcionais apenas se tiverem valor
  if (phone && phone.trim()) { 
    const phoneClean = phone.trim().replace(/\D/g, '');
    if (phoneClean.length >= 10 && phoneClean.length <= 11 && phone.trim().length <= 20) {
      profileFields.push('phone'); 
      profileValues.push(phoneClean); 
      paramCount++; 
    }
  }
  if (address && address.trim()) { 
    const addressClean = address.trim();
    if (addressClean.length >= 5 && addressClean.length <= 500) {
      profileFields.push('address'); 
      profileValues.push(addressClean); 
      paramCount++; 
    }
  }
  if (city && city.trim()) { 
    const cityClean = city.trim();
    if (cityClean.length >= 2 && cityClean.length <= 100) {
      profileFields.push('city'); 
      profileValues.push(cityClean); 
      paramCount++; 
    }
  }
  if (state && state.trim()) { 
    const stateClean = state.trim().toUpperCase();
    const validStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    if (stateClean.length === 2 && validStates.includes(stateClean)) {
      profileFields.push('state'); 
      profileValues.push(stateClean); 
      paramCount++; 
    }
  }
  if (cpf && cpf.trim()) { 
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length === 11) {
      profileFields.push('cpf'); 
      profileValues.push(cpfClean); 
      paramCount++; 
    }
  }
  if (experienceLevel && ['iniciante', 'intermediario', 'avancado', 'expert'].includes(experienceLevel)) { 
    profileFields.push('experience_level'); 
    profileValues.push(experienceLevel); 
    paramCount++; 
  }
  if (audioVisualRoles && audioVisualRoles.length > 0 && audioVisualRoles.some(role => role && role.trim())) { 
    const cleanRoles = audioVisualRoles.filter(role => role && role.trim()).map(role => role.trim());
    if (cleanRoles.length > 0 && cleanRoles.length <= 10) {
      profileFields.push('audio_visual_roles'); 
      profileValues.push(cleanRoles); 
      paramCount++; 
    }
  }
  if (bio && bio.trim()) { 
    const bioClean = bio.trim();
    if (bioClean.length >= 10 && bioClean.length <= 1000) {
      profileFields.push('bio'); 
      profileValues.push(bioClean); 
      paramCount++; 
    }
  }
  if (portfolio && portfolio.trim()) { 
    const portfolioUrl = portfolio.trim().startsWith('http') ? portfolio.trim() : `https://${portfolio.trim()}`;
    if (portfolioUrl.length <= 500) {
      profileFields.push('portfolio'); 
      profileValues.push(portfolioUrl); 
      paramCount++; 
    }
  }
  if (linkedin && linkedin.trim()) { 
    const linkedinUrl = linkedin.trim().startsWith('http') ? linkedin.trim() : `https://${linkedin.trim()}`;
    if (linkedinUrl.length <= 500) {
      profileFields.push('linkedin'); 
      profileValues.push(linkedinUrl); 
      paramCount++; 
    }
  }
  if (instagram && instagram.trim()) { 
    const instagramClean = instagram.trim().startsWith('@') ? instagram.trim() : `@${instagram.trim()}`;
    if (instagramClean.length <= 100) {
      profileFields.push('instagram'); 
      profileValues.push(instagramClean); 
      paramCount++; 
    }
  }
  if (website && website.trim()) { 
    const websiteUrl = website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`;
    if (websiteUrl.length <= 500) {
      profileFields.push('website'); 
      profileValues.push(websiteUrl); 
      paramCount++; 
    }
  }
  if (previousExperience && previousExperience.trim()) { 
    const experienceClean = previousExperience.trim();
    if (experienceClean.length >= 10 && experienceClean.length <= 2000) {
      profileFields.push('previous_experience'); 
      profileValues.push(experienceClean); 
      paramCount++; 
    }
  }
  if (certifications && certifications.length > 0 && certifications.some(c => c && c.trim())) { 
    const cleanCertifications = certifications.filter(c => c && c.trim()).map(c => c.trim());
    if (cleanCertifications.length > 0 && cleanCertifications.length <= 20) {
      profileFields.push('certifications'); 
      profileValues.push(cleanCertifications); 
      paramCount++; 
    }
  }
  if (equipment && equipment.length > 0 && equipment.some(e => e && e.trim())) { 
    const cleanEquipment = equipment.filter(e => e && e.trim()).map(e => e.trim());
    if (cleanEquipment.length > 0 && cleanEquipment.length <= 20) {
      profileFields.push('equipment'); 
      profileValues.push(cleanEquipment); 
      paramCount++; 
    }
  }
  if (languages && languages.length > 0 && languages.some(l => l && l.trim())) { 
    const cleanLanguages = languages.filter(l => l && l.trim()).map(l => l.trim());
    if (cleanLanguages.length > 0 && cleanLanguages.length <= 10) {
      profileFields.push('languages'); 
      profileValues.push(cleanLanguages); 
      paramCount++; 
    }
  }

  // Construir a query dinamicamente
  const placeholders = profileValues.map((_, index) => `$${index + 1}`).join(', ');
  
  await pool.query(`
    INSERT INTO freelancer_profiles (${profileFields.join(', ')})
    VALUES (${placeholders})
    RETURNING id
  `, profileValues);

  res.status(201).json({
    message: 'Freelancer cadastrado com sucesso',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      teamType
    }
  });
}));

// Atualizar usuário
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Usuários só podem atualizar seus próprios dados, gestores podem atualizar todos
  if (req.user?.role !== 'gestor' && userId !== id) {
    throw createError('Acesso negado', 403);
  }

  const {
    name,
    phone,
    address,
    city,
    state,
    bio,
    portfolio,
    linkedin,
    instagram,
    website,
    previousExperience,
    certifications,
    equipment,
    languages,
    teamType // Capturar se for enviado
  } = req.body;

  // Freelancers não podem alterar o tipo de equipe
  if (req.user?.role === 'freelancer' && teamType !== undefined) {
    throw createError('Freelancers não podem alterar seu tipo de equipe', 403);
  }

  // Atualizar dados básicos
  if (name) {
    await pool.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [name, id]
    );
  }

  // Atualizar perfil de freelancer se existir
  const profileResult = await pool.query(
    'SELECT id FROM freelancer_profiles WHERE user_id = $1',
    [id]
  );

  if (profileResult.rows.length > 0) {
    // Campos que freelancers podem alterar
    const updateFields = [
      phone, address, city, state, bio, portfolio, linkedin,
      instagram, website, previousExperience, certifications,
      equipment, languages
    ];

    // Se for gestor, permitir alteração de teamType
    if (req.user?.role === 'gestor' && teamType !== undefined) {
      updateFields.push(teamType);
    }

    await pool.query(`
      UPDATE freelancer_profiles SET
        phone = COALESCE($1, phone),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        bio = COALESCE($5, bio),
        portfolio = COALESCE($6, portfolio),
        linkedin = COALESCE($7, linkedin),
        instagram = COALESCE($8, instagram),
        website = COALESCE($9, website),
        previous_experience = COALESCE($10, previous_experience),
        certifications = COALESCE($11, certifications),
        equipment = COALESCE($12, equipment),
        languages = COALESCE($13, languages),
        ${req.user?.role === 'gestor' && teamType !== undefined ? 'team_type = COALESCE($14, team_type),' : ''}
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${req.user?.role === 'gestor' && teamType !== undefined ? '$15' : '$14'}
    `, updateFields);
  }

  res.json({
    message: 'Usuário atualizado com sucesso'
  });
}));

// Atualizar tipo de equipe (apenas gestores)
router.patch('/:id/team', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { teamType } = req.body;

  if (!['equipe_a', 'equipe_b', 'sem_equipe'].includes(teamType)) {
    throw createError('Tipo de equipe inválido', 400);
  }

  await pool.query(
    'UPDATE freelancer_profiles SET team_type = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [teamType, id]
  );

  res.json({
    message: 'Tipo de equipe atualizado com sucesso',
    teamType
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

  res.json({
    message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
    isActive
  });
}));

export { router as userRoutes };
