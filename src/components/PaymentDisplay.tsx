import React from 'react';
import { TeamAllocation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';

interface PaymentDisplayProps {
  allocation: TeamAllocation;
  showBreakdown?: boolean;
}

const PaymentDisplay: React.FC<PaymentDisplayProps> = ({ allocation, showBreakdown = true }) => {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  const formatDate = (dateString: string) => {
    // Criar data no meio-dia para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
    
    return date.toLocaleDateString('pt-BR');
  };

  const canCancel = () => {
    const now = new Date();
    const deadline = new Date(allocation.cancellationDeadline);
    return now < deadline;
  };

  // Calcula estatísticas de pagamento
  const getPaymentStats = () => {
    const confirmedPayments = allocation.attendance.filter(a => a.paymentConfirmed);
    const pendingPayments = allocation.attendance.filter(a => a.status === 'present' && !a.paymentConfirmed);
    
    return {
      confirmed: confirmedPayments.length,
      pending: pendingPayments.length,
      totalConfirmed: confirmedPayments.reduce((sum, a) => sum + a.dailyPayment, 0),
      totalPending: pendingPayments.reduce((sum, a) => sum + a.dailyPayment, 0),
    };
  };

  const paymentStats = getPaymentStats();

  return (
    <div className="text-right">
      <div className="font-medium text-lg text-green-600">
        {formatCurrency(allocation.totalPayment)}
      </div>
      
      {showBreakdown && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="text-blue-600 font-medium">
            {allocation.totalDays} dia{allocation.totalDays > 1 ? 's' : ''} • {formatCurrency(allocation.dailyRate)}/dia
          </div>
          
          {/* Status de pagamentos */}
          {allocation.attendance && allocation.attendance.length > 0 && (
            <div className="space-y-1">
              {paymentStats.confirmed > 0 && (
                <div className="flex items-center justify-end text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>{paymentStats.confirmed} pago{paymentStats.confirmed > 1 ? 's' : ''} • {formatCurrency(paymentStats.totalConfirmed)}</span>
                </div>
              )}
              
              {paymentStats.pending > 0 && (
                <div className="flex items-center justify-end text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{paymentStats.pending} pendente{paymentStats.pending > 1 ? 's' : ''} • {formatCurrency(paymentStats.totalPending)}</span>
                </div>
              )}
            </div>
          )}
          
          {allocation.totalHours && (
            <div>
              {allocation.totalHours}h • {formatCurrency(allocation.totalPayment / allocation.totalHours)}/h
            </div>
          )}
          
          {/* Cancelamento */}
          {allocation.status === 'confirmed' && (
            <div className={`text-xs ${canCancel() ? 'text-orange-600' : 'text-red-600'}`}>
              {canCancel() 
                ? `Cancelar até ${formatDate(allocation.cancellationDeadline)}`
                : 'Cancelamento não permitido'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentDisplay;
