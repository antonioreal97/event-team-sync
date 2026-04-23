import { EventType, TeamType, Event } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Configuração de preços por tipo de evento e nível de experiência
const PRICING_CONFIG = {
  normal: {
    iniciante: 200, // R$ 200 por diária para Iniciante em eventos normais (mesmo valor de Intermediário)
    intermediario: 200, // R$ 200 por diária para Intermediário em eventos normais (mesmo valor de Iniciante)
    avancado: 250, // R$ 250 por diária para Avançado em eventos normais
    sem_equipe: 200, // Valor padrão para sem equipe
  },
  especial: {
    iniciante: 250, // R$ 250 por diária para Iniciante em eventos especiais (mesmo valor de Intermediário)
    intermediario: 250, // R$ 250 por diária para Intermediário em eventos especiais (mesmo valor de Iniciante)
    avancado: 300, // R$ 300 por diária para Avançado em eventos especiais
    sem_equipe: 250, // Valor padrão para sem equipe
  },
};

/**
 * Calcula o valor por diária baseado no tipo de evento e nível de experiência
 */
export const calculateDailyRate = (eventType: EventType, teamType: TeamType): number => {
  // Se for sem_equipe, usar valor de iniciante como padrão
  const level = teamType === 'sem_equipe' ? 'iniciante' : teamType;
  return PRICING_CONFIG[eventType][level as keyof typeof PRICING_CONFIG.normal];
};

/**
 * Calcula o pagamento total baseado na diária e número de dias
 */
export const calculateTotalPayment = (dailyRate: number, totalDays: number): number => {
  return dailyRate * totalDays;
};

/**
 * Calcula a data limite para cancelamento (5 dias antes do evento)
 */
export const calculateCancellationDeadline = (eventStartDate: string): Date => {
  const startDate = new Date(eventStartDate);
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() - 5);
  return deadline;
};

/**
 * Calcula os dias de trabalho baseado nas datas de início e fim
 */
export const calculateWorkingDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) return 0;
  
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Para eventos, incluímos o dia final (ex: 11/09 a 13/09 = 3 dias)
  return Math.max(1, daysDiff + 1);
};

/**
 * Gera resumo de preços para um evento
 */
export const generateEventPricingSummary = async (event: Event): Promise<{
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  totalDays: number;
  pricing: {
    iniciante: {
      dailyRate: number;
      totalPayment: number;
    };
    intermediario: {
      dailyRate: number;
      totalPayment: number;
    };
    avancado: {
      dailyRate: number;
      totalPayment: number;
    };
  };
  cancellationDeadline: Date;
  notes: string[];
}> => {
  try {
    const totalDays = calculateWorkingDays(event.startDate, event.endDate);
    const cancellationDeadline = calculateCancellationDeadline(event.startDate);
    
    const pricing = {
      iniciante: {
        dailyRate: calculateDailyRate(event.eventType, 'iniciante'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(event.eventType, 'iniciante'),
          totalDays
        ),
      },
      intermediario: {
        dailyRate: calculateDailyRate(event.eventType, 'intermediario'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(event.eventType, 'intermediario'),
          totalDays
        ),
      },
      avancado: {
        dailyRate: calculateDailyRate(event.eventType, 'avancado'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(event.eventType, 'avancado'),
          totalDays
        ),
      },
    };

    const notes: string[] = [];
    
    if (event.eventType === 'especial') {
      notes.push('Evento especial com tarifas premium');
    }
    
    if (totalDays > 1) {
      notes.push(`Evento de ${totalDays} dias com desconto por volume`);
    }
    
    if (event.teamPriority === 'iniciante') {
      notes.push('Prioridade para nível Iniciante');
    } else if (event.teamPriority === 'intermediario') {
      notes.push('Prioridade para nível Intermediário');
    } else if (event.teamPriority === 'avancado') {
      notes.push('Prioridade para nível Avançado');
    }

    return {
      eventId: event.id,
      eventTitle: event.title,
      eventType: event.eventType,
      totalDays,
      pricing,
      cancellationDeadline,
      notes,
    };
  } catch (error) {
    console.error('Erro ao gerar resumo de preços:', error);
    throw error;
  }
};

/**
 * Calcula desconto por volume para eventos multi-dia
 */
export const calculateVolumeDiscount = (totalDays: number): number => {
  if (totalDays <= 1) return 0;
  if (totalDays <= 3) return 0.05; // 5% de desconto para 2-3 dias
  if (totalDays <= 7) return 0.10; // 10% de desconto para 4-7 dias
  return 0.15; // 15% de desconto para mais de 7 dias
};

/**
 * Aplica desconto por volume ao pagamento total
 */
export const applyVolumeDiscount = (totalPayment: number, totalDays: number): number => {
  const discountRate = calculateVolumeDiscount(totalDays);
  const discount = totalPayment * discountRate;
  return totalPayment - discount;
};

/**
 * Calcula pagamento com desconto por volume
 */
export const calculateDiscountedPayment = (dailyRate: number, totalDays: number): number => {
  const basePayment = calculateTotalPayment(dailyRate, totalDays);
  return applyVolumeDiscount(basePayment, totalDays);
};

/**
 * Gera relatório de preços para múltiplos eventos
 */
