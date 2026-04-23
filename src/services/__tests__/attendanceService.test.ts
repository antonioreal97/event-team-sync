import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  confirmAttendancePayment,
  generateAttendanceReport,
  getAttendanceList,
  getEventAttendanceStats,
  markAttendance,
} from '../attendanceService';

function mockApiResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('attendanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.localStorage.getItem).mockReturnValue('jwt-token');
  });

  it('busca a lista de presença agregada pela API e normaliza a resposta', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        attendanceList: {
          eventId: 'evt-1',
          eventDate: '2026-05-10',
          allocations: [
            {
              allocationId: 'alloc-1',
              userId: 'user-1',
              userName: 'Ana',
              assignedRole: 'camera',
              teamType: 'iniciante',
              attendance: {
                id: 'att-1',
                date: '2026-05-10',
                status: 'present',
                dailyPayment: 200,
                paymentConfirmed: true,
                notes: 'No horário',
              },
            },
          ],
          totalPresent: 1,
          totalAbsent: 0,
          totalLate: 0,
          totalPending: 0,
        },
      })
    );

    const result = await getAttendanceList('evt-1', '2026-05-10');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/teams/event/evt-1/attendance?date=2026-05-10',
      expect.any(Object)
    );
    expect(result).toMatchObject({
      eventId: 'evt-1',
      eventDate: '2026-05-10',
      totalPresent: 1,
    });
    expect(result?.allocations[0]).toMatchObject({
      allocationId: 'alloc-1',
      teamType: 'iniciante',
      attendance: {
        status: 'present',
        dailyPayment: 200,
        paymentConfirmed: true,
      },
    });
  });

  it('marca presença usando o endpoint Express consolidado', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    const result = await markAttendance('alloc-1', '2026-05-10', 'late', 'Trânsito');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/teams/attendance/alloc-1',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          date: '2026-05-10',
          status: 'late',
          notes: 'Trânsito',
        }),
      })
    );
    expect(result).toMatchObject({
      date: '2026-05-10',
      status: 'late',
      notes: 'Trânsito',
    });
  });

  it('confirma pagamento diário pelo endpoint da API', async () => {
    vi.mocked(fetch).mockResolvedValue(mockApiResponse({ ok: true }));

    await confirmAttendancePayment('alloc-1', '2026-05-10');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/teams/payment/alloc-1/confirm',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ date: '2026-05-10' }),
      })
    );
  });

  it('calcula estatísticas de presença a partir da resposta agregada da API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        attendanceList: {
          eventId: 'evt-1',
          eventDate: '2026-05-10',
          allocations: [
            {
              allocationId: 'alloc-1',
              userId: 'user-1',
              userName: 'Ana',
              assignedRole: 'camera',
              attendance: {
                id: 'att-1',
                date: '2026-05-10',
                status: 'present',
                dailyPayment: 200,
                paymentConfirmed: true,
              },
            },
            {
              allocationId: 'alloc-2',
              userId: 'user-2',
              userName: 'Bia',
              assignedRole: 'audio',
              attendance: {
                id: 'att-2',
                date: '2026-05-10',
                status: 'late',
                dailyPayment: 220,
                paymentConfirmed: false,
              },
            },
          ],
          totalPresent: 1,
          totalAbsent: 0,
          totalLate: 1,
          totalPending: 0,
        },
      })
    );

    const result = await getEventAttendanceStats('evt-1', '2026-05-10');

    expect(result).toEqual({
      totalAllocations: 2,
      presentCount: 1,
      absentCount: 0,
      lateCount: 1,
      attendanceRate: 50,
    });
  });

  it('gera relatório simples a partir das estatísticas do dia consultado', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockApiResponse({
        attendanceList: {
          eventId: 'evt-1',
          eventDate: '2026-05-10',
          allocations: [
            {
              allocationId: 'alloc-1',
              userId: 'user-1',
              userName: 'Ana',
              assignedRole: 'camera',
              attendance: {
                id: 'att-1',
                date: '2026-05-10',
                status: 'present',
                dailyPayment: 200,
                paymentConfirmed: true,
              },
            },
          ],
          totalPresent: 1,
          totalAbsent: 0,
          totalLate: 0,
          totalPending: 0,
        },
      })
    );

    const result = await generateAttendanceReport('evt-1', '2026-05-10', '2026-05-10');

    expect(result).toEqual({
      eventId: 'evt-1',
      period: { start: '2026-05-10', end: '2026-05-10' },
      totalDays: 1,
      totalAllocations: 1,
      dailyStats: [
        {
          date: '2026-05-10',
          presentCount: 1,
          absentCount: 0,
          lateCount: 0,
        },
      ],
    });
  });
});
