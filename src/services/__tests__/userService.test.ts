import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createFreelancer,
  deleteUser,
  getAllUsers,
  getAvailableUsersForEvent,
  getFreelancersByTeam,
  getTeamStatistics,
  updateUserStatus,
  updateUserTeam,
} from '../userService';

function mockApiResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.localStorage.getItem).mockReturnValue('jwt-token');
  });

  it('consome a API de usuários e normaliza team_type legado para o modelo canônico', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        users: [
          {
            id: 'user-1',
            name: 'Ana Freela',
            email: 'ana@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera'],
            total_events_attended: 3,
            total_earnings: 900,
          },
        ],
      })
    );

    const result = await getAllUsers();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'user-1',
      teamType: 'avancado',
      experienceLevel: 'intermediario',
      audioVisualRoles: ['camera'],
    });
  });

  it('filtra freelancers pelo teamType canônico após normalização da API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        users: [
          {
            id: 'user-1',
            name: 'Ana Freela',
            email: 'ana@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'equipe_b',
            experience_level: 'iniciante',
            audio_visual_roles: ['camera'],
          },
          {
            id: 'user-2',
            name: 'Bia Freela',
            email: 'bia@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'avancado',
            experience_level: 'avancado',
            audio_visual_roles: ['audio'],
          },
        ],
      })
    );

    const result = await getFreelancersByTeam('iniciante');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'user-1',
      teamType: 'iniciante',
    });
  });

  it('envia criação de freelancer pela API com payload canônico e retorna usuário mapeado', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        user: {
          id: 'user-3',
          name: 'Carlos Luz',
          email: 'carlos@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2026-04-20T00:00:00Z',
          updated_at: '2026-04-20T00:00:00Z',
          team_type: 'intermediario',
          experience_level: 'intermediario',
          audio_visual_roles: ['lighting'],
        },
      }, 201)
    );

    const result = await createFreelancer({
      name: 'Carlos Luz',
      email: 'carlos@test.com',
      password: 'Senha123',
      teamType: 'intermediario',
      audioVisualRoles: ['lighting'],
      experienceLevel: 'intermediario',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"teamType":"intermediario"'),
      })
    );
    expect(result).toMatchObject({
      id: 'user-3',
      teamType: 'intermediario',
    });
  });

  it('atualiza equipe de freelancer pela API com trilha de auditoria opcional', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    await updateUserTeam('user-1', 'avancado', 'Promoção de nível');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users/user-1/team',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          teamType: 'avancado',
          notes: 'Promoção de nível',
        }),
      })
    );
  });

  it('desativa usuário em vez de excluir fisicamente', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    await deleteUser('user-1');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users/user-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      })
    );
  });

  it('expõe atualização explícita de status pela API', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    await updateUserStatus('user-2', true);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/users/user-2/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      })
    );
  });

  it('agrupa estatísticas por níveis canônicos', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        users: [
          {
            id: 'user-1',
            name: 'Ana',
            email: 'ana@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'equipe_b',
            experience_level: 'iniciante',
            audio_visual_roles: [],
          },
          {
            id: 'user-2',
            name: 'Bruno',
            email: 'bruno@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'intermediario',
            experience_level: 'intermediario',
            audio_visual_roles: [],
          },
          {
            id: 'user-3',
            name: 'Clara',
            email: 'clara@test.com',
            role: 'lider_freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'avancado',
            experience_level: 'avancado',
            audio_visual_roles: [],
          },
          {
            id: 'user-4',
            name: 'Diego',
            email: 'diego@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'sem_equipe',
            experience_level: 'iniciante',
            audio_visual_roles: [],
          },
        ],
      })
    );

    const result = await getTeamStatistics();

    expect(result.iniciante.count).toBe(1);
    expect(result.intermediario.count).toBe(1);
    expect(result.avancado.count).toBe(1);
    expect(result.sem_equipe.count).toBe(1);
  });

  it('busca apenas usuários ativos com função necessária para um evento', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
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
          {
            id: 'user-2',
            name: 'Bruno',
            email: 'bruno@test.com',
            role: 'freelancer',
            is_active: false,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'avancado',
            experience_level: 'avancado',
            audio_visual_roles: ['camera'],
          },
          {
            id: 'user-3',
            name: 'Clara',
            email: 'clara@test.com',
            role: 'freelancer',
            is_active: true,
            created_at: '2026-04-20T00:00:00Z',
            updated_at: '2026-04-20T00:00:00Z',
            team_type: 'avancado',
            experience_level: 'avancado',
            audio_visual_roles: ['audio'],
          },
        ],
      })
    );

    const result = await getAvailableUsersForEvent(
      'evt-1',
      ['camera'],
      new Date('2026-05-10'),
      new Date('2026-05-11')
    );

    expect(result.map((user) => user.id)).toEqual(['user-1']);
  });
});
