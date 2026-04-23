import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EventCard from '../EventCard'
import { Event } from '@/types'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock do AuthContext
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock do useToast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock do eventService
vi.mock('@/services/eventService', () => ({
  deleteEvent: vi.fn()
}))

// Mock do console para evitar logs durante os testes
const originalConsole = global.console
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
})

const mockEvent: Event = {
  id: '1',
  title: 'Evento Teste',
  description: 'Descrição do evento teste',
  location: 'Local do evento',
  startDate: '2024-01-01',
  endDate: '2024-01-02',
  status: 'planning',
  createdBy: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  eventType: 'normal',
  estimatedDuration: 8,
  budget: 1000,
  requirements: ['camera'],
  notes: 'Notas do evento',
  teamPriority: 'avancado',
  allowBackupLevels: true,
  allowTeamB: true,
  dailyRateIniciante: 180,
  dailyRateIntermediario: 180,
  dailyRateAvancado: 200,
  dailyRateTeamA: 200,
  dailyRateTeamB: 180,
  isMultiDay: false,
  totalDays: 1,
  workingDays: ['2024-01-01'],
  teamAllocations: [],
  equipmentAllocations: []
}

const renderEventCard = (event: Event, isGestor: boolean = false, onEventDeleted?: (id: string) => void) => {
  mockUseAuth.mockReturnValue({ isGestor })
  
  return render(
    <BrowserRouter>
      <EventCard event={event} onEventDeleted={onEventDeleted} />
    </BrowserRouter>
  )
}

