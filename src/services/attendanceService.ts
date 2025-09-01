import { AttendanceList, AttendanceRecord, AttendanceStatus } from '@/types';
import { buildApiUrl, getAuthHeaders } from '@/config/api';

// Attendance service functions - Conectado ao PostgreSQL
export const getAttendanceList = async (eventId: string): Promise<AttendanceList | undefined> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos undefined
    return undefined;
  } catch (error) {
    console.error('Erro ao buscar lista de presença:', error);
    return undefined;
  }
};

export const updateAttendanceStatus = async (
  allocationId: string,
  date: string,
  status: AttendanceStatus,
  notes?: string
): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/teams/attendance/:allocationId', { allocationId }), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, status, notes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar status de presença');
    }
  } catch (error) {
    console.error('Erro ao atualizar status de presença:', error);
    throw error;
  }
};

export const confirmDailyPayment = async (allocationId: string, date: string): Promise<void> => {
  try {
    const response = await fetch(buildApiUrl('/teams/payment/:allocationId/confirm', { allocationId }), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao confirmar pagamento diário');
    }
  } catch (error) {
    console.error('Erro ao confirmar pagamento diário:', error);
    throw error;
  }
};

export const getEventAttendanceStats = async (eventId: string): Promise<{
  totalAllocations: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos dados vazios
    return {
      totalAllocations: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de presença:', error);
    return {
      totalAllocations: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0,
    };
  }
};

export const getUserAttendanceHistory = async (userId: string): Promise<AttendanceRecord[]> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos array vazio
    return [];
  } catch (error) {
    console.error('Erro ao buscar histórico de presença:', error);
    return [];
  }
};

// Bulk attendance operations
export const markAllPresent = async (eventId: string, date: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
  } catch (error) {
    console.error('Erro ao marcar todos como presentes:', error);
    throw error;
  }
};

export const markAllAbsent = async (eventId: string, date: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
  } catch (error) {
    console.error('Erro ao marcar todos como ausentes:', error);
    throw error;
  }
};

// Attendance reporting
export const generateAttendanceReport = async (
  eventId: string,
  startDate: string,
  endDate: string
): Promise<{
  eventId: string;
  period: { start: string; end: string };
  totalDays: number;
  totalAllocations: number;
  dailyStats: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  }>;
  userStats: Array<{
    userId: string;
    userName: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  }>;
}> => {
  try {
    // Esta funcionalidade será implementada quando tivermos a rota específica
    // Por enquanto, retornamos dados vazios
    return {
      eventId,
      period: { start: startDate, end: endDate },
      totalDays: 0,
      totalAllocations: 0,
      dailyStats: [],
      userStats: [],
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de presença:', error);
    return {
      eventId,
      period: { start: startDate, end: endDate },
      totalDays: 0,
      totalAllocations: 0,
      dailyStats: [],
      userStats: [],
    };
  }
};

// Attendance validation
export const validateAttendanceDate = (date: string, eventStartDate: string, eventEndDate: string): boolean => {
  const attendanceDate = new Date(date);
  const startDate = new Date(eventStartDate);
  const endDate = new Date(eventEndDate);
  
  return attendanceDate >= startDate && attendanceDate <= endDate;
};

export const canUpdateAttendance = (eventDate: string): boolean => {
  const eventDateObj = new Date(eventDate);
  const now = new Date();
  const daysDifference = Math.ceil((now.getTime() - eventDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  // Permite atualizar presença até 7 dias após o evento
  return daysDifference <= 7;
};

// Attendance notifications
export const sendAttendanceReminder = async (eventId: string, date: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos sistema de notificações
    console.log(`Lembrete de presença enviado para evento ${eventId} na data ${date}`);
  } catch (error) {
    console.error('Erro ao enviar lembrete de presença:', error);
    throw error;
  }
};

export const sendLateNotification = async (userId: string, eventId: string, date: string): Promise<void> => {
  try {
    // Esta funcionalidade será implementada quando tivermos sistema de notificações
    console.log(`Notificação de atraso enviada para usuário ${userId} no evento ${eventId} na data ${date}`);
  } catch (error) {
    console.error('Erro ao enviar notificação de atraso:', error);
    throw error;
  }
};
