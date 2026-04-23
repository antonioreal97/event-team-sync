import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { teamRoutes } from '../teams';
import { errorHandler } from '../../middleware/errorHandler';
import { invalidateTeamAssignmentsCache } from '../../utils/teamAssignments';

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
    invalidateTeamAssignmentsCache();
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

  it('GET /assignments retorna auditoria real de mudanças de equipe normalizada', async () => {
    const app = mountTeamsAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ ok: true }] };
      }
      if (sql.includes('FROM team_assignments ta')) {
        return {
          rows: [
            {
              id: 'assign-1',
              user_id: 'user-1',
              from_team_type: 'equipe_b',
              to_team_type: 'equipe_a',
              changed_by: 'gestor-1',
              created_at: '2026-04-20T00:00:00Z',
              user_name: 'Freela',
              user_email: 'freela@test.com',
              changed_by_name: 'Gestor',
            },
          ],
        };
      }
      return { rows: [] };
    });

    const res = await request(app).get('/teams/assignments');

    expect(res.status).toBe(200);
    expect(res.body.assignments[0]).toMatchObject({
      id: 'assign-1',
      from_team_type: 'iniciante',
      to_team_type: 'avancado',
      team_type: 'avancado',
      assigned_at: '2026-04-20T00:00:00Z',
    });
  });

  it('GET /event/:eventId/allocations expõe team_type canônico para o frontend', async () => {
    const app = mountTeamsAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM team_allocations ta') && sql.includes('WHERE ta.event_id = $1')) {
        return {
          rows: [
            {
              id: 'alloc-1',
              event_id: 'evt-1',
              user_id: 'user-1',
              assigned_role: 'camera',
              status: 'confirmed',
              team_type: 'equipe_a',
              experience_level: 'avancado',
              user_name: 'Freela',
              user_email: 'freela@test.com',
            },
          ],
        };
      }
      return { rows: [] };
    });

    const res = await request(app).get('/teams/event/evt-1/allocations');

    expect(res.status).toBe(200);
    expect(res.body.allocations[0]).toMatchObject({
      id: 'alloc-1',
      team_type: 'avancado',
    });
  });

  it('GET /event/:eventId/attendance agrega presença e normaliza teamType', async () => {
    const app = mountTeamsAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT id, start_date FROM events WHERE id = $1')) {
        return { rows: [{ id: 'evt-1', start_date: '2026-05-01' }] };
      }
      if (sql.includes('FROM team_allocations ta') && sql.includes('LEFT JOIN attendance_records ar')) {
        return {
          rows: [
            {
              allocation_id: 'alloc-1',
              user_id: 'user-1',
              assigned_role: 'camera',
              daily_rate: 200,
              user_name: 'Ana',
              team_type: 'equipe_b',
              attendance_id: 'att-1',
              date: '2026-05-01',
              attendance_status: 'present',
              daily_payment: 200,
              payment_confirmed: true,
              notes: 'ok',
            },
            {
              allocation_id: 'alloc-2',
              user_id: 'user-2',
              assigned_role: 'audio',
              daily_rate: 220,
              user_name: 'Bia',
              team_type: 'intermediario',
              attendance_id: 'att-2',
              date: '2026-05-01',
              attendance_status: 'late',
              daily_payment: 220,
              payment_confirmed: false,
              notes: '',
            },
            {
              allocation_id: 'alloc-3',
              user_id: 'user-3',
              assigned_role: 'lighting',
              daily_rate: 220,
              user_name: 'Caio',
              team_type: 'avancado',
              attendance_id: null,
              date: null,
              attendance_status: null,
              daily_payment: null,
              payment_confirmed: null,
              notes: null,
            },
          ],
        };
      }
      return { rows: [] };
    });

    const res = await request(app).get('/teams/event/evt-1/attendance?date=2026-05-01');

    expect(res.status).toBe(200);
    expect(res.body.attendanceList).toMatchObject({
      eventId: 'evt-1',
      eventDate: '2026-05-01',
      totalPresent: 1,
      totalLate: 1,
      totalPending: 1,
      totalAbsent: 0,
    });
    expect(res.body.attendanceList.allocations[0]).toMatchObject({
      allocationId: 'alloc-1',
      teamType: 'iniciante',
      attendance: {
        status: 'present',
        paymentConfirmed: true,
      },
    });
  });
});
