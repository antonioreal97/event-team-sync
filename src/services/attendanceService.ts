import { AttendanceList, AttendanceRecord, AttendanceStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Interface para dados internos de presença
interface AttendanceListItem {
  allocationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  role: string;
  dailyRate: number;
  totalDays: number;
  attendanceRecords: AttendanceRecord[];
  totalPayment: number;
  status: string;
}

// Attendance service functions - Conectado ao Supabase
export const getAttendanceByAllocation = async (allocationId: string): Promise<AttendanceRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('team_allocation_id', allocationId)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDatabaseAttendanceToAttendance);
  } catch (error) {
    console.error('Erro ao buscar registro de presença:', error);
    return [];
  }
};

// Marcar presença de um usuário em uma data específica
export const markAttendance = async (allocationId: string, date: string, status: AttendanceStatus, notes?: string): Promise<AttendanceRecord> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert({
        team_allocation_id: allocationId,
        date,
        status,
        notes: notes || '',
        daily_payment: 0, // Will be updated with actual daily rate
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseAttendanceToAttendance(data);
  } catch (error) {
    console.error('Erro ao marcar presença:', error);
    throw error;
  }
};

// Confirmar pagamento de presença
export const confirmAttendancePayment = async (allocationId: string, date: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('attendance_records')
      .update({ 
        payment_confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.id
      })
      .eq('team_allocation_id', allocationId)
      .eq('date', date);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao confirmar pagamento de presença:', error);
    throw error;
  }
};

// Buscar lista de presença para um evento
export const getEventAttendanceList = async (eventId: string): Promise<AttendanceListItem[]> => {
  try {
    // Buscar alocações de equipe para o evento
    const { data: allocations, error: allocError } = await supabase
      .from('team_allocations')
      .select(`
        id,
        user_id,
        assigned_role,
        daily_rate,
        total_days,
        total_payment,
        status,
        user:users(id, name, email)
      `)
      .eq('event_id', eventId);

    if (allocError) throw allocError;

    // Para cada alocação, buscar registros de presença
    const attendanceLists: AttendanceListItem[] = [];
    
    for (const allocation of allocations || []) {
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('team_allocation_id', allocation.id);

      if (attendanceError) throw attendanceError;

      attendanceLists.push({
        allocationId: allocation.id,
        userId: allocation.user_id,
        userName: allocation.user?.name || 'Nome não encontrado',
        userEmail: allocation.user?.email || 'Email não encontrado',
        eventId: eventId,
        role: allocation.assigned_role,
        dailyRate: allocation.daily_rate,
        totalDays: allocation.total_days,
        attendanceRecords: (attendanceRecords || []).map(mapDatabaseAttendanceToAttendance),
        totalPayment: allocation.total_payment,
        status: allocation.status,
      });
    }

    return attendanceLists;
  } catch (error) {
    console.error('Erro ao buscar lista de presença do evento:', error);
    return [];
  }
};

// Mapper function to convert database attendance to frontend attendance
const mapDatabaseAttendanceToAttendance = (dbAttendance: any): AttendanceRecord => {
  return {
    id: dbAttendance.id,
    date: dbAttendance.date,
    status: dbAttendance.status || 'pending',
    dailyPayment: dbAttendance.daily_payment || 0,
    paymentConfirmed: dbAttendance.payment_confirmed || false,
    notes: dbAttendance.notes || '',
    confirmedAt: dbAttendance.confirmed_at,
    confirmedBy: dbAttendance.confirmed_by,
  };
};

