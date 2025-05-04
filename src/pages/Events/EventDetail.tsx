
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/StatusBadge';
import { Event, TeamAllocation, EquipmentAllocation, Equipment, User } from '@/types';
import { getEventById, getEventTeamAllocations, updateTeamAllocation } from '@/services/eventService';
import { getEventEquipmentAllocations } from '@/services/equipmentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { equipments as mockEquipments } from '@/services/mockData';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isProducer } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [teamAllocations, setTeamAllocations] = useState<TeamAllocation[]>([]);
  const [equipmentAllocations, setEquipmentAllocations] = useState<EquipmentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  useEffect(() => {
    const fetchEventData = async () => {
      if (!id || !user) return;
      
      setLoading(true);
      try {
        const eventData = await getEventById(id);
        if (!eventData) {
          toast({
            title: 'Evento não encontrado',
            variant: 'destructive',
          });
          navigate('/events');
          return;
        }
        
        setEvent(eventData);
        
        // Fetch team allocations
        const teamAllocData = await getEventTeamAllocations(id);
        setTeamAllocations(teamAllocData);
        
        // Fetch equipment allocations
        const equipAllocData = await getEventEquipmentAllocations(id);
        const equipmentsWithDetails = equipAllocData.map(allocation => ({
          ...allocation,
          equipment: mockEquipments.find(e => e.id === allocation.equipmentId),
        }));
        setEquipmentAllocations(equipmentsWithDetails);
        
      } catch (error) {
        console.error('Failed to fetch event data:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar os dados do evento',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [id, user, navigate, toast]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleAllocationResponse = async (allocationId: string, status: 'confirmed' | 'rejected') => {
    if (!user) return;
    
    setLoadingAction(true);
    try {
      await updateTeamAllocation(allocationId, { status });
      
      // Update UI
      setTeamAllocations(prev => 
        prev.map(alloc => 
          alloc.id === allocationId ? { ...alloc, status } : alloc
        )
      );
      
      toast({
        title: status === 'confirmed' ? 'Participação confirmada' : 'Participação recusada',
        description: status === 'confirmed' 
          ? 'Você confirmou sua participação neste evento' 
          : 'Você recusou participar deste evento',
      });
    } catch (error) {
      console.error('Failed to update allocation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar sua resposta',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(false);
    }
  };
  
  const findMyAllocation = () => {
    if (!user) return null;
    return teamAllocations.find(a => a.userId === user.id);
  };
  
  const isWithinCheckInWindow = () => {
    if (!event) return false;
    
    const now = new Date();
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // Check-in is allowed from 30 minutes before event starts until event ends
    const checkInWindowStart = new Date(eventStart.getTime() - 30 * 60000); // 30 minutes before
    
    return now >= checkInWindowStart && now <= eventEnd;
  };
  
  const handleCheckIn = async () => {
    if (!user) return;
    
    const myAllocation = findMyAllocation();
    if (!myAllocation) return;
    
    toast({
      title: 'Check-in registrado!',
      description: 'Seu check-in foi registrado com sucesso.',
    });
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (!event) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Evento não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  const myAllocation = findMyAllocation();
  const canCheckIn = isWithinCheckInWindow() && myAllocation?.status === 'confirmed';
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-semibold">{event.title}</h1>
            <div className="mt-1">
              <StatusBadge status={event.status} />
            </div>
          </div>
          
          <div className="flex space-x-3">
            {isProducer && (
              <Button
                variant="outline"
                onClick={() => navigate(`/events/${id}/edit`)}
              >
                Editar Evento
              </Button>
            )}
            
            {!isProducer && myAllocation?.status === 'pending' && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleAllocationResponse(myAllocation.id, 'rejected')}
                  disabled={loadingAction}
                >
                  Recusar
                </Button>
                <Button
                  onClick={() => handleAllocationResponse(myAllocation.id, 'confirmed')}
                  disabled={loadingAction}
                >
                  Confirmar
                </Button>
              </div>
            )}
            
            {!isProducer && myAllocation?.status === 'confirmed' && canCheckIn && (
              <Button
                onClick={handleCheckIn}
                className="bg-green-600 hover:bg-green-700"
              >
                Fazer Check-in
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500">Descrição</h3>
                  <p>{event.description}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Local</h3>
                    <p>{event.location}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Data</h3>
                    <p>{formatDate(event.startDate)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Horário</h3>
                    <p>{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-500">Equipe</h3>
                  <p className="font-semibold">
                    {teamAllocations.filter(a => a.status === 'confirmed').length} / {teamAllocations.length} confirmados
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded overflow-hidden">
                    <div 
                      className="h-full bg-event-DEFAULT" 
                      style={{ 
                        width: `${teamAllocations.length > 0 
                          ? (teamAllocations.filter(a => a.status === 'confirmed').length / teamAllocations.length) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-500">Equipamentos</h3>
                  <p className="font-semibold">{equipmentAllocations.length} itens alocados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="team">
          <TabsList>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Alocação de Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                {teamAllocations.length === 0 ? (
                  <p className="text-gray-500">Nenhum colaborador alocado para este evento</p>
                ) : (
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3">Colaborador</th>
                          <th scope="col" className="px-4 py-3">Status</th>
                          <th scope="col" className="px-4 py-3">Data Limite</th>
                          {isProducer && <th scope="col" className="px-4 py-3">Ações</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {teamAllocations.map(allocation => (
                          <tr key={allocation.id} className="border-b">
                            <td className="px-4 py-3">{allocation.userId === user?.id ? 'Você' : 'Colaborador'}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={allocation.status} />
                            </td>
                            <td className="px-4 py-3">{formatDate(allocation.confirmationDeadline)}</td>
                            {isProducer && (
                              <td className="px-4 py-3">
                                {/* Producer actions */}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="equipment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipamentos Alocados</CardTitle>
              </CardHeader>
              <CardContent>
                {equipmentAllocations.length === 0 ? (
                  <p className="text-gray-500">Nenhum equipamento alocado para este evento</p>
                ) : (
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3">Equipamento</th>
                          <th scope="col" className="px-4 py-3">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentAllocations.map(allocation => (
                          <tr key={allocation.id} className="border-b">
                            <td className="px-4 py-3">{allocation.equipment?.name}</td>
                            <td className="px-4 py-3">{allocation.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
