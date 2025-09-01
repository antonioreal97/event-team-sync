import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AttendanceList as AttendanceListType, AttendanceStatus } from '@/types';
import { getAttendanceList, updateAttendanceStatus, confirmDailyPayment } from '@/services/attendanceService';
import { CheckCircle, XCircle, Clock, AlertCircle, DollarSign, UserCheck, UserX } from 'lucide-react';

interface AttendanceListProps {
  eventId: string;
  eventDate: string;
  eventTitle: string;
  onUpdate?: () => void;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ 
  eventId, 
  eventDate, 
  eventTitle, 
  onUpdate 
}) => {
  const { toast } = useToast();
  const [attendanceList, setAttendanceList] = useState<AttendanceListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Dialog states
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>('present');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    fetchAttendanceList();
  }, [eventId, eventDate]);

  const fetchAttendanceList = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceList(eventId, eventDate);
      setAttendanceList(data);
    } catch (error) {
      console.error('Failed to fetch attendance list:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar lista de chamada',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedAllocation || !selectedStatus) return;

    try {
      setUpdating(true);
      await updateAttendanceStatus(
        selectedAllocation.allocationId,
        eventDate,
        selectedStatus,
        'gestor-id', // Em produção, usar ID real do gestor
        statusNotes
      );

      toast({
        title: 'Status atualizado',
        description: `Presença marcada como ${getStatusLabel(selectedStatus)}`,
      });

      setShowStatusDialog(false);
      setSelectedAllocation(null);
      setSelectedStatus('present');
      setStatusNotes('');
      
      // Refresh data
      fetchAttendanceList();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status de presença',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmPayment = async (allocationId: string) => {
    try {
      setUpdating(true);
      await confirmDailyPayment(
        allocationId,
        eventDate,
        'gestor-id' // Em produção, usar ID real do gestor
      );

      toast({
        title: 'Pagamento confirmado',
        description: 'Diária confirmada para este freelancer',
      });

      // Refresh data
      fetchAttendanceList();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao confirmar pagamento',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent': return 'Ausente';
      case 'late': return 'Atrasado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>Carregando lista de chamada...</p>
        </CardContent>
      </Card>
    );
  }

  if (!attendanceList) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500">Nenhum freelancer alocado para este evento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Lista de Chamada - {eventTitle}</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Data: {new Date(eventDate).toLocaleDateString('pt-BR')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceList.totalPresent}</div>
              <p className="text-xs text-gray-600">Presentes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{attendanceList.totalAbsent}</div>
              <p className="text-xs text-gray-600">Ausentes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{attendanceList.totalLate}</div>
              <p className="text-xs text-gray-600">Atrasados</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{attendanceList.totalPending}</div>
              <p className="text-xs text-gray-600">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de freelancers */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Presença</CardTitle>
          <p className="text-sm text-gray-600">
            Marque a presença de cada freelancer e confirme os pagamentos
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceList.allocations.map((allocation) => (
              <div key={allocation.allocationId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium">{allocation.userName}</h4>
                    <p className="text-sm text-gray-600 capitalize">{allocation.assignedRole}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {allocation.teamType === 'equipe_a' ? 'Equipe A' : 'Equipe B'}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(allocation.attendance.status)}`}>
                        {getStatusIcon(allocation.attendance.status)}
                        <span className="ml-1">{getStatusLabel(allocation.attendance.status)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Valor da diária */}
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      R$ {allocation.attendance.dailyPayment}
                    </div>
                    <div className="text-xs text-gray-500">por dia</div>
                  </div>

                  {/* Status de pagamento */}
                  {allocation.attendance.status === 'present' && (
                    <div className="flex items-center space-x-2">
                      {allocation.attendance.paymentConfirmed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(allocation.allocationId)}
                          disabled={updating}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Confirmar Pagamento
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Botão para atualizar status */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAllocation(allocation);
                      setSelectedStatus(allocation.attendance.status);
                      setStatusNotes(allocation.attendance.notes || '');
                      setShowStatusDialog(true);
                    }}
                  >
                    Atualizar Status
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para atualizar status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status de Presença</DialogTitle>
            <DialogDescription>
              Atualize o status de presença para {selectedAllocation?.userName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status de Presença</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AttendanceStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Presente</SelectItem>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="late">Atrasado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Motivo da ausência, horário de chegada, etc."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Atualizando...' : 'Atualizar Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceList;





