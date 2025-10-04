import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAllUsers,
  getUserById,
  getUsersByRole,
  getFreelancers,
  getFreelancersByTeam,
  createFreelancer,
  updateUser,
  updateUserTeam,
  updateUserStatus,
  deleteUser,
  getUserAvailability,
  getAvailableUsersForEvent,
  searchUsers,
  getTeamStatistics,
  getAvailableUsersForEventWithPriority
} from '../userService'
import { supabase } from '@/integrations/supabase/client'

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        })),
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          })),
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    })),
    auth: {
      signUp: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    }
  }
}))

// Mock do userMapper
vi.mock('@/utils/userMapper', () => ({
  mapSupabaseUserToUser: vi.fn((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    teamType: user.freelancer_profile?.[0]?.team_type,
    experienceLevel: user.freelancer_profile?.[0]?.experience_level || 'iniciante',
    audioVisualRoles: user.freelancer_profile?.[0]?.audio_visual_roles || [],
    totalEventsAttended: 0,
    totalEarnings: 0
  })),
  mapBasicUserToUser: vi.fn((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    teamType: undefined,
    experienceLevel: 'iniciante' as const,
    audioVisualRoles: [],
    totalEventsAttended: 0,
    totalEarnings: 0
  }))
}))

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAllUsers', () => {
    it('deve retornar lista vazia quando não há usuários', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: [],
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAllUsers()
      expect(result).toEqual([])
    })

    it('deve retornar usuários quando existem dados', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera', 'audio']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAllUsers()
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'João Silva',
        email: 'joao@test.com',
        role: 'freelancer',
        isActive: true,
        teamType: 'equipe_a',
        experienceLevel: 'intermediario',
        audioVisualRoles: ['camera', 'audio']
      })
    })

    it('deve retornar lista vazia quando há erro', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: null,
            error: new Error('Erro de conexão')
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAllUsers()
      expect(result).toEqual([])
    })
  })

  describe('getUserById', () => {
    it('deve retornar usuário quando encontrado', async () => {
      const mockData = {
        id: '1',
        name: 'João Silva',
        email: 'joao@test.com',
        role: 'freelancer',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        freelancer_profile: [{
          team_type: 'equipe_a',
          experience_level: 'intermediario',
          audio_visual_roles: ['camera', 'audio']
        }]
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockData,
              error: null
            })
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getUserById('1')
      expect(result).toMatchObject({
        id: '1',
        name: 'João Silva',
        email: 'joao@test.com',
        role: 'freelancer',
        isActive: true,
        teamType: 'equipe_a',
        experienceLevel: 'intermediario',
        audioVisualRoles: ['camera', 'audio']
      })
    })

    it('deve retornar undefined quando usuário não encontrado', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: null
            })
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getUserById('999')
      expect(result).toBeUndefined()
    })

    it('deve retornar undefined quando há erro', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: new Error('Erro de conexão')
            })
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getUserById('1')
      expect(result).toBeUndefined()
    })
  })

  describe('getUsersByRole', () => {
    it('deve retornar usuários por role', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera', 'audio']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getUsersByRole('freelancer')
      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('freelancer')
    })
  })

  describe('getFreelancers', () => {
    it('deve retornar freelancers', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera', 'audio']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getFreelancers()
      expect(result).toHaveLength(1)
      expect(result[0].role).toBe('freelancer')
    })
  })

  describe('getFreelancersByTeam', () => {
    it('deve retornar freelancers por equipe', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera', 'audio']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              data: mockData,
              error: null
            })
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getFreelancersByTeam('equipe_a')
      expect(result).toHaveLength(1)
      expect(result[0].teamType).toBe('equipe_a')
    })
  })

  describe('createFreelancer', () => {
    it('deve criar freelancer com sucesso', async () => {
      const freelancerData = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: 'senha123',
        teamType: 'equipe_a' as const,
        phone: '11999999999',
        experienceLevel: 'intermediario' as const,
        audioVisualRoles: ['camera', 'audio'] as const
      }

      const mockAuthData = {
        user: { id: 'new-user-id' }
      }

      const mockUserData = {
        id: 'new-user-id',
        name: 'João Silva',
        email: 'joao@test.com',
        role: 'freelancer',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: mockUserData,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            error: null
          })
        })

      ;(supabase.from as any).mockImplementation(mockFrom)
      ;(supabase.auth.signUp as any).mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      const result = await createFreelancer(freelancerData)
      expect(result).toMatchObject({
        id: 'new-user-id',
        name: 'João Silva',
        email: 'joao@test.com',
        role: 'freelancer',
        isActive: true
      })
    })

    it('deve lançar erro quando falha na autenticação', async () => {
      const freelancerData = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: 'senha123',
        teamType: 'equipe_a' as const
      }

      ;(supabase.auth.signUp as any).mockResolvedValue({
        data: null,
        error: new Error('Erro de autenticação')
      })

      await expect(createFreelancer(freelancerData)).rejects.toThrow('Erro de autenticação')
    })

    it('deve lançar erro quando falha ao criar usuário', async () => {
      const freelancerData = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: 'senha123',
        teamType: 'equipe_a' as const
      }

      const mockAuthData = {
        user: { id: 'new-user-id' }
      }

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: new Error('Erro ao criar usuário')
            })
          })
        })
      })

      ;(supabase.from as any).mockImplementation(mockFrom)
      ;(supabase.auth.signUp as any).mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      await expect(createFreelancer(freelancerData)).rejects.toThrow('Erro ao criar usuário')
    })
  })

  describe('updateUser', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const updateData = {
        name: 'João Silva Atualizado',
        email: 'joao.novo@test.com'
      }

      const mockData = {
        id: '1',
        name: 'João Silva Atualizado',
        email: 'joao.novo@test.com',
        role: 'freelancer',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: mockData,
                error: null
              })
            })
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await updateUser('1', updateData)
      expect(result).toMatchObject({
        id: '1',
        name: 'João Silva Atualizado',
        email: 'joao.novo@test.com',
        role: 'freelancer',
        isActive: true
      })
    })

    it('deve lançar erro quando falha ao atualizar usuário', async () => {
      const updateData = {
        name: 'João Silva Atualizado'
      }

      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: null,
                error: new Error('Erro ao atualizar usuário')
              })
            })
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(updateUser('1', updateData)).rejects.toThrow('Erro ao atualizar usuário')
    })
  })

  describe('updateUserTeam', () => {
    it('deve atualizar equipe do usuário com sucesso', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(updateUserTeam('1', 'equipe_b')).resolves.toBeUndefined()
    })

    it('deve lançar erro quando falha ao atualizar equipe', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: new Error('Erro ao atualizar equipe')
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(updateUserTeam('1', 'equipe_b')).rejects.toThrow('Erro ao atualizar equipe')
    })
  })

  describe('updateUserStatus', () => {
    it('deve atualizar status do usuário com sucesso', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(updateUserStatus('1', false)).resolves.toBeUndefined()
    })

    it('deve lançar erro quando falha ao atualizar status', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: new Error('Erro ao atualizar status')
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(updateUserStatus('1', false)).rejects.toThrow('Erro ao atualizar status')
    })
  })

  describe('deleteUser', () => {
    it('deve deletar usuário com sucesso', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(deleteUser('1')).resolves.toBeUndefined()
    })

    it('deve lançar erro quando falha ao deletar usuário', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: new Error('Erro ao deletar usuário')
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      await expect(deleteUser('1')).rejects.toThrow('Erro ao deletar usuário')
    })
  })

  describe('getUserAvailability', () => {
    it('deve retornar disponibilidade como true por padrão', async () => {
      const result = await getUserAvailability('1', new Date(), new Date())
      expect(result).toEqual({
        isAvailable: true,
        conflictingEvents: []
      })
    })
  })

  describe('getAvailableUsersForEvent', () => {
    it('deve retornar usuários disponíveis para evento', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera', 'audio']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAvailableUsersForEvent(
        'event-1',
        ['camera'],
        new Date('2024-01-01'),
        new Date('2024-01-02')
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('deve filtrar usuários inativos', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Ativo',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        },
        {
          id: '2',
          name: 'João Inativo',
          email: 'joao.inativo@test.com',
          role: 'freelancer',
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAvailableUsersForEvent(
        'event-1',
        ['camera'],
        new Date('2024-01-01'),
        new Date('2024-01-02')
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('deve filtrar usuários sem roles necessárias', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Camera',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        },
        {
          id: '2',
          name: 'João Audio',
          email: 'joao.audio@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['audio']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAvailableUsersForEvent(
        'event-1',
        ['camera'],
        new Date('2024-01-01'),
        new Date('2024-01-02')
      )
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })
  })

  describe('searchUsers', () => {
    it('deve buscar usuários por nome', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await searchUsers('João')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('João Silva')
    })

    it('deve buscar usuários por email', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await searchUsers('joao@test.com')
      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('joao@test.com')
    })

    it('deve buscar usuários por role', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await searchUsers('camera')
      expect(result).toHaveLength(1)
      expect(result[0].audioVisualRoles).toContain('camera')
    })
  })

  describe('getTeamStatistics', () => {
    it('deve retornar estatísticas de equipes', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Equipe A',
          email: 'joao.a@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        },
        {
          id: '2',
          name: 'João Equipe B',
          email: 'joao.b@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_b',
            experience_level: 'intermediario',
            audio_visual_roles: ['audio']
          }]
        },
        {
          id: '3',
          name: 'João Sem Equipe',
          email: 'joao.sem@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'sem_equipe',
            experience_level: 'intermediario',
            audio_visual_roles: ['lighting']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getTeamStatistics()
      expect(result).toEqual({
        equipe_a: { count: 1, users: expect.any(Array) },
        equipe_b: { count: 1, users: expect.any(Array) },
        sem_equipe: { count: 1, users: expect.any(Array) }
      })
      expect(result.equipe_a.count).toBe(1)
      expect(result.equipe_b.count).toBe(1)
      expect(result.sem_equipe.count).toBe(1)
    })
  })

  describe('getAvailableUsersForEventWithPriority', () => {
    it('deve retornar usuários agrupados por equipe', async () => {
      const mockData = [
        {
          id: '1',
          name: 'João Equipe A',
          email: 'joao.a@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_a',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        },
        {
          id: '2',
          name: 'João Equipe B',
          email: 'joao.b@test.com',
          role: 'freelancer',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          freelancer_profile: [{
            team_type: 'equipe_b',
            experience_level: 'intermediario',
            audio_visual_roles: ['camera']
          }]
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      })
      ;(supabase.from as any).mockImplementation(mockFrom)

      const result = await getAvailableUsersForEventWithPriority(
        'event-1',
        ['camera'],
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        'equipe_a'
      )
      expect(result).toEqual({
        equipe_a: expect.any(Array),
        equipe_b: expect.any(Array),
        sem_equipe: expect.any(Array)
      })
      expect(result.equipe_a).toHaveLength(1)
      expect(result.equipe_b).toHaveLength(1)
      expect(result.sem_equipe).toHaveLength(0)
    })
  })
})
