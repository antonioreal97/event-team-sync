import { AttendanceList, AttendanceRecord, AttendanceStatus } from '@/types';
import { apiFetch } from '@/lib/api';

interface AttendanceListItem {
  allocationId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  eventId: string;
  role: string;
  dailyRate: number;
  totalDays: number;
  attendanceRecords: AttendanceRecord[];
  totalPayment: number;
  status: string;
}

function mapAttendanceRecord(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: String(row.id ?? ''),
    date: String(row.date ?? ''),
    status: (row.status as AttendanceStatus) || 'pending',
    dailyPayment: Number(row.dailyPayment ?? row.daily_payment ?? 0),
    paymentConfirmed: Boolean(row.paymentConfirmed ?? row.payment_confirmed),
    notes: row.notes != null ? String(row.notes) : '',
    confirmedAt: row.confirmedAt != null ? String(row.confirmedAt) : row.confirmed_at != null ? String(row.confirmed_at) : undefined,
    confirmedBy: row.confirmedBy != null ? String(row.confirmedBy) : row.confirmed_by != null ? String(row.confirmed_by) : undefined,
  };
}

export const getAttendanceByAllocation = async (_allocationId: string): Promise<AttendanceRecord[]> => {
  return [];
};

export const markAttendance = async (
  allocationId: string,
  date: string,
  status: AttendanceStatus,
  notes?: string
): Promise<AttendanceRecord> => {
  await apiFetch(`/teams/attendance/${allocationId}`, {
    method: 'POST',
    body: JSON.stringify({ date, status, notes }),
  });

  return {
    id: '',
    date,
    status,
    dailyPayment: 0,
    paymentConfirmed: false,
    notes: notes || '',
  };
};

export const confirmAttendancePayment = async (allocationId: string, date: string): Promise<void> => {
  await apiFetch(`/teams/payment/${allocationId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
};

export const getEventAttendanceList = async (
  eventId: string,
  eventDate?: string
): Promise<AttendanceListItem[]> => {
  const attendanceList = await getAttendanceList(eventId, eventDate);
  if (!attendanceList) return [];

  return attendanceList.allocations.map((allocation) => ({
    allocationId: allocation.allocationId,
    userId: allocation.userId,
    userName: allocation.userName,
    eventId,
    role: allocation.assignedRole,
    dailyRate: allocation.attendance.dailyPayment,
    totalDays: 1,
    attendanceRecords: [allocation.attendance],
    totalPayment: allocation.attendance.dailyPayment,
    status: allocation.attendance.status,
  }));
};

export const getUserAttendanceStats = async (_userId: string): Promise<{
  totalEvents: number;
  attendedEvents: number;
  pendingEvents: number;
  attendanceRate: number;
}> => {
  return {
    totalEvents: 0,
    attendedEvents: 0,
    pendingEvents: 0,
    attendanceRate: 0,
  };
};

export const updateAttendanceStatus = markAttendance;
export const confirmDailyPayment = confirmAttendancePayment;

export const getAttendanceList = async (
  eventId: string,
  eventDate?: string
): Promise<AttendanceList | undefined> => {
  try {
    const query = eventDate ? `?date=${encodeURIComponent(eventDate)}` : '';
    const data = await apiFetch<{ attendanceList: Record<string, unknown> }>(
      `/teams/event/${eventId}/attendance${query}`
    );

    const attendanceList = data.attendanceList;
    if (!attendanceList) return undefined;

    return {
      eventId: String(attendanceList.eventId ?? eventId),
      eventDate: String(attendanceList.eventDate ?? eventDate ?? ''),
      allocations: Array.isArray(attendanceList.allocations)
        ? attendanceList.allocations.map((row) => {
            const allocation = row as Record<string, unknown>;
            return {
              allocationId: String(allocation.allocationId ?? allocation.allocation_id ?? ''),
              userId: String(allocation.userId ?? allocation.user_id ?? ''),
              userName: String(allocation.userName ?? allocation.user_name ?? ''),
              assignedRole: (allocation.assignedRole ?? allocation.assigned_role) as AttendanceList['allocations'][number]['assignedRole'],
              teamType: allocation.teamType as AttendanceList['allocations'][number]['teamType'],
              attendance: mapAttendanceRecord(allocation.attendance as Record<string, unknown>),
            };
          })
        : [],
      totalPresent: Number(attendanceList.totalPresent ?? 0),
      totalAbsent: Number(attendanceList.totalAbsent ?? 0),
      totalLate: Number(attendanceList.totalLate ?? 0),
      totalPending: Number(attendanceList.totalPending ?? 0),
    };
  } catch (error) {
    console.error('Erro ao buscar lista de presença:', error);
    return undefined;
  }
};

export const getEventAttendanceStats = async (
  eventId: string,
  eventDate?: string
): Promise<{
  totalAllocations: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}> => {
  try {
    const attendanceList = await getAttendanceList(eventId, eventDate);
    if (!attendanceList) {
      return {
        totalAllocations: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      };
    }

    const totalAllocations = attendanceList.allocations.length;
    const presentCount = attendanceList.totalPresent;
    const absentCount = attendanceList.totalAbsent;
    const lateCount = attendanceList.totalLate;
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

export const getUserAttendanceHistory = async (_userId: string): Promise<AttendanceRecord[]> => {
  return [];
};

export const markAllPresent = async (_eventId: string, _date: string): Promise<void> => {};

export const markAllAbsent = async (_eventId: string, _date: string): Promise<void> => {};

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
    presentCount: number;
    absentCount: number;
    lateCount: number;
  }>;
}> => {
  const stats = await getEventAttendanceStats(eventId, startDate);
  return {
    eventId,
    period: { start: startDate, end: endDate },
    totalDays: 1,
    totalAllocations: stats.totalAllocations,
    dailyStats: [
      {
        date: startDate,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        lateCount: stats.lateCount,
      },
    ],
  };
};