// Buscar estatísticas de presença para um usuário
export const getUserAttendanceStats = async (userId: string): Promise<{
  totalEvents: number;
  attendedEvents: number;
  pendingEvents: number;
  attendanceRate: number;
}> => {
  try {
    // Buscar todas as alocações do usuário
    const { data: allocations, error: allocError } = await supabase
      .from('team_allocations')
      .select('id')
      .eq('user_id', userId);

    if (allocError) throw allocError;

    if (!allocations || allocations.length === 0) {
      return {
        totalEvents: 0,
        attendedEvents: 0,
        pendingEvents: 0,
        attendanceRate: 0,
      };
    }

    const allocationIds = allocations.map(a => a.id);

    // Buscar registros de presença
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('status')
      .in('team_allocation_id', allocationIds);

    if (attendanceError) throw attendanceError;

    const totalEvents = allocations.length;
    const attendedEvents = (attendanceRecords || []).filter(r => r.status === 'present').length;
    const pendingEvents = (attendanceRecords || []).filter(r => r.status === 'pending').length;
    const attendanceRate = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 0;

    return {
      totalEvents,
      attendedEvents,
      pendingEvents,
      attendanceRate,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de presença:', error);
    return {
      totalEvents: 0,
      attendedEvents: 0,
      pendingEvents: 0,
      attendanceRate: 0,
    };
  }
};

// Legacy functions for compatibility
export const updateAttendanceStatus = markAttendance;
export const confirmDailyPayment = confirmAttendancePayment;

export const getAttendanceList = async (eventId: string): Promise<AttendanceList | undefined> => {
  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('start_date')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    const lists = await getEventAttendanceList(eventId);
    
    if (lists.length === 0) return undefined;

    // Convert to the expected AttendanceList format
    const allocations = lists.map(list => ({
      allocationId: list.allocationId,
      userId: list.userId,
      userName: list.userName,
      assignedRole: list.role as any, // Cast to AudioVisualRole
      attendance: list.attendanceRecords[0] || {
        id: '',
        date: event.start_date.split('T')[0],
        status: 'pending' as AttendanceStatus,
        dailyPayment: list.dailyRate,
        paymentConfirmed: false,
      }
    }));

    return {
      eventId,
      eventDate: event.start_date.split('T')[0],
      allocations,
      totalPresent: allocations.filter(a => a.attendance.status === 'present').length,
      totalAbsent: allocations.filter(a => a.attendance.status === 'absent').length,
      totalLate: allocations.filter(a => a.attendance.status === 'late').length,
      totalPending: allocations.filter(a => a.attendance.status === 'pending').length,
    };
  } catch (error) {
    console.error('Erro ao buscar lista de presença:', error);
    return undefined;
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
    const attendanceLists = await getEventAttendanceList(eventId);
    
    let totalAllocations = attendanceLists.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    attendanceLists.forEach(list => {
      list.attendanceRecords.forEach(record => {
        switch (record.status) {
          case 'present':
            presentCount++;
            break;
          case 'absent':
            absentCount++;
            break;
          case 'late':
            lateCount++;
            break;
        }
      });
    });

    const attendanceRate = totalAllocations > 0 ? (presentCount / totalAllocations) * 100 : 0;

    return {
      totalAllocations,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
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
    // Buscar todas as alocações do usuário
    const { data: allocations, error: allocError } = await supabase
      .from('team_allocations')
      .select('id')
      .eq('user_id', userId);

    if (allocError) throw allocError;

    if (!allocations || allocations.length === 0) {
      return [];
    }

    const allocationIds = allocations.map(a => a.id);

    // Buscar registros de presença
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .in('team_allocation_id', allocationIds)
      .order('date', { ascending: false });

    if (attendanceError) throw attendanceError;

    return (attendanceRecords || []).map(mapDatabaseAttendanceToAttendance);
  } catch (error) {
    console.error('Erro ao buscar histórico de presença:', error);
    return [];
  }
};

// Bulk attendance operations
export const markAllPresent = async (eventId: string, date: string): Promise<void> => {
  try {
    const { data: allocations, error: allocError } = await supabase
      .from('team_allocations')
      .select('id, daily_rate')
      .eq('event_id', eventId);

    if (allocError) throw allocError;

    if (!allocations || allocations.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();

    const updates = allocations.map(allocation => ({
      team_allocation_id: allocation.id,
      date,
      status: 'present' as AttendanceStatus,
      daily_payment: allocation.daily_rate || 0,
      confirmed_at: new Date().toISOString(),
      confirmed_by: user?.id
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(updates);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao marcar todos como presentes:', error);
    throw error;
  }
};

export const markAllAbsent = async (eventId: string, date: string): Promise<void> => {
  try {
    const { data: allocations, error: allocError } = await supabase
      .from('team_allocations')
      .select('id, daily_rate')
      .eq('event_id', eventId);

    if (allocError) throw allocError;

    if (!allocations || allocations.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();

    const updates = allocations.map(allocation => ({
      team_allocation_id: allocation.id,
      date,
      status: 'absent' as AttendanceStatus,
      daily_payment: allocation.daily_rate || 0,
      confirmed_at: new Date().toISOString(),
      confirmed_by: user?.id
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(updates);

    if (error) throw error;
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
    const attendanceLists = await getEventAttendanceList(eventId);
    
    // Calculate daily stats
    const dailyStatsMap = new Map();
    const userStatsMap = new Map();

    attendanceLists.forEach(list => {
      list.attendanceRecords.forEach(record => {
        // Daily stats
        if (!dailyStatsMap.has(record.date)) {
          dailyStatsMap.set(record.date, { present: 0, absent: 0, late: 0, total: 0 });
        }
        const dayStats = dailyStatsMap.get(record.date);
        dayStats[record.status]++;
        dayStats.total++;

        // User stats
        if (!userStatsMap.has(list.userId)) {
          userStatsMap.set(list.userId, {
            userId: list.userId,
            userName: list.userName,
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
          });
        }
        const userStats = userStatsMap.get(list.userId);
        userStats.totalDays++;
        userStats[`${record.status}Days`]++;
      });
    });

    const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, stats]) => ({
      date,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      attendanceRate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
    }));

    const userStats = Array.from(userStatsMap.values()).map(stats => ({
      ...stats,
      attendanceRate: stats.totalDays > 0 ? (stats.presentDays / stats.totalDays) * 100 : 0,
    }));

    return {
      eventId,
      period: { start: startDate, end: endDate },
      totalDays: dailyStats.length,
      totalAllocations: attendanceLists.length,
      dailyStats,
      userStats,
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
    // Buscar todas as alocações do evento
    const { data: allocations, error: allocError } = await supabase
      .from('team_allocations')
      .select('user_id')
      .eq('event_id', eventId);

    if (allocError) throw allocError;

    // Buscar informações do evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // Enviar notificação para cada usuário alocado
    for (const allocation of allocations || []) {
      await supabase
        .from('notifications')
        .insert({
          user_id: allocation.user_id,
          title: 'Lembrete de Presença',
          message: `Lembre-se de marcar sua presença no evento "${event.title}" em ${date}.`,
          type: 'reminder',
          related_event_id: eventId,
          is_read: false
        });
    }
  } catch (error) {
    console.error('Erro ao enviar lembrete de presença:', error);
    throw error;
  }
};

export const sendLateNotification = async (userId: string, eventId: string, date: string): Promise<void> => {
  try {
    // Buscar informações do evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // Enviar notificação de atraso
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Registro de Atraso',
        message: `Você foi marcado como atrasado no evento "${event.title}" em ${date}.`,
        type: 'update',
        related_event_id: eventId,
        is_read: false
      });
  } catch (error) {
    console.error('Erro ao enviar notificação de atraso:', error);
    throw error;
  }
};