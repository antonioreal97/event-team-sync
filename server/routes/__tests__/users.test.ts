import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { userRoutes } from '../users';
import { errorHandler } from '../../middleware/errorHandler';
import { pool } from '../../config/database';
import { invalidateTeamAssignmentsCache } from '../../utils/teamAssignments';

vi.mock('../../config/database', () => ({
  pool: { query: vi.fn() },
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

const mockQuery = pool.query as ReturnType<typeof vi.fn>;
const mockHash = bcrypt.hash as ReturnType<typeof vi.fn>;

function mountUsersAsGestor() {
  const app = express();
  app.use(express.json());
  app.use('/users', (req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: 'gestor-1',
      email: 'gestor@test.com',
      role: 'gestor',
    };
    next();
  }, userRoutes);
  app.use(errorHandler);
  return app;
}

describe('User routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateTeamAssignmentsCache();
    mockHash.mockResolvedValue('hashed-password');
  });

  it('GET /users normaliza team_type legado na resposta da API', async () => {
    const app = mountUsersAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("WHERE u.role IN ('freelancer', 'lider_freelancer')")) {
        return {
          rows: [
            {
              id: 'user-1',
              name: 'Ana Freela',
              email: 'ana@test.com',
              role: 'freelancer',
              is_active: true,
              created_at: '2026-04-20T00:00:00Z',
              updated_at: '2026-04-20T00:00:00Z',
              team_type: 'equipe_a',
            },
          ],
        };
      }

      return { rows: [] };
    });

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body.users[0]).toMatchObject({
      id: 'user-1',
      team_type: 'avancado',
    });
  });

  it('POST /users aceita teamType legado, grava canônico e registra auditoria inicial', async () => {
    const app = mountUsersAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT id FROM users WHERE email = $1')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO users')) {
        return { rows: [{ id: 'user-2' }] };
      }
      if (sql.includes('INSERT INTO freelancer_profiles')) {
        return { rows: [] };
      }
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ ok: true }] };
      }
      if (sql.includes('INSERT INTO team_assignments')) {
        return {
          rows: [
            {
              id: 'assign-1',
              user_id: 'user-2',
              from_team_type: null,
              to_team_type: 'iniciante',
              changed_by: 'gestor-1',
              notes: 'Cadastro inicial do freelancer',
              created_at: '2026-04-20T00:00:00Z',
            },
          ],
        };
      }
      if (sql.includes('FROM users u') && sql.includes('WHERE u.id = $1')) {
        return {
          rows: [
            {
              id: 'user-2',
              name: 'Carlos Luz',
              email: 'carlos@test.com',
              role: 'freelancer',
              is_active: true,
              created_at: '2026-04-20T00:00:00Z',
              updated_at: '2026-04-20T00:00:00Z',
              team_type: 'iniciante',
            },
          ],
        };
      }

      return { rows: [] };
    });

    const res = await request(app)
      .post('/users')
      .send({
        name: 'Carlos Luz',
        email: 'carlos@test.com',
        password: 'Senha123',
        teamType: 'equipe_b',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      id: 'user-2',
      team_type: 'iniciante',
    });

    const profileInsertCall = mockQuery.mock.calls.find((call) =>
      String(call[0]).includes('INSERT INTO freelancer_profiles')
    );
    expect(profileInsertCall?.[1]?.[1]).toBe('iniciante');

    const auditInsertCall = mockQuery.mock.calls.find((call) =>
      String(call[0]).includes('INSERT INTO team_assignments')
    );
    expect(auditInsertCall?.[1]).toEqual([
      'user-2',
      null,
      'iniciante',
      'gestor-1',
      'Cadastro inicial do freelancer',
    ]);
  });

  it('PATCH /users/:id/team registra troca de equipe com origem e destino canônicos', async () => {
    const app = mountUsersAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT team_type FROM freelancer_profiles WHERE user_id = $1')) {
        return { rows: [{ team_type: 'equipe_b' }] };
      }
      if (sql.includes('UPDATE freelancer_profiles SET team_type = $1')) {
        return { rows: [] };
      }
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ ok: true }] };
      }
      if (sql.includes('INSERT INTO team_assignments')) {
        return {
          rows: [
            {
              id: 'assign-2',
              user_id: 'user-1',
              from_team_type: 'iniciante',
              to_team_type: 'avancado',
              changed_by: 'gestor-1',
              notes: 'Promoção',
              created_at: '2026-04-20T00:00:00Z',
            },
          ],
        };
      }
      if (sql.includes('FROM users u') && sql.includes('WHERE u.id = $1')) {
        return {
          rows: [
            {
              id: 'user-1',
              name: 'Ana Freela',
              email: 'ana@test.com',
              role: 'freelancer',
              is_active: true,
              created_at: '2026-04-20T00:00:00Z',
              updated_at: '2026-04-20T00:00:00Z',
              team_type: 'avancado',
            },
          ],
        };
      }

      return { rows: [] };
    });

    const res = await request(app)
      .patch('/users/user-1/team')
      .send({
        teamType: 'equipe_a',
        notes: 'Promoção',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      teamType: 'avancado',
      assignment: {
        from_team_type: 'iniciante',
        to_team_type: 'avancado',
      },
    });

    const updateCall = mockQuery.mock.calls.find((call) =>
      String(call[0]).includes('UPDATE freelancer_profiles SET team_type = $1')
    );
    expect(updateCall?.[1]).toEqual(['avancado', 'user-1']);
  });

  it('PATCH /users/:id/team registra remoção para sem_equipe preservando o histórico', async () => {
    const app = mountUsersAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT team_type FROM freelancer_profiles WHERE user_id = $1')) {
        return { rows: [{ team_type: 'avancado' }] };
      }
      if (sql.includes('UPDATE freelancer_profiles SET team_type = $1')) {
        return { rows: [] };
      }
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ ok: true }] };
      }
      if (sql.includes('INSERT INTO team_assignments')) {
        return {
          rows: [
            {
              id: 'assign-3',
              user_id: 'user-1',
              from_team_type: 'avancado',
              to_team_type: 'sem_equipe',
              changed_by: 'gestor-1',
              notes: 'Desativação de equipe',
              created_at: '2026-04-20T00:00:00Z',
            },
          ],
        };
      }
      if (sql.includes('FROM users u') && sql.includes('WHERE u.id = $1')) {
        return {
          rows: [
            {
              id: 'user-1',
              name: 'Ana Freela',
              email: 'ana@test.com',
              role: 'freelancer',
              is_active: true,
              created_at: '2026-04-20T00:00:00Z',
              updated_at: '2026-04-20T00:00:00Z',
              team_type: 'sem_equipe',
            },
          ],
        };
      }

      return { rows: [] };
    });

    const res = await request(app)
      .patch('/users/user-1/team')
      .send({
        teamType: 'sem_equipe',
        notes: 'Desativação de equipe',
      });

    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({
      from_team_type: 'avancado',
      to_team_type: 'sem_equipe',
    });
    expect(res.body.user.team_type).toBe('sem_equipe');
  });
});
