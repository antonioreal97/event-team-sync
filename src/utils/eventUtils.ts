import { Event } from '@/types';

// Função para transformar dados do backend (snake_case) para frontend (camelCase)
export const transformEventFromBackend = (backendEvent: any): Event => {
  // Log temporário para debug
  console.log('🔍 TRANSFORMANDO EVENTO:', {
    id: backendEvent.id,
    title: backendEvent.title,
    start_date: backendEvent.start_date,
    end_date: backendEvent.end_date,
    startDate: backendEvent.startDate,
    endDate: backendEvent.endDate
  });

  // Função auxiliar para corrigir datas de timezone
  const fixTimezoneDate = (dateString: string) => {
    if (!dateString) {
      console.log('❌ Data vazia recebida:', dateString);
      return null;
    }
    
    console.log('📅 Processando data:', dateString, 'Tipo:', typeof dateString);
    
    try {
      // Se a data já está no formato YYYY-MM-DD, retornar como está
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('✅ Data já está no formato correto:', dateString);
        return dateString;
      }
      
      // Se é uma data com timezone (ISO string), extrair apenas a data sem conversão
      if (dateString.includes('T')) {
        const extractedDate = dateString.split('T')[0];
        console.log('🔄 Extraindo data de ISO string:', dateString, '->', extractedDate);
        return extractedDate;
      }
      
      // Para datas do PostgreSQL com timezone (ex: "2025-09-12 00:00:00+00")
      if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        const extractedDate = dateString.split(' ')[0];
        console.log('🔄 Extraindo data de PostgreSQL:', dateString, '->', extractedDate);
        return extractedDate;
      }
      
      // Para outros formatos, tentar criar uma data
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('❌ Data inválida criada:', dateString);
        return null;
      }
      
      // Usar UTC para evitar conversão de timezone
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('🔄 Data formatada com UTC:', dateString, '->', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('❌ Erro ao corrigir timezone da data:', error);
      return null;
    }
  };

  const transformedEvent = {
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
    // Alocações de equipe - transformar snake_case para camelCase
    teamAllocations: (backendEvent.teamAllocations || []).map((allocation: any) => ({
      id: allocation.id,
      eventId: allocation.event_id,
      userId: allocation.user_id,
      assignedRole: allocation.assigned_role,
      status: allocation.status,
      assignedAt: allocation.assigned_at,
      confirmedAt: allocation.confirmed_at,
      cancelledAt: allocation.cancelled_at,
      cancellationReason: allocation.cancellation_reason,
      dailyRate: allocation.daily_rate,
      totalDays: allocation.total_days,
      totalPayment: allocation.total_payment,
      totalHours: allocation.total_hours,
      attendance: allocation.attendance || [],
      attended: allocation.attended,
      checkInTime: allocation.check_in_time,
      checkOutTime: allocation.check_out_time,
      cancellationDeadline: allocation.cancellation_deadline,
      confirmationDeadline: allocation.confirmation_deadline,
      notes: allocation.notes,
      createdAt: allocation.created_at,
      updatedAt: allocation.updated_at,
    })),
    equipmentAllocations: backendEvent.equipmentAllocations || [],
  };

  console.log('✅ EVENTO TRANSFORMADO:', {
    id: transformedEvent.id,
    title: transformedEvent.title,
    startDate: transformedEvent.startDate,
    endDate: transformedEvent.endDate
  });

  return transformedEvent;
};
