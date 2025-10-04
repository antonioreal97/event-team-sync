import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authRoutes } from '../auth'
import { pool } from '../../config/database'
import { errorHandler } from '../../middleware/errorHandler'

// Mock do pool de conexão do banco
vi.mock('../../config/database', () => ({
  pool: {
    query: vi.fn()
  }
}))

// Mock do bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  },
  compare: vi.fn(),
  hash: vi.fn()
}))

// Mock do jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'JsonWebTokenError'
      }
    },
    TokenExpiredError: class TokenExpiredError extends Error {
      constructor(message: string, expiredAt: Date) {
        super(message)
        this.name = 'TokenExpiredError'
        this.expiredAt = expiredAt
      }
    }
  },
  sign: vi.fn(),
  verify: vi.fn(),
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'JsonWebTokenError'
    }
  },
  TokenExpiredError: class TokenExpiredError extends Error {
    constructor(message: string, expiredAt: Date) {
      super(message)
      this.name = 'TokenExpiredError'
      this.expiredAt = expiredAt
    }
  }
}))

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)
app.use(errorHandler)

describe.skip('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        role: 'gestor',
        name: 'Test User',
        is_active: true
      }

      ;(pool.query as any)
        .mockResolvedValueOnce({ rows: [mockUser] }) // Busca do usuário
        .mockResolvedValueOnce({ rows: [] }) // Busca do perfil de freelancer

      ;(bcrypt.compare as any).mockResolvedValue(true)
      ;(jwt.sign as any).mockReturnValue('mock-jwt-token')

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        message: 'Login realizado com sucesso',
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test User',
          role: 'gestor',
          profile: null
        }
      })
    })

    it('deve retornar erro 400 quando email ou senha não são fornecidos', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com'
          // password ausente
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toBe('Email e senha são obrigatórios')
    })

    it('deve retornar erro 401 quando usuário não existe', async () => {
      (pool.query as any).mockResolvedValue({ rows: [] })

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Credenciais inválidas')
    })

    it('deve retornar erro 401 quando usuário está inativo', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        role: 'gestor',
        name: 'Test User',
        is_active: false
      }

      (pool.query as any).mockResolvedValue({ rows: [mockUser] })

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Usuário inativo')
    })

    it('deve retornar erro 401 quando senha está incorreta', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        role: 'gestor',
        name: 'Test User',
        is_active: true
      }

      (pool.query as any).mockResolvedValue({ rows: [mockUser] })
      (bcrypt.compare as any).mockResolvedValue(false)

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrong-password'
        })

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Credenciais inválidas')
    })

    it('deve incluir perfil de freelancer quando role for freelancer', async () => {
      const mockUser = {
        id: '1',
        email: 'freelancer@test.com',
        password_hash: 'hashed-password',
        role: 'freelancer',
        name: 'Freelancer User',
        is_active: true
      }

      const mockProfile = {
        id: '1',
        user_id: '1',
        team_type: 'equipe_a',
        experience_level: 'intermediario',
        audio_visual_roles: ['camera', 'audio']
      }

      (pool.query as any)
        .mockResolvedValueOnce({ rows: [mockUser] }) // Busca do usuário
        .mockResolvedValueOnce({ rows: [mockProfile] }) // Busca do perfil

      (bcrypt.compare as any).mockResolvedValue(true)
      (jwt.sign as any).mockReturnValue('mock-jwt-token')

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'freelancer@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.user.profile).toEqual(mockProfile)
    })

    it('deve retornar erro 500 quando JWT_SECRET não está configurado', async () => {
      delete process.env.JWT_SECRET

      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password_hash: 'hashed-password',
        role: 'gestor',
        name: 'Test User',
        is_active: true
      }

      (pool.query as any).mockResolvedValue({ rows: [mockUser] })
      (bcrypt.compare as any).mockResolvedValue(true)

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(500)
      expect(response.body.error.message).toBe('Erro de configuração do servidor')
    })
  })

  describe('POST /auth/register', () => {
    it('deve registrar gestor com sucesso', async () => {
      (pool.query as any)
        .mockResolvedValueOnce({ rows: [] }) // Verificação de email existente
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: '1', 
            name: 'Test Gestor', 
            email: 'gestor@test.com', 
            role: 'gestor' 
          }] 
        }) // Inserção do usuário

      (bcrypt.hash as any).mockResolvedValue('hashed-password')

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test Gestor',
          email: 'gestor@test.com',
          password: 'password123',
          role: 'gestor'
        })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        message: 'Usuário registrado com sucesso',
        user: {
          id: '1',
          name: 'Test Gestor',
          email: 'gestor@test.com',
          role: 'gestor'
        }
      })
    })

    it('deve registrar freelancer com perfil com sucesso', async () => {
      (pool.query as any)
        .mockResolvedValueOnce({ rows: [] }) // Verificação de email existente
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: '1', 
            name: 'Test Freelancer', 
            email: 'freelancer@test.com', 
            role: 'freelancer' 
          }] 
        }) // Inserção do usuário
        .mockResolvedValueOnce({ rows: [] }) // Inserção do perfil

      (bcrypt.hash as any).mockResolvedValue('hashed-password')

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test Freelancer',
          email: 'freelancer@test.com',
          password: 'password123',
          role: 'freelancer',
          teamType: 'equipe_a',
          phone: '11999999999',
          experienceLevel: 'intermediario',
          audioVisualRoles: ['camera', 'audio']
        })

      expect(response.status).toBe(201)
      expect(response.body.user.role).toBe('freelancer')
    })

    it('deve retornar erro 400 quando dados obrigatórios não são fornecidos', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User'
          // email, password e role ausentes
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toBe('Dados obrigatórios não fornecidos')
    })

    it('deve retornar erro 400 quando role é inválido', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123',
          role: 'invalid-role'
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toBe('Role inválido')
    })

    it('deve retornar erro 400 quando freelancer não tem teamType', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test Freelancer',
          email: 'freelancer@test.com',
          password: 'password123',
          role: 'freelancer'
          // teamType ausente
        })

      expect(response.status).toBe(400)
      expect(response.body.error.message).toBe('Tipo de equipe é obrigatório para freelancers')
    })

    it('deve retornar erro 409 quando email já existe', async () => {
      (pool.query as any).mockResolvedValue({ 
        rows: [{ id: '1' }] // Email já existe
      })

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'existing@test.com',
          password: 'password123',
          role: 'gestor'
        })

      expect(response.status).toBe(409)
      expect(response.body.error.message).toBe('Email já cadastrado')
    })
  })

  describe('GET /auth/verify', () => {
    it('deve verificar token válido com sucesso', async () => {
      const mockDecoded = {
        userId: '1',
        email: 'test@test.com',
        role: 'gestor'
      }

      const mockUser = {
        id: '1',
        email: 'test@test.com',
        role: 'gestor',
        name: 'Test User',
        is_active: true
      }

      (jwt.verify as any).mockReturnValue(mockDecoded)
      (pool.query as any).mockResolvedValue({ rows: [mockUser] })

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        valid: true,
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test User',
          role: 'gestor'
        }
      })
    })

    it('deve retornar erro 401 quando token não é fornecido', async () => {
      const response = await request(app)
        .get('/auth/verify')

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Token não fornecido')
    })

    it('deve retornar erro 500 quando JWT_SECRET não está configurado', async () => {
      delete process.env.JWT_SECRET

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(500)
      expect(response.body.error.message).toBe('Erro de configuração do servidor')
    })

    it('deve retornar erro 401 quando usuário não é encontrado', async () => {
      const mockDecoded = {
        userId: '999',
        email: 'test@test.com',
        role: 'gestor'
      }

      (jwt.verify as any).mockReturnValue(mockDecoded)
      (pool.query as any).mockResolvedValue({ rows: [] })

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Usuário não encontrado')
    })

    it('deve retornar erro 401 quando usuário está inativo', async () => {
      const mockDecoded = {
        userId: '1',
        email: 'test@test.com',
        role: 'gestor'
      }

      const mockUser = {
        id: '1',
        email: 'test@test.com',
        role: 'gestor',
        name: 'Test User',
        is_active: false
      }

      (jwt.verify as any).mockReturnValue(mockDecoded)
      (pool.query as any).mockResolvedValue({ rows: [mockUser] })

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Usuário inativo')
    })

    it('deve retornar erro 403 quando token é inválido', async () => {
      const jwtError = new jwt.JsonWebTokenError('invalid token')
      (jwt.verify as any).mockImplementation(() => {
        throw jwtError
      })

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(403)
      expect(response.body.error.message).toBe('Token inválido')
    })

    it('deve retornar erro 401 quando token está expirado', async () => {
      const jwtError = new jwt.TokenExpiredError('token expired', new Date())
      (jwt.verify as any).mockImplementation(() => {
        throw jwtError
      })

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer expired-token')

      expect(response.status).toBe(401)
      expect(response.body.error.message).toBe('Token expirado')
    })
  })
})
