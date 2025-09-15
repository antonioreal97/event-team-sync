import { PaymentRecord, TeamAllocation } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Payment service functions - Conectado ao Supabase
export const getAllPaymentRecords = async (): Promise<PaymentRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDatabasePaymentToPayment);
  } catch (error) {
    console.error('Erro ao buscar registros de pagamento:', error);
    return [];
  }
};

export const getPaymentRecordById = async (id: string): Promise<PaymentRecord | undefined> => {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data ? mapDatabasePaymentToPayment(data) : undefined;
  } catch (error) {
    console.error('Erro ao buscar registro de pagamento:', error);
    return undefined;
  }
};

export const createPaymentRecord = async (paymentData: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentRecord> => {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .insert({
        team_allocation_id: paymentData.allocationId,
        amount: paymentData.amount,
        status: paymentData.status,
        payment_date: paymentData.paymentDate,
        notes: paymentData.notes
      })
      .select()
      .single();

    if (error) throw error;

    return mapDatabasePaymentToPayment(data);
  } catch (error) {
    console.error('Erro ao criar registro de pagamento:', error);
    throw error;
  }
};

export const updatePaymentRecord = async (id: string, paymentData: Partial<PaymentRecord>): Promise<PaymentRecord> => {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .update({
        amount: paymentData.amount,
        status: paymentData.status,
        payment_date: paymentData.paymentDate,
        notes: paymentData.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapDatabasePaymentToPayment(data);
  } catch (error) {
    console.error('Erro ao atualizar registro de pagamento:', error);
    throw error;
  }
};

export const deletePaymentRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('payment_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar registro de pagamento:', error);
    throw error;
  }
};

// Payment calculation functions
export const calculateDailyPayment = (dailyRate: number, totalDays: number): number => {
  return dailyRate * totalDays;
};

export const calculateTotalPayment = (allocation: TeamAllocation): number => {
  return allocation.dailyRate * allocation.totalDays;
};

export const calculateCancellationRefund = (
  totalPayment: number,
  cancellationDate: Date,
  eventStartDate: Date
): number => {
  const daysUntilEvent = Math.ceil((eventStartDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilEvent >= 5) {
    return totalPayment; // Reembolso total se cancelar com 5+ dias de antecedência
  } else if (daysUntilEvent >= 2) {
    return totalPayment * 0.5; // 50% se cancelar com 2-4 dias de antecedência
  } else {
    return 0; // Sem reembolso se cancelar com menos de 2 dias
  }
};

// Payment confirmation functions
export const confirmDailyPayment = async (allocationId: string, date: string): Promise<void> => {
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
    console.error('Erro ao confirmar pagamento diário:', error);
    throw error;
  }
};

export const getPaymentHistory = async (userId: string): Promise<PaymentRecord[]> => {
  try {
    const payments = await getAllPaymentRecords();
    return payments.filter(payment => payment.userId === userId);
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    return [];
  }
};

export const getPaymentHistoryByEvent = async (eventId: string): Promise<PaymentRecord[]> => {
  try {
    const payments = await getAllPaymentRecords();
    return payments.filter(payment => payment.eventId === eventId);
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos por evento:', error);
    return [];
  }
};

// Financial reporting functions
export const generateFinancialSummary = async (startDate: Date, endDate: Date): Promise<{
  totalPayments: number;
  totalEvents: number;
  averagePaymentPerEvent: number;
  paymentsByTeam: Record<string, number>;
  paymentsByEventType: Record<string, number>;
}> => {
  try {
    const payments = await getAllPaymentRecords();
    
    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalEvents = new Set(filteredPayments.map(p => p.eventId)).size;
    const averagePaymentPerEvent = totalEvents > 0 ? totalPayments / totalEvents : 0;

    const paymentsByTeam: Record<string, number> = {};
    const paymentsByEventType: Record<string, number> = {};

    // Estas informações serão implementadas quando tivermos dados completos
    paymentsByTeam['equipe_a'] = 0;
    paymentsByTeam['equipe_b'] = 0;
    paymentsByEventType['normal'] = 0;
    paymentsByEventType['especial'] = 0;

    return {
      totalPayments,
      totalEvents,
      averagePaymentPerEvent: Math.round(averagePaymentPerEvent * 100) / 100,
      paymentsByTeam,
      paymentsByEventType,
    };
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    return {
      totalPayments: 0,
      totalEvents: 0,
      averagePaymentPerEvent: 0,
      paymentsByTeam: {},
      paymentsByEventType: {},
    };
  }
};

export const getPaymentStatistics = async (): Promise<{
  totalPaid: number;
  totalPending: number;
  totalCancelled: number;
  averagePayment: number;
  monthlyTrend: Record<string, number>;
}> => {
  try {
    const payments = await getAllPaymentRecords();
    
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const totalCancelled = payments.filter(p => p.status === 'cancelled').reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0;

    const monthlyTrend: Record<string, number> = {};
    // Esta funcionalidade será implementada quando tivermos dados completos

    return {
      totalPaid,
      totalPending,
      totalCancelled,
      averagePayment: Math.round(averagePayment * 100) / 100,
      monthlyTrend,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de pagamento:', error);
    return {
      totalPaid: 0,
      totalPending: 0,
      totalCancelled: 0,
      averagePayment: 0,
      monthlyTrend: {},
    };
  }
};

// Payment validation functions
export const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 10000; // Limite máximo de R$ 10.000 por pagamento
};

export const validatePaymentDate = (paymentDate: Date, eventDate: Date): boolean => {
  const now = new Date();
  const eventStart = new Date(eventDate);
  
  // Pagamento deve ser feito após o evento e não mais de 30 dias depois
  return paymentDate >= eventStart && paymentDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
};

export const approvePayment = async (paymentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('payment_records')
      .update({ status: 'approved' })
      .eq('id', paymentId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao aprovar pagamento:', error);
    throw error;
  }
};

export const markPaymentAsPaid = async (paymentId: string, paymentMethod: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('payment_records')
      .update({ 
        status: 'paid',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao marcar pagamento como pago:', error);
    throw error;
  }
};

export const cancelPayment = async (paymentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('payment_records')
      .update({ status: 'cancelled' })
      .eq('id', paymentId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    throw error;
  }
};

export const generateEventPaymentReport = async (eventId: string): Promise<any> => {
  try {
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

    const { data: payments, error: paymentError } = await supabase
      .from('payment_records')
      .select('*')
      .in('team_allocation_id', (allocations || []).map(a => a.id));

    if (paymentError) throw paymentError;

    return {
      eventId,
      allocations: allocations || [],
      payments: (payments || []).map(mapDatabasePaymentToPayment),
      totalPayments: (payments || []).reduce((sum, p) => sum + p.amount, 0),
      totalAllocations: (allocations || []).length
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de pagamento:', error);
    throw error;
  }
};

// Mapper function to convert database payment to frontend payment
const mapDatabasePaymentToPayment = (dbPayment: any): PaymentRecord => {
  return {
    id: dbPayment.id,
    userId: '', // Will need to be fetched from team allocation
    eventId: '', // Will need to be fetched from team allocation
    allocationId: dbPayment.team_allocation_id,
    amount: dbPayment.amount,
    status: dbPayment.status || 'pending',
    paymentDate: dbPayment.payment_date,
    notes: dbPayment.notes,
    createdAt: dbPayment.created_at,
    updatedAt: dbPayment.updated_at,
  };
};
