import { Event } from '@/types';

// Função para transformar dados do backend (snake_case) para frontend (camelCase)
export const transformEventFromBackend = (backendEvent: any): Event => {
  // Função auxiliar para corrigir datas de timezone
  const fixTimezoneDate = (dateString: string) => {
    if (!dateString) return dateString;
    
    // Se a data já está no formato YYYY-MM-DD, retornar como está
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Se é uma data com timezone (ISO string), extrair apenas a data sem conversão
    try {
      // Para datas ISO como "2025-09-12T00:00:00.000Z", extrair apenas "2025-09-12"
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      
      // Para outros formatos, tentar criar uma data
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Usar UTC para evitar conversão de timezone
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Erro ao corrigir timezone da data:', error);
      return dateString;
    }
  };



  return {
    id: backendEvent.id,
    title: backendEvent.title,
    description: backendEvent.description,
    location: backendEvent.location,
    startDate: fixTimezoneDate(backendEvent.start_date),
    endDate: fixTimezoneDate(backendEvent.end_date),
    status: backendEvent.status,
    createdBy: backendEvent.created_by,
    createdAt: backendEvent.created_at,
    updatedAt: backendEvent.updated_at,
    eventType: backendEvent.event_type,
    estimatedDuration: backendEvent.estimated_duration,
    budget: backendEvent.budget,
    requirements: backendEvent.requirements || [],
    notes: backendEvent.notes,
    teamPriority: backendEvent.team_priority,
    allowTeamB: backendEvent.allow_team_b,
    dailyRateTeamA: backendEvent.daily_rate_team_a,
    dailyRateTeamB: backendEvent.daily_rate_team_b,
    isMultiDay: backendEvent.is_multi_day,
    totalDays: backendEvent.total_days,
    workingDays: backendEvent.working_days || [],
    // Novos campos para programação dos dias
    dailySchedule: backendEvent.daily_schedule || [],
    eventAgenda: backendEvent.event_agenda || '',
    specialInstructions: backendEvent.special_instructions || '',
    setupRequirements: backendEvent.setup_requirements || '',
    technicalSpecifications: backendEvent.technical_specifications || '',
  };
};
