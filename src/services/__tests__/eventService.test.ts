import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelEvent,
  createEvent,
  getAllEvents,
  getEventById,
  getTeamAllocationsForEvent,
  updateEventStatus,
} from '../eventService';

function mockApiResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('eventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.localStorage.getItem).mockReturnValue('jwt-token');
  });

  it('normaliza eventos da API para o modelo canônico', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        events: [
          {
            id: 'evt-1',
            title: 'Evento Teste',
            description: 'Descricao',
            location: 'Sao Paulo',
            start_date: '2026-05-10',
            end_date: '2026-05-11',
            status: 'planning',
            created_by: 'gestor-1',
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            event_type: 'normal',
            estimated_duration: 8,
            requirements: ['camera'],
            team_priority: 'equipe_a',
            allow_team_b: true,
            daily_rate_team_a: 350,
            daily_rate_team_b: 200,
            is_multi_day: false,
            total_days: 1,
            working_days: ['2026-05-10'],
          },
        ],
      })
    );

    const result = await getAllEvents();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/events',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      })
    );
    expect(result[0]).toMatchObject({
      id: 'evt-1',
      teamPriority: 'avancado',
      allowBackupLevels: true,
      allowTeamB: true,
      dailyRateIniciante: 200,
      dailyRateIntermediario: 200,
      dailyRateAvancado: 350,
      dailyRateTeamA: 350,
      dailyRateTeamB: 200,
    });
  });

  it('busca evento por id e transforma teamAllocations', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        event: {
          id: 'evt-1',
          title: 'Evento Teste',
          description: 'Descricao',
          location: 'Sao Paulo',
          start_date: '2026-05-10',
          end_date: '2026-05-11',
          status: 'planning',
          created_by: 'gestor-1',
          created_at: '2026-04-20T00:00:00Z',
          updated_at: '2026-04-20T00:00:00Z',
          event_type: 'normal',
          estimated_duration: 8,
          requirements: ['camera'],
          team_priority: 'iniciante',
          allow_backup_levels: false,
          daily_rate_iniciante: 200,
          daily_rate_intermediario: 220,
          daily_rate_avancado: 320,
          is_multi_day: false,
          total_days: 1,
          working_days: ['2026-05-10'],
          teamAllocations: [
            {
              id: 'alloc-1',
              event_id: 'evt-1',
              user_id: 'user-1',
              assigned_role: 'camera',
              status: 'pending',
              daily_rate: 200,
              total_days: 1,
              total_payment: 200,
              total_hours: 8,
              cancellation_deadline: '2026-05-05',
              confirmation_deadline: '2026-05-05',
              team_type: 'equipe_b',
            },
          ],
        },
      })
    );

    const result = await getEventById('evt-1');

    expect(result?.teamAllocations?.[0]).toMatchObject({
      id: 'alloc-1',
      assignedRole: 'camera',
      team_type: 'iniciante',
      teamType: 'iniciante',
    });
  });

  it('envia criação de evento com payload canônico para a API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        event: {
          id: 'evt-1',
          title: 'Evento Novo',
          description: '',
          location: 'SP',
          start_date: '2026-05-10',
          end_date: '2026-05-10',
          status: 'planning',
          created_by: 'gestor-1',
          created_at: '2026-04-20T00:00:00Z',
          updated_at: '2026-04-20T00:00:00Z',
          event_type: 'normal',
          estimated_duration: 8,
          requirements: [],
          team_priority: 'intermediario',
          allow_backup_levels: true,
          daily_rate_iniciante: 200,
          daily_rate_intermediario: 220,
          daily_rate_avancado: 320,
          is_multi_day: false,
          total_days: 1,
          working_days: ['2026-05-10'],
        },
      })
    );

    await createEvent({
      title: 'Evento Novo',
      description: '',
      location: 'SP',
      startDate: '2026-05-10',
      endDate: '2026-05-10',
      status: 'planning',
      createdBy: 'gestor-1',
      eventType: 'normal',
      estimatedDuration: 8,
      requirements: [],
      teamPriority: 'intermediario',
      allowBackupLevels: true,
      dailyRateIniciante: 200,
      dailyRateIntermediario: 220,
      dailyRateAvancado: 320,
      isMultiDay: false,
      totalDays: 1,
      workingDays: ['2026-05-10'],
      teamAllocations: [],
      equipmentAllocations: [],
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/events',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"teamPriority":"intermediario"'),
      })
    );
  });

  it('busca alocações de equipe do evento pela API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        allocations: [
          {
            id: 'alloc-1',
            event_id: 'evt-1',
            user_id: 'user-1',
            assigned_role: 'camera',
            status: 'confirmed',
            daily_rate: 250,
            total_days: 2,
            total_payment: 500,
            total_hours: 16,
            assigned_at: '2026-04-20T00:00:00Z',
            cancellation_deadline: '2026-05-05',
            confirmation_deadline: '2026-05-05',
          },
        ],
      })
    );

    const result = await getTeamAllocationsForEvent('evt-1');

    expect(result[0]).toMatchObject({
      id: 'alloc-1',
      eventId: 'evt-1',
      assignedRole: 'camera',
      status: 'confirmed',
    });
  });

  it('atualiza status do evento pela API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        event: {
          id: 'evt-1',
          title: 'Evento Teste',
          description: '',
          location: 'SP',
          start_date: '2026-05-10',
          end_date: '2026-05-10',
          status: 'confirmed',
          created_by: 'gestor-1',
          created_at: '2026-04-20T00:00:00Z',
          updated_at: '2026-04-20T00:00:00Z',
          event_type: 'normal',
          estimated_duration: 8,
          requirements: [],
          team_priority: 'iniciante',
          allow_backup_levels: true,
          daily_rate_iniciante: 200,
          daily_rate_intermediario: 220,
          daily_rate_avancado: 320,
          is_multi_day: false,
          total_days: 1,
          working_days: ['2026-05-10'],
        },
      })
    );

    const result = await updateEventStatus('evt-1', 'confirmed');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/events/evt-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' }),
      })
    );
    expect(result.status).toBe('confirmed');
  });

  it('cancela evento reutilizando a atualização de status', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        event: {
          id: 'evt-1',
          title: 'Evento Teste',
          description: '',
          location: 'SP',
          start_date: '2026-05-10',
          end_date: '2026-05-10',
          status: 'cancelled',
          created_by: 'gestor-1',
          created_at: '2026-04-20T00:00:00Z',
          updated_at: '2026-04-20T00:00:00Z',
          event_type: 'normal',
          estimated_duration: 8,
          requirements: [],
          team_priority: 'iniciante',
          allow_backup_levels: true,
          daily_rate_iniciante: 200,
          daily_rate_intermediario: 220,
          daily_rate_avancado: 320,
          is_multi_day: false,
          total_days: 1,
          working_days: ['2026-05-10'],
        },
      })
    );

    await cancelEvent('evt-1');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/events/evt-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      })
    );
  });
});
