import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { eventRoutes } from '../events';
import { errorHandler } from '../../middleware/errorHandler';
import { pool } from '../../config/database';

vi.mock('../../config/database', () => ({
  pool: { query: vi.fn() },
}));

const mockQuery = pool.query as ReturnType<typeof vi.fn>;

function mountEventsAsGestor() {
  const app = express();
  app.use(express.json());
  app.use('/events', (req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: 'gestor-1',
      email: 'gestor@test.com',
      role: 'gestor',
    };
    next();
  }, eventRoutes);
  app.use(errorHandler);
  return app;
}

describe('Event routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /events normaliza team_priority e diárias legadas no payload público', async () => {
    const app = mountEventsAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM events e') && sql.includes('ORDER BY e.start_date DESC')) {
        return {
          rows: [
            {
              id: 'evt-1',
              title: 'Evento Teste',
              location: 'São Paulo',
              start_date: '2026-05-10',
              end_date: '2026-05-11',
              status: 'planning',
              created_by: 'gestor-1',
              event_type: 'normal',
              team_priority: 'equipe_b',
              allow_team_b: false,
              daily_rate_team_a: 350,
              daily_rate_team_b: 200,
            },
          ],
        };
      }

      return { rows: [] };
    });

    const res = await request(app).get('/events');

    expect(res.status).toBe(200);
    expect(res.body.events[0]).toMatchObject({
      team_priority: 'iniciante',
      allow_backup_levels: false,
      allow_team_b: false,
      daily_rate_iniciante: 200,
      daily_rate_intermediario: 200,
      daily_rate_avancado: 350,
      daily_rate_team_a: 350,
      daily_rate_team_b: 200,
    });
  });

  it('GET /events/:id devolve evento e alocações já normalizados', async () => {
    const app = mountEventsAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM events e') && sql.includes('WHERE e.id = $1')) {
        return {
          rows: [
            {
              id: 'evt-1',
              title: 'Evento Teste',
              location: 'São Paulo',
              start_date: '2026-05-10',
              end_date: '2026-05-11',
              status: 'planning',
              created_by: 'gestor-1',
              event_type: 'normal',
              team_priority: 'equipe_a',
              allow_team_b: true,
              daily_rate_team_a: 400,
              daily_rate_team_b: 220,
            },
          ],
        };
      }
      if (sql.includes('FROM team_allocations ta') && sql.includes('WHERE ta.event_id = $1')) {
        return {
          rows: [
            {
              id: 'alloc-1',
              event_id: 'evt-1',
              user_id: 'user-1',
              assigned_role: 'camera',
              status: 'confirmed',
              team_type: 'equipe_b',
              experience_level: 'iniciante',
              user_name: 'Ana Freela',
              user_email: 'ana@test.com',
            },
          ],
        };
      }
      if (sql.includes('FROM equipment_allocations ea')) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    const res = await request(app).get('/events/evt-1');

    expect(res.status).toBe(200);
    expect(res.body.event).toMatchObject({
      team_priority: 'avancado',
      daily_rate_iniciante: 220,
      daily_rate_intermediario: 220,
      daily_rate_avancado: 400,
    });
    expect(res.body.event.teamAllocations[0]).toMatchObject({
      id: 'alloc-1',
      team_type: 'iniciante',
    });
  });

  it('POST /events aceita aliases legados e grava apenas valores canônicos', async () => {
    const app = mountEventsAsGestor();

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO events')) {
        return {
          rows: [
            {
              id: 'evt-2',
              title: 'Evento Novo',
              location: 'Campinas',
              start_date: '2026-05-10',
              end_date: '2026-05-10',
              status: 'planning',
              created_by: 'gestor-1',
              event_type: 'normal',
              team_priority: 'avancado',
              allow_backup_levels: false,
              allow_team_b: false,
              daily_rate_iniciante: 180,
              daily_rate_intermediario: 180,
              daily_rate_avancado: 320,
              daily_rate_team_a: 320,
              daily_rate_team_b: 180,
              is_multi_day: false,
              total_days: 1,
              working_days: ['2026-05-10'],
            },
          ],
        };
      }

      return { rows: [] };
    });

    const res = await request(app)
      .post('/events')
      .send({
        title: 'Evento Novo',
        description: '',
        location: 'Campinas',
        startDate: '2026-05-10',
        endDate: '2026-05-10',
        status: 'planning',
        eventType: 'normal',
        estimatedDuration: 8,
        requirements: ['camera'],
        teamPriority: 'equipe_a',
        allowTeamB: false,
        dailyRateTeamA: 320,
        dailyRateTeamB: 180,
        isMultiDay: false,
        totalDays: 1,
        workingDays: ['2026-05-10'],
      });

    expect(res.status).toBe(201);
    expect(res.body.event).toMatchObject({
      id: 'evt-2',
      team_priority: 'avancado',
      allow_backup_levels: false,
      daily_rate_iniciante: 180,
      daily_rate_intermediario: 180,
      daily_rate_avancado: 320,
    });

    const insertCall = mockQuery.mock.calls.find((call) =>
      String(call[0]).includes('INSERT INTO events')
    );
    expect(insertCall?.[1]).toEqual(
      expect.arrayContaining([
        'avancado',
        false,
        false,
        180,
        180,
        320,
        320,
        180,
      ])
    );
  });
});
