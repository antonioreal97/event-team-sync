import { EventType, TeamType, Event } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';

// Configuração de preços por tipo de evento e equipe
const PRICING_CONFIG = {
  normal: {
    equipe_a: 250, // R$ 250 por diária para Equipe A em eventos normais
    equipe_b: 200, // R$ 200 por diária para Equipe B em eventos normais
  },
  especial: {
    equipe_a: 300, // R$ 300 por diária para Equipe A em eventos especiais
    equipe_b: 250, // R$ 250 por diária para Equipe B em eventos especiais
  },
};

/**
 * Calcula o valor por diária baseado no tipo de evento e equipe
 */
export const calculateDailyRate = (eventType: EventType, teamType: TeamType): number => {
  return PRICING_CONFIG[eventType][teamType];
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
    equipe_a: {
      dailyRate: number;
      totalPayment: number;
    };
    equipe_b: {
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
      equipe_a: {
        dailyRate: calculateDailyRate(event.eventType, 'equipe_a'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(event.eventType, 'equipe_a'),
          totalDays
        ),
      },
      equipe_b: {
        dailyRate: calculateDailyRate(event.eventType, 'equipe_b'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(event.eventType, 'equipe_b'),
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
    
    if (event.teamPriority === 'equipe_a') {
      notes.push('Prioridade para Equipe A');
    } else if (event.teamPriority === 'equipe_b') {
      notes.push('Prioridade para Equipe B');
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
      equipe_a: { count: 0, totalRevenue: 0 },
      equipe_b: { count: 0, totalRevenue: 0 },
      sem_equipe: { count: 0, totalRevenue: 0 },
    };

    let totalRevenue = 0;
    let totalDailyRates = 0;
    const eventRevenues: Array<{ eventId: string; title: string; revenue: number; days: number }> = [];

    for (const event of events) {
      const totalDays = calculateWorkingDays(event.startDate, event.endDate);
      
      // Calcular receita para Equipe A
      const revenueTeamA = calculateDiscountedPayment(
        calculateDailyRate(event.eventType, 'equipe_a'),
        totalDays
      );
      
      // Calcular receita para Equipe B
      const revenueTeamB = calculateDiscountedPayment(
        calculateDailyRate(event.eventType, 'equipe_b'),
        totalDays
      );
      
      // Assumir que o evento usa a equipe prioritária
      const eventRevenue = event.teamPriority === 'equipe_b' ? revenueTeamB : revenueTeamA;
      
      totalRevenue += eventRevenue;
      totalDailyRates += calculateDailyRate(event.eventType, 'equipe_a');
      
      // Contar por tipo de evento
      pricingByType[event.eventType].count++;
      pricingByType[event.eventType].totalRevenue += eventRevenue;
      
      // Contar por equipe (assumir equipe prioritária)
      const teamType = event.teamPriority || 'sem_equipe';
      pricingByTeam[teamType].count++;
      pricingByTeam[teamType].totalRevenue += eventRevenue;
      
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
 * Calcula diferença percentual entre preços de equipes
 */
export const calculateTeamPriceDifference = (eventType: EventType): number => {
  const teamAPrice = PRICING_CONFIG[eventType].equipe_a;
  const teamBPrice = PRICING_CONFIG[eventType].equipe_b;
  
  return ((teamAPrice - teamBPrice) / teamBPrice) * 100;
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
