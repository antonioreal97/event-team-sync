import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assignUserToTeam,
  getActiveFreelancersByTeam,
  getAllTeamAssignments,
  getTeamStatistics,
  isEventTeamFullyConfirmed,
  removeUserFromTeam,
} from '../teamService';

function mockApiResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.localStorage.getItem).mockReturnValue('jwt-token');
  });

  it('busca auditoria real de atribuições e mapeia origem/destino canônicos', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        assignments: [
          {
            id: 'assign-1',
            user_id: 'user-1',
            from_team_type: 'equipe_b',
            to_team_type: 'equipe_a',
            changed_by: 'gestor-1',
            changed_by_name: 'Gestor Principal',
            user_name: 'Ana Freela',
            user_email: 'ana@test.com',
            created_at: '2026-04-20T10:00:00Z',
            notes: 'Promoção',
          },
        ],
      })
    );

    const result = await getAllTeamAssignments();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/teams/assignments',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      })
    );
    expect(result[0]).toMatchObject({
      id: 'assign-1',
      fromTeamType: 'iniciante',
      toTeamType: 'avancado',
      changedBy: 'gestor-1',
      changedByName: 'Gestor Principal',
      teamType: 'avancado',
    });
  });

  it('atualiza equipe pela API com payload canônico', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    await assignUserToTeam('user-1', 'intermediario', 'Rebalanceamento');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users/user-1/team',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          teamType: 'intermediario',
          notes: 'Rebalanceamento',
        }),
      })
    );
  });

  it('remove usuário da equipe convertendo para sem_equipe', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    await removeUserFromTeam('user-2', 'Desalocação');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users/user-2/team',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          teamType: 'sem_equipe',
          notes: 'Desalocação',
        }),
      })
    );
  });

  it('consome estatísticas de equipe diretamente da API Express', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        stats: {
          total: 12,
          iniciante: 4,
          intermediario: 3,
          avancado: 2,
          sem_equipe: 3,
        },
      })
    );

    const result = await getTeamStatistics();

    expect(result).toEqual({
      total: 12,
      iniciante: 4,
      intermediario: 3,
      avancado: 2,
      sem_equipe: 3,
    });
  });

  it('mapeia freelancers ativos por nível usando respostas já normalizadas da API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        iniciante: {
          total: 1,
          active: 1,
          users: [
            {
              id: 'user-1',
              name: 'Ana',
              email: 'ana@test.com',
              role: 'freelancer',
              is_active: true,
              created_at: '2026-04-20T00:00:00Z',
              updated_at: '2026-04-20T00:00:00Z',
              team_type: 'iniciante',
              experience_level: 'iniciante',
              audio_visual_roles: ['camera'],
            },
          ],
        },
        intermediario: { total: 0, active: 0, users: [] },
        avancado: { total: 0, active: 0, users: [] },
        sem_equipe: { total: 0, active: 0, users: [] },
      })
    );

    const result = await getActiveFreelancersByTeam();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/teams/active-freelancers',
      expect.any(Object)
    );
    expect(result.iniciante.total).toBe(1);
    expect(result.iniciante.users[0]).toMatchObject({
      id: 'user-1',
      teamType: 'iniciante',
    });
  });

  it('verifica status de confirmação completa do evento pela API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        isFullyConfirmed: true,
      })
    );

    const result = await isEventTeamFullyConfirmed('evt-1');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/teams/event/evt-1/confirmation-status',
      expect.any(Object)
    );
    expect(result).toBe(true);
  });
});