export const generatePricingReport = async (events: Event[]): Promise<{
  totalEvents: number;
  totalRevenue: number;
  averageDailyRate: number;
  pricingByType: Record<EventType, { count: number; totalRevenue: number }>;
  pricingByTeam: Record<TeamType, { count: number; totalRevenue: number }>;
  topRevenueEvents: Array<{
    eventId: string;
    title: string;
    revenue: number;
    days: number;
  }>;
}> => {
  try {
    const pricingByType: Record<EventType, { count: number; totalRevenue: number }> = {
      normal: { count: 0, totalRevenue: 0 },
      especial: { count: 0, totalRevenue: 0 },
    };

    const pricingByTeam: Record<TeamType, { count: number; totalRevenue: number }> = {
      iniciante: { count: 0, totalRevenue: 0 },
      intermediario: { count: 0, totalRevenue: 0 },
      avancado: { count: 0, totalRevenue: 0 },
      sem_equipe: { count: 0, totalRevenue: 0 },
    };

    let totalRevenue = 0;
    let totalDailyRates = 0;
    const eventRevenues: Array<{ eventId: string; title: string; revenue: number; days: number }> = [];

    for (const event of events) {
      const totalDays = calculateWorkingDays(event.startDate, event.endDate);
      
      // Calcular receita para cada nível
      const revenueIniciante = calculateDiscountedPayment(
        calculateDailyRate(event.eventType, 'iniciante'),
        totalDays
      );
      
      const revenueIntermediario = calculateDiscountedPayment(
        calculateDailyRate(event.eventType, 'intermediario'),
        totalDays
      );
      
      const revenueAvancado = calculateDiscountedPayment(
        calculateDailyRate(event.eventType, 'avancado'),
        totalDays
      );
      
      // Assumir que o evento usa o nível prioritário
      let eventRevenue = revenueIniciante;
      if (event.teamPriority === 'intermediario') {
        eventRevenue = revenueIntermediario;
      } else if (event.teamPriority === 'avancado') {
        eventRevenue = revenueAvancado;
      }
      
      totalRevenue += eventRevenue;
      const priorityForRate = (event.teamPriority && event.teamPriority !== 'ambas') ? event.teamPriority : 'iniciante';
      totalDailyRates += calculateDailyRate(event.eventType, priorityForRate as 'iniciante' | 'intermediario' | 'avancado');
      
      // Contar por tipo de evento
      pricingByType[event.eventType].count++;
      pricingByType[event.eventType].totalRevenue += eventRevenue;
      
      // Contar por nível (assumir nível prioritário)
      const teamType = event.teamPriority || 'sem_equipe';
      pricingByTeam[teamType as TeamType].count++;
      pricingByTeam[teamType as TeamType].totalRevenue += eventRevenue;
      
      eventRevenues.push({
        eventId: event.id,
        title: event.title,
        revenue: eventRevenue,
        days: totalDays,
      });
    }

    const averageDailyRate = events.length > 0 ? totalDailyRates / events.length : 0;
    
    // Ordenar eventos por receita
    const topRevenueEvents = eventRevenues
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalEvents: events.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageDailyRate: Math.round(averageDailyRate * 100) / 100,
      pricingByType,
      pricingByTeam,
      topRevenueEvents,
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de preços:', error);
    throw error;
  }
};

/**
 * Valida se um preço está dentro dos limites aceitáveis
 */
export const validatePricing = (dailyRate: number, eventType: EventType, teamType: TeamType): {
  isValid: boolean;
  minRate: number;
  maxRate: number;
  reason?: string;
} => {
  const expectedRate = calculateDailyRate(eventType, teamType);
  const minRate = expectedRate * 0.8; // 20% abaixo do esperado
  const maxRate = expectedRate * 1.2; // 20% acima do esperado
  
  if (dailyRate < minRate) {
    return {
      isValid: false,
      minRate,
      maxRate,
      reason: `Taxa diária muito baixa. Mínimo esperado: R$ ${minRate}`,
    };
  }
  
  if (dailyRate > maxRate) {
    return {
      isValid: false,
      minRate,
      maxRate,
      reason: `Taxa diária muito alta. Máximo esperado: R$ ${maxRate}`,
    };
  }
  
  return {
    isValid: true,
    minRate,
    maxRate,
  };
};

/**
 * Obtém configuração de preços atual
 */
export const getPricingConfig = () => {
  return { ...PRICING_CONFIG };
};

/**
 * Calcula diferença percentual entre preços de níveis de experiência
 */
export const calculateTeamPriceDifference = (eventType: EventType): number => {
  const avancadoPrice = PRICING_CONFIG[eventType].avancado;
  const iniciantePrice = PRICING_CONFIG[eventType].iniciante;
  
  return ((avancadoPrice - iniciantePrice) / iniciantePrice) * 100;
};

/**
 * Calcula o total de dias entre duas datas
 */
export const calculateTotalDays = (startDate: string, endDate: string): number => {
  return calculateWorkingDays(startDate, endDate);
};

/**
 * Verifica se um evento é multi-dia
 */
export const isMultiDayEvent = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) return false;
  
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return daysDiff > 1;
};

/**
 * Obtém descrição do tipo de evento
 */
export const getEventTypeDescription = (eventType: EventType): string => {
  return eventType === 'especial' ? 'Evento Especial' : 'Evento Normal';
};