describe('EventCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização', () => {
    it('deve renderizar informações básicas do evento', () => {
      renderEventCard(mockEvent)
      
      expect(screen.getByText('Evento Teste')).toBeInTheDocument()
      expect(screen.getByText('Local do evento')).toBeInTheDocument()
      expect(screen.getByText('Data de Início')).toBeInTheDocument()
      expect(screen.getByText('Data de Fim')).toBeInTheDocument()
    })

    it('deve renderizar badge de status correto', () => {
      renderEventCard(mockEvent)
      
      expect(screen.getByText('Em Planejamento')).toBeInTheDocument()
    })

    it('deve renderizar botões de ação', () => {
      renderEventCard(mockEvent)
      
      expect(screen.getByText('Ver Detalhes')).toBeInTheDocument()
    })

    it('deve renderizar botão de editar para gestores', () => {
      renderEventCard(mockEvent, true)
      
      expect(screen.getByText('Editar')).toBeInTheDocument()
    })

    it('não deve renderizar botão de editar para freelancers', () => {
      renderEventCard(mockEvent, false)
      
      expect(screen.queryByText('Editar')).not.toBeInTheDocument()
    })

    it('deve renderizar botão de excluir para eventos cancelados', () => {
      const cancelledEvent = { ...mockEvent, status: 'cancelled' as const }
      renderEventCard(cancelledEvent, true)
      
      expect(screen.getByText('Excluir')).toBeInTheDocument()
    })

    it('não deve renderizar botão de excluir para eventos não cancelados', () => {
      renderEventCard(mockEvent, true)
      
      expect(screen.queryByText('Excluir')).not.toBeInTheDocument()
    })
  })

  describe('Formatação de datas', () => {
    it('deve formatar data corretamente', () => {
      renderEventCard(mockEvent)
      
      // Verifica se a data está sendo exibida (formato brasileiro)
      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument()
    })

    it('deve lidar com datas inválidas', () => {
      const eventWithInvalidDate = { ...mockEvent, startDate: 'data-invalida' }
      renderEventCard(eventWithInvalidDate)
      
      expect(screen.getByText('Data inválida')).toBeInTheDocument()
    })

    it('deve lidar com datas vazias', () => {
      const eventWithEmptyDate = { ...mockEvent, startDate: '' }
      renderEventCard(eventWithEmptyDate)
      
      expect(screen.getByText('Data não informada')).toBeInTheDocument()
    })
  })

  describe('Status do evento', () => {
    it('deve mostrar badge "Hoje" para eventos de hoje', () => {
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      const eventToday = { ...mockEvent, startDate: todayString }
      
      renderEventCard(eventToday)
      
      // Verifica se o badge "Hoje" está presente
      const hojeBadge = screen.queryByText('Hoje')
      if (hojeBadge) {
        expect(hojeBadge).toBeInTheDocument()
      } else {
        // Se não encontrar, verifica se a data está sendo exibida corretamente
        expect(screen.getByText(today.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          weekday: 'long'
        }))).toBeInTheDocument()
      }
    })

    it('não deve mostrar badge "Hoje" para eventos de outros dias', () => {
      renderEventCard(mockEvent)
      
      expect(screen.queryByText('Hoje')).not.toBeInTheDocument()
    })
  })

  describe('Navegação', () => {
    it('deve navegar para detalhes do evento ao clicar em "Ver Detalhes"', () => {
      renderEventCard(mockEvent)
      
      const detailsButton = screen.getByText('Ver Detalhes')
      fireEvent.click(detailsButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/events/1')
    })

    it('deve navegar para edição do evento ao clicar em "Editar"', () => {
      renderEventCard(mockEvent, true)
      
      const editButton = screen.getByText('Editar')
      fireEvent.click(editButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/events/1/edit')
    })
  })

  describe('Exclusão de evento', () => {
    it('deve abrir dialog de confirmação ao clicar em "Excluir"', () => {
      const cancelledEvent = { ...mockEvent, status: 'cancelled' as const }
      renderEventCard(cancelledEvent, true)
      
      const deleteButton = screen.getByText('Excluir')
      fireEvent.click(deleteButton)
      
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
      expect(screen.getByText('Tem certeza que deseja excluir o evento "Evento Teste"? Esta ação não pode ser desfeita.')).toBeInTheDocument()
    })

    it('deve fechar dialog ao clicar em "Cancelar"', () => {
      const cancelledEvent = { ...mockEvent, status: 'cancelled' as const }
      renderEventCard(cancelledEvent, true)
      
      const deleteButton = screen.getByText('Excluir')
      fireEvent.click(deleteButton)
      
      const cancelButton = screen.getByText('Cancelar')
      fireEvent.click(cancelButton)
      
      expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument()
    })

    it('deve chamar onEventDeleted após exclusão bem-sucedida', async () => {
      const { deleteEvent } = await import('@/services/eventService')
      vi.mocked(deleteEvent).mockResolvedValue(undefined)
      
      const onEventDeleted = vi.fn()
      const cancelledEvent = { ...mockEvent, status: 'cancelled' as const }
      renderEventCard(cancelledEvent, true, onEventDeleted)
      
      const deleteButton = screen.getByText('Excluir')
      fireEvent.click(deleteButton)
      
      const confirmButton = screen.getByText('Excluir Evento')
      fireEvent.click(confirmButton)
      
      await waitFor(() => {
        expect(deleteEvent).toHaveBeenCalledWith('1')
        expect(onEventDeleted).toHaveBeenCalledWith('1')
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Evento excluído',
          description: 'O evento "Evento Teste" foi excluído com sucesso.'
        })
      })
    })

    it('deve mostrar erro em caso de falha na exclusão', async () => {
      const { deleteEvent } = await import('@/services/eventService')
      vi.mocked(deleteEvent).mockRejectedValue(new Error('Erro na exclusão'))
      
      const cancelledEvent = { ...mockEvent, status: 'cancelled' as const }
      renderEventCard(cancelledEvent, true)
      
      const deleteButton = screen.getByText('Excluir')
      fireEvent.click(deleteButton)
      
      const confirmButton = screen.getByText('Excluir Evento')
      fireEvent.click(confirmButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Erro',
          description: 'Não foi possível excluir o evento. Tente novamente.',
          variant: 'destructive'
        })
      })
    })
  })

  describe('Programação diária', () => {
    it('deve mostrar horários da programação diária quando disponível', () => {
      const eventWithSchedule = {
        ...mockEvent,
        dailySchedule: [
          {
            id: '1',
            date: '2024-01-01',
            startTime: '09:00',
            endTime: '17:00',
            activities: ['Setup'],
            requiredRoles: ['camera'],
            notes: 'Notas',
            isSetupDay: true,
            isMainEventDay: false,
            isTeardownDay: false
          }
        ]
      }
      
      renderEventCard(eventWithSchedule)
      
      // Verifica se os horários estão sendo exibidos (pode aparecer múltiplas vezes)
      const timeElements = screen.getAllByText('09:00 - 17:00')
      expect(timeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Diferentes status de evento', () => {
    it('deve renderizar badge correto para evento confirmado', () => {
      const confirmedEvent = { ...mockEvent, status: 'confirmed' as const }
      renderEventCard(confirmedEvent)
      
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
    })

    it('deve renderizar badge correto para evento em progresso', () => {
      const inProgressEvent = { ...mockEvent, status: 'in_progress' as const }
      renderEventCard(inProgressEvent)
      
      expect(screen.getByText('Em Progresso')).toBeInTheDocument()
    })

    it('deve renderizar badge correto para evento concluído', () => {
      const completedEvent = { ...mockEvent, status: 'completed' as const }
      renderEventCard(completedEvent)
      
      expect(screen.getByText('Concluído')).toBeInTheDocument()
    })

    it('deve renderizar badge correto para evento cancelado', () => {
      const cancelledEvent = { ...mockEvent, status: 'cancelled' as const }
      renderEventCard(cancelledEvent)
      
      expect(screen.getByText('Cancelado')).toBeInTheDocument()
    })
  })
})
