import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { teamRoutes } from '../teams';
import { errorHandler } from '../../middleware/errorHandler';

vi.mock('../../config/database', () => ({
  pool: { query: vi.fn() },
}));

import { pool } from '../../config/database';

const mockQuery = pool.query as ReturnType<typeof vi.fn>;

function mountTeamsAsGestor() {
  const app = express();
  app.use(express.json());
  app.use('/teams', (req: Request, _res: Response, next: NextFunction) => {
    (req as express.Request & { user?: { id: string; email: string; role: string } }).user = {
      id: 'gestor-1',
      email: 'gestor@test.com',
      role: 'gestor',
    };
    next();
  }, teamRoutes);
  app.use(errorHandler);
  return app;
}

function mountTeamsAsFreelancer(userId: string) {
  const app = express();
  app.use(express.json());
  app.use('/teams', (req: Request, _res: Response, next: NextFunction) => {
    (req as express.Request & { user?: { id: string; email: string; role: string } }).user = {
      id: userId,
      email: 'fl@test.com',
      role: 'freelancer',
    };
    next();
  }, teamRoutes);
  app.use(errorHandler);
  return app;
}

describe('Teams allocation + disponibilidade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /allocate cria alocação pendente e notificação (coluna opcional)', async () => {
    const app = mountTeamsAsGestor();

    const allocationId = 'alloc-uuid-1';
    const eventRow = {
      id: 'evt-1',
      title: 'Show X',
      start_date: '2026-05-01',
      end_date: '2026-05-02',
      event_type: 'normal',
      daily_rate_iniciante: 100,
      daily_rate_intermediario: 200,
      daily_rate_avancado: 300,
      daily_rate_team_a: null,
      daily_rate_team_b: null,
      created_by: 'gestor-1',
    };

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns')) {
        return { rows: [{ ok: false }] };
      }
      if (sql.includes('FROM events WHERE id') && sql.includes('SELECT')) {
        return { rows: [eventRow] };
      }
      if (sql.includes('FROM users u') && sql.includes("IN ('freelancer', 'lider_freelancer')")) {
        return { rows: [{ id: 'user-fl', role: 'freelancer', name: 'Freela', team_type: 'iniciante' }] };
      }
      if (sql.includes('FROM team_allocations WHERE event_id') && sql.includes('user_id')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO team_allocations')) {
        return {
          rows: [
            {
              id: allocationId,
              event_id: 'evt-1',
              user_id: 'user-fl',
              status: 'pending',
              daily_rate: 100,
              total_days: 2,
            },
          ],
        };
      }
      if (sql.includes('INSERT INTO attendance_records')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO notifications')) {
        return { rows: [{ id: 'notif-1' }] };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .post('/teams/allocate')
      .send({
        eventId: 'evt-1',
        userId: 'user-fl',
        assignedRole: 'camera',
        totalDays: 2,
        notes: 'test',
      });

    expect(res.status).toBe(201);
    expect(res.body.allocation?.id).toBe(allocationId);
    const notifCalls = mockQuery.mock.calls.filter((c) => String(c[0]).includes('INSERT INTO notifications'));
    expect(notifCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('POST confirm-availability atualiza para confirmed', async () => {
    const app = mountTeamsAsFreelancer('user-fl');

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT id, user_id, status FROM team_allocations')) {
        return { rows: [{ id: 'a1', user_id: 'user-fl', status: 'pending' }] };
      }
      if (sql.includes('UPDATE team_allocations')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const res = await request(app).post('/teams/allocations/a1/confirm-availability').send();
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Disponibilidade/);
  });

  it('POST decline-availability remove alocação e notifica gestor', async () => {
    const app = mountTeamsAsFreelancer('user-fl');

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM team_allocations ta') && sql.includes('INNER JOIN events')) {
        return {
          rows: [
            {
              id: 'a1',
              user_id: 'user-fl',
              status: 'pending',
              event_id: 'evt-1',
              assigned_role: 'camera',
              event_title: 'Show',
              created_by: 'gestor-1',
              freelancer_name: 'Freela',
            },
          ],
        };
      }
      if (sql.includes('DELETE FROM team_allocations')) {
        return { rows: [{ id: 'a1' }] };
      }
      if (sql.includes('information_schema.columns')) {
        return { rows: [{ ok: false }] };
      }
      if (sql.includes('INSERT INTO notifications')) {
        return { rows: [{ id: 'n1' }] };
      }
      return { rows: [] };
    });

    const res = await request(app).post('/teams/allocations/a1/decline-availability').send();
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/notificado/);
  });
});
