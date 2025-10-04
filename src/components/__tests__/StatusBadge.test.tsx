import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  describe('Status de eventos', () => {
    it('deve renderizar badge "Em Planejamento" para status planning', () => {
      render(<StatusBadge status="planning" />)
      
      const badge = screen.getByText('Em Planejamento')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-500/10', 'text-blue-400', 'border-blue-500/20')
    })

    it('deve renderizar badge "Ativo" para status active', () => {
      render(<StatusBadge status="active" />)
      
      const badge = screen.getByText('Ativo')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-primary/10', 'text-primary', 'border-primary/20', 'neon-glow')
    })

    it('deve renderizar badge "Concluído" para status completed', () => {
      render(<StatusBadge status="completed" />)
      
      const badge = screen.getByText('Concluído')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-500/10', 'text-green-400', 'border-green-500/20')
    })

    it('deve renderizar badge "Cancelado" para status cancelled', () => {
      render(<StatusBadge status="cancelled" />)
      
      const badge = screen.getByText('Cancelado')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-500/10', 'text-red-400', 'border-red-500/20')
    })
  })

  describe('Status de alocações', () => {
    it('deve renderizar badge "Pendente" para status pending', () => {
      render(<StatusBadge status="pending" />)
      
      const badge = screen.getByText('Pendente')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-500/10', 'text-yellow-400', 'border-yellow-500/20')
    })

    it('deve renderizar badge "Confirmado" para status confirmed', () => {
      render(<StatusBadge status="confirmed" />)
      
      const badge = screen.getByText('Confirmado')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-primary/10', 'text-primary', 'border-primary/20', 'neon-glow')
    })

    it('deve renderizar badge "Recusado" para status rejected', () => {
      render(<StatusBadge status="rejected" />)
      
      const badge = screen.getByText('Recusado')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-500/10', 'text-red-400', 'border-red-500/20')
    })
  })

  describe('Status inválido', () => {
    it('deve retornar null para status inválido', () => {
      const { container } = render(<StatusBadge status="invalid" as any />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Classes CSS', () => {
    it('deve aplicar classes corretas para todos os badges', () => {
      const statuses = [
        'planning',
        'active', 
        'completed',
        'cancelled',
        'pending',
        'confirmed',
        'rejected'
      ] as const

      statuses.forEach(status => {
        const { unmount } = render(<StatusBadge status={status} />)
        
        const badge = screen.getByText(/Em Planejamento|Ativo|Concluído|Cancelado|Pendente|Confirmado|Recusado/)
        expect(badge).toHaveClass('font-medium')
        // Verifica se tem alguma classe hover:bg-
        const classList = Array.from(badge.classList)
        const hasHoverBg = classList.some(cls => cls.startsWith('hover:bg-'))
        expect(hasHoverBg).toBe(true)
        
        unmount()
      })
    })

    it('deve aplicar classe neon-glow para status ativos', () => {
      const activeStatuses = ['active', 'confirmed'] as const

      activeStatuses.forEach(status => {
        const { unmount } = render(<StatusBadge status={status} />)
        
        const badge = screen.getByText(/Ativo|Confirmado/)
        expect(badge).toHaveClass('neon-glow')
        
        unmount()
      })
    })

    it('não deve aplicar classe neon-glow para status inativos', () => {
      const inactiveStatuses = ['planning', 'completed', 'cancelled', 'pending', 'rejected'] as const

      inactiveStatuses.forEach(status => {
        const { unmount } = render(<StatusBadge status={status} />)
        
        const badges = screen.getAllByRole('generic')
        const badge = badges[0]
        expect(badge).not.toHaveClass('neon-glow')
        
        unmount()
      })
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter texto descritivo para cada status', () => {
      const statusTexts = {
        planning: 'Em Planejamento',
        active: 'Ativo',
        completed: 'Concluído',
        cancelled: 'Cancelado',
        pending: 'Pendente',
        confirmed: 'Confirmado',
        rejected: 'Recusado'
      }

      Object.entries(statusTexts).forEach(([status, expectedText]) => {
        const { unmount } = render(<StatusBadge status={status as any} />)
        
        expect(screen.getByText(expectedText)).toBeInTheDocument()
        
        unmount()
      })
    })
  })
})
