import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package, QrCode, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EquipmentItemReservation } from '@/types';
import { getEventEquipmentReservations, checkoutEquipmentItem, checkinEquipmentItem } from '@/services/equipmentReservationsService';
import EquipmentScanner from '@/components/EquipmentScanner';

export default function EquipmentChecklist() {
  const { eventId } = useParams<{ eventId: string }>();
  const [reservations, setReservations] = useState<EquipmentItemReservation[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<EquipmentItemReservation | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    conditionOut: 'good' as const
  });
  const [checkinData, setCheckinData] = useState({
    conditionIn: 'good' as const,
    postEventStatus: 'ok' as const,
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      loadReservations();
    }
  }, [eventId]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await getEventEquipmentReservations(eventId!);
      setReservations(data.reservations);
      setEvent(data.event);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar reservas de equipamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemScanned = (item: any, reservation?: EquipmentItemReservation) => {
    if (reservation) {
      setSelectedReservation(reservation);
      if (reservation.status === 'reserved') {
        setIsCheckoutOpen(true);
      } else if (reservation.status === 'checked_out') {
        setIsCheckinOpen(true);
      }
    } else {
      toast({
        title: 'Item não encontrado',
        description: 'Este item não está reservado para este evento',
        variant: 'destructive',
      });
    }
  };

  const handleCheckout = async () => {
    if (!selectedReservation) return;

    try {
      await checkoutEquipmentItem(eventId!, {
        reservationId: selectedReservation.id,
        conditionOut: checkoutData.conditionOut
      });

      toast({
        title: 'Sucesso',
        description: 'Item retirado com sucesso',
      });

      setIsCheckoutOpen(false);
      setSelectedReservation(null);
      setCheckoutData({ conditionOut: 'good' });
      loadReservations();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer checkout do item',
        variant: 'destructive',
      });
    }
  };

  const handleCheckin = async () => {
    if (!selectedReservation) return;

    try {
      await checkinEquipmentItem(eventId!, {
        reservationId: selectedReservation.id,
        conditionIn: checkinData.conditionIn,
        postEventStatus: checkinData.postEventStatus,
        notes: checkinData.notes
      });

      toast({
        title: 'Sucesso',
        description: 'Item devolvido com sucesso',
      });

      setIsCheckinOpen(false);
      setSelectedReservation(null);
      setCheckinData({ conditionIn: 'good', postEventStatus: 'ok', notes: '' });
      loadReservations();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer checkin do item',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      reserved: { label: 'Reservado', variant: 'secondary' as const, icon: Clock },
      checked_out: { label: 'Retirado', variant: 'default' as const, icon: Package },
      returned: { label: 'Devolvido', variant: 'outline' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: AlertCircle }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const, icon: Package };
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      excellent: { label: 'Excelente', variant: 'default' as const },
      good: { label: 'Bom', variant: 'secondary' as const },
      fair: { label: 'Regular', variant: 'outline' as const },
      poor: { label: 'Ruim', variant: 'destructive' as const },
      damaged: { label: 'Danificado', variant: 'destructive' as const }
    };
    return conditionMap[condition as keyof typeof conditionMap] || { label: condition, variant: 'default' as const };
  };

  const getPostEventStatusBadge = (status: string) => {
    const statusMap = {
      ok: { label: 'OK', variant: 'default' as const },
      maintenance: { label: 'Manutenção', variant: 'secondary' as const },
      replace: { label: 'Trocar', variant: 'destructive' as const },
      lost: { label: 'Perdido', variant: 'destructive' as const },
      damaged: { label: 'Danificado', variant: 'destructive' as const }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando checklist...</p>
        </div>
      </div>
    );
  }

  const reservedItems = reservations.filter(r => r.status === 'reserved');
  const checkedOutItems = reservations.filter(r => r.status === 'checked_out');
  const returnedItems = reservations.filter(r => r.status === 'returned');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checklist de Equipamentos</h1>
          <p className="text-muted-foreground">
            {event?.title} - {event?.location}
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Reservados</span>
            </div>
            <p className="text-2xl font-bold">{reservedItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Retirados</span>
            </div>
            <p className="text-2xl font-bold">{checkedOutItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Devolvidos</span>
            </div>
            <p className="text-2xl font-bold">{returnedItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scanner */}
      <EquipmentScanner
        eventId={eventId!}
        onItemScanned={handleItemScanned}
      />

      {/* Lista de itens */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Itens Reservados</h2>
        {reservations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum equipamento reservado</h3>
              <p className="text-muted-foreground text-center">
                Este evento não possui equipamentos reservados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reservations.map((reservation) => {
              const statusBadge = getStatusBadge(reservation.status);
              const StatusIcon = statusBadge.icon;
              
              return (
                <Card key={reservation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-mono">{reservation.assetTag}</CardTitle>
                        <CardDescription className="mt-1">
                          {reservation.equipmentName}
                        </CardDescription>
                        {reservation.serialNumber && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Série: {reservation.serialNumber}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusBadge.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reservation.itemCondition && (
                        <Badge {...getConditionBadge(reservation.itemCondition)}>
                          {getConditionBadge(reservation.itemCondition).label}
                        </Badge>
                      )}
                      
                      {reservation.categoryName && (
                        <Badge variant="outline">
                          {reservation.categoryName}
                        </Badge>
                      )}

                      {reservation.location && (
                        <p className="text-sm text-muted-foreground">
                          📍 {reservation.location}
                        </p>
                      )}

                      {reservation.checkedOutAt && (
                        <p className="text-sm text-muted-foreground">
                          Retirado em: {new Date(reservation.checkedOutAt).toLocaleString('pt-BR')}
                        </p>
                      )}

                      {reservation.checkedInAt && (
                        <p className="text-sm text-muted-foreground">
                          Devolvido em: {new Date(reservation.checkedInAt).toLocaleString('pt-BR')}
                        </p>
                      )}

                      {reservation.postEventStatus && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Status pós-evento:</span>
                          <Badge {...getPostEventStatusBadge(reservation.postEventStatus)}>
                            {getPostEventStatusBadge(reservation.postEventStatus).label}
                          </Badge>
                        </div>
                      )}

                      {reservation.notes && (
                        <p className="text-sm text-muted-foreground">
                          {reservation.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de Checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirar Equipamento</DialogTitle>
            <DialogDescription>
              Confirme a retirada do equipamento {selectedReservation?.assetTag}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="conditionOut">Condição do Item</Label>
              <Select
                value={checkoutData.conditionOut}
                onValueChange={(value: any) => setCheckoutData({ ...checkoutData, conditionOut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excelente</SelectItem>
                  <SelectItem value="good">Bom</SelectItem>
                  <SelectItem value="fair">Regular</SelectItem>
                  <SelectItem value="poor">Ruim</SelectItem>
                  <SelectItem value="damaged">Danificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout}>
              Confirmar Retirada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Checkin */}
      <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver Equipamento</DialogTitle>
            <DialogDescription>
              Confirme a devolução do equipamento {selectedReservation?.assetTag}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conditionIn">Condição na Devolução</Label>
                <Select
                  value={checkinData.conditionIn}
                  onValueChange={(value: any) => setCheckinData({ ...checkinData, conditionIn: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excelente</SelectItem>
                    <SelectItem value="good">Bom</SelectItem>
                    <SelectItem value="fair">Regular</SelectItem>
                    <SelectItem value="poor">Ruim</SelectItem>
                    <SelectItem value="damaged">Danificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postEventStatus">Status Pós-Evento</Label>
                <Select
                  value={checkinData.postEventStatus}
                  onValueChange={(value: any) => setCheckinData({ ...checkinData, postEventStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ok">OK</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="replace">Trocar</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                    <SelectItem value="damaged">Danificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={checkinData.notes}
                onChange={(e) => setCheckinData({ ...checkinData, notes: e.target.value })}
                placeholder="Observações sobre o estado do equipamento..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckinOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckin}>
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

