
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types';
import { getEventById, updateEventStatus } from '@/services/eventService';
import { confirmEventInterest, checkEventInterestStatus, cancelEventInterest, EventInterestConfirmation } from '@/services/eventInterestService';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  FileText, 
  Settings,
  Award,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [interestStatus, setInterestStatus] = useState<EventInterestConfirmation | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventData();
      fetchInterestStatus();
    }
  }, [id]);

  const fetchEventData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const eventData = await getEventById(id);
      
      if (!eventData) {
        toast({
          title: 'Erro',
          description: 'Evento não encontrado',
          variant: 'destructive',
        });
        navigate('/events');
        return;
      }
      
      setEvent(eventData);
    } catch (error) {
      console.error('Failed to fetch event data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestStatus = async () => {
    if (!id || !user || user.role !== 'freelancer') return;
    
    try {
      const status = await checkEventInterestStatus(id);
      setInterestStatus(status);
      
      // Log apenas para debug (opcional)
      if (status) {
        console.log('✅ Status de interesse encontrado:', status);
      } else {
        console.log('ℹ️ Usuário não confirmou interesse ainda');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status de interesse:', error);
    }
  };

  const handleConfirmInterest = async () => {
    if (!id || !user) return;
    
    try {
      setInterestLoading(true);
      const confirmation = await confirmEventInterest(id);
      setInterestStatus(confirmation);
      
      toast({
        title: 'Interesse Confirmado',
        description: 'Seu interesse no evento foi confirmado com sucesso! O administrador será notificado.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to confirm interest:', error);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = 'Falha ao confirmar interesse no evento';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Tentar extrair mensagem de erro da resposta da API
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        }
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setInterestLoading(false);
    }
  };

  const handleCancelInterest = async () => {
    if (!id || !user) return;
    
    try {
      setInterestLoading(true);
      await cancelEventInterest(id);
      setInterestStatus(null);
      
      toast({
        title: 'Interesse Cancelado',
        description: 'Seu interesse no evento foi cancelado.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to cancel interest:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar interesse no evento',
        variant: 'destructive',
      });
    } finally {
      setInterestLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !event) return;
    
    try {
      setStatusLoading(true);
      const updatedEvent = await updateEventStatus(id, newStatus);
      
      setEvent(updatedEvent);
      
      toast({
        title: 'Sucesso',
        description: `Status do evento atualizado para "${getStatusLabel(newStatus)}"`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do evento',
        variant: 'destructive',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'planning': return 'Em Planejamento';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Data não informada';
      
      // Criar data no meio-dia para evitar problemas de timezone
      const date = new Date(dateString + 'T12:00:00');
      
      if (isNaN(date.getTime())) {
        console.warn('Data inválida detectada:', dateString);
        return 'Data inválida';
      }
      
      const formatted = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        weekday: 'long'
      });
      
      return formatted;
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'String original:', dateString);
      return 'Data inválida';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return 'Horário não informado';
      
      // Criar data no meio-dia para evitar problemas de timezone
      const date = new Date(dateString + 'T12:00:00');
      
      if (isNaN(date.getTime())) {
        console.warn('Horário inválido detectado:', dateString);
        return 'Horário inválido';
      }
      
      const formatted = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      return formatted;
    } catch (error) {
      console.error('Erro ao formatar horário:', error, 'String original:', dateString);
      return 'Horário inválido';
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      if (!dateString) return 'Data não informada';
      
      // Criar data no meio-dia para evitar problemas de timezone
      const date = new Date(dateString + 'T12:00:00');
      
      if (isNaN(date.getTime())) return 'Data inválida';
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = () => {
    switch(event?.status) {
      case 'planning':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Em Planejamento</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Ativo</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Cancelado</Badge>;
      default:
        return <Badge variant="outline">Status não definido</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img 
                src="/logo-s4u.png" 
                alt="Equipe S4U Logo" 
                className="h-14 w-14 object-contain animate-pulse"
              />
            </div>
            <p className="text-foreground">Carregando evento...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Evento não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-gray-600">{event.description}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge()}
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Informações do Evento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Data de Início</p>
                  <p className="text-sm font-medium">{formatDate(event.startDate)}</p>
                  {event.dailySchedule && event.dailySchedule.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {event.dailySchedule[0].startTime} - {event.dailySchedule[0].endTime}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Data de Fim</p>
                  <p className="text-sm font-medium">{formatDate(event.endDate)}</p>
                  {event.dailySchedule && event.dailySchedule.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {event.dailySchedule[event.dailySchedule.length - 1].startTime} - {event.dailySchedule[event.dailySchedule.length - 1].endTime}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Localização</p>
                  <p className="text-sm font-medium">{event.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duração Estimada</p>
                  <p className="text-sm font-medium">{event.estimatedDuration}h</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Evento</p>
                  <Badge variant={event.eventType === 'especial' ? 'default' : 'secondary'}>
                    {event.eventType === 'especial' ? 'Especial' : 'Normal'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duração</p>
                  <p className="text-sm font-medium">
                    {event.totalDays ? `${event.totalDays} dia${event.totalDays > 1 ? 's' : ''}` : '1 dia'}
                  </p>
                </div>
              </div>

              {event.budget && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Orçamento</p>
                  <p className="text-lg font-semibold text-green-600">
                    R$ {event.budget.toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo de Preços - Design Dourado */}
          <Card className="bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-700 border-amber-500/30 shadow-2xl">
            <CardHeader className="border-b border-amber-400/20">
              <CardTitle className="flex items-center space-x-2 text-amber-100">
                <DollarSign className="h-6 w-6 text-amber-300" />
                <span className="text-amber-100 font-bold">Resumo de Preços</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Barra de Ouro Principal */}
              <div className="relative p-6 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-xl border-2 border-amber-400/50 shadow-inner">
                {/* Efeito de Brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"></div>
                
                <div className="relative z-10 space-y-4">
                  {/* Total de Dias - Destaque */}
                  <div className="text-center pb-3 border-b border-amber-400/30">
                    <div className="text-2xl font-bold text-amber-900 mb-1">
                      {event.totalDays || 1}
                    </div>
                    <div className="text-amber-800 font-medium">Total de Dias</div>
                  </div>
                  
                  {/* Equipes */}
                  <div className="grid grid-cols-1 gap-4">
                                      {/* Lógica para mostrar preços baseada no tipo de usuário */}
                  {(() => {
                    console.log('🔍 Debug - Iniciando lógica de preços');
                    console.log('🔍 Debug - isGestor:', isGestor);
                    console.log('🔍 Debug - user:', user);
                    console.log('🔍 Debug - event.teamAllocations:', event.teamAllocations);
                    
                    // Se for gestor, mostrar ambas as equipes
                    if (isGestor) {
                      console.log('🔍 Debug - Usuário é gestor, mostrando ambas equipes');
                      return (
                        <>
                          {/* Equipe A */}
                          <div className="bg-gradient-to-r from-amber-700/80 to-amber-600/80 p-4 rounded-lg border border-amber-400/40">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-amber-100">Equipe A</span>
                              <div className="text-right">
                                <div className="text-amber-200 text-sm">R$ {event.dailyRateTeamA || 0}/dia</div>
                                <div className="text-amber-100 font-bold text-lg">
                                  R$ {(event.dailyRateTeamA || 0) * (event.totalDays || 1)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Equipe B */}
                          <div className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 p-4 rounded-lg border border-amber-400/40">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-amber-100">Equipe B</span>
                              <div className="text-right">
                                <div className="text-amber-200 text-sm">R$ {event.dailyRateTeamB || 0}/dia</div>
                                <div className="text-amber-100 font-bold text-lg">
                                  R$ {(event.dailyRateTeamB || 0) * (event.totalDays || 1)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    }
                    
                    // Se for freelancer, mostrar apenas a equipe do usuário
                    if (user && user.role === 'freelancer') {
                      console.log('🔍 Debug - ENTRANDO na lógica de freelancer');
                      console.log('🔍 Debug - user.role:', user.role);
                      console.log('🔍 Debug - user.teamType:', user.teamType);
                      console.log('🔍 Debug - event.teamAllocations.length:', event.teamAllocations?.length || 0);
                      
                      let userAllocation = null;
                      if (event.teamAllocations && event.teamAllocations.length > 0) {
                        userAllocation = event.teamAllocations.find(
                          (allocation: any) => allocation.userId === user.id
                        );
                      }
                      
                      console.log('🔍 Debug - User Allocation encontrada:', userAllocation);
                      console.log('🔍 Debug - Team Type do perfil:', (userAllocation as any)?.team_type);
                      console.log('🔍 Debug - User ID:', user.id);
                      console.log('🔍 Debug - Todas as alocações:', event.teamAllocations);
                      console.log('🔍 Debug - User profile teamType:', user.teamType);
                      
                      // Primeiro tentar usar o team_type da alocação
                      let userTeamType = (userAllocation as any)?.team_type;
                      console.log('🔍 Debug - userTeamType da alocação:', userTeamType);
                      
                      // Se não encontrar na alocação, usar o teamType do perfil do usuário
                      if (!userTeamType && user.teamType) {
                        userTeamType = user.teamType;
                        console.log('🔍 Debug - Usando teamType do perfil do usuário:', userTeamType);
                      }
                      
                      console.log('🔍 Debug - userTeamType final:', userTeamType);
                      
                      if (userTeamType) {
                        // Usar o team_type encontrado
                        const isTeamA = userTeamType === 'equipe_a';
                        const teamType = isTeamA ? 'A' : 'B';
                        const dailyRate = isTeamA ? event.dailyRateTeamA : event.dailyRateTeamB;
                        const totalPayment = dailyRate * (event.totalDays || 1);
                        
                        console.log('🔍 Debug - Team Type determinado:', teamType);
                        console.log('🔍 Debug - Daily Rate usado:', dailyRate);
                        console.log('🔍 Debug - RETORNANDO equipe específica do freelancer');
                        
                        return (
                          <div className={`bg-gradient-to-r ${isTeamA ? 'from-amber-700/80 to-amber-600/80' : 'from-amber-600/80 to-amber-500/80'} p-4 rounded-lg border border-amber-400/40`}>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-amber-100">Equipe {teamType} - Sua Equipe</span>
                              <div className="text-right">
                                <div className="text-amber-200 text-sm">R$ {dailyRate || 0}/dia</div>
                                <div className="text-amber-100 font-bold text-lg">
                                  R$ {totalPayment}
                                </div>
                                <div className="text-amber-300 text-xs">Seu pagamento total</div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        console.log('🔍 Debug - PROBLEMA: team_type não encontrado em nenhum lugar');
                        console.log('🔍 Debug - userAllocation existe:', !!userAllocation);
                        console.log('🔍 Debug - team_type da alocação:', !!(userAllocation as any)?.team_type);
                        console.log('🔍 Debug - user.teamType existe:', !!user.teamType);
                        console.log('🔍 Debug - VAI PARA FALLBACK (mostrar ambas equipes)');
                      }
                    } else {
                      console.log('🔍 Debug - NÃO entrou na lógica de freelancer');
                      console.log('🔍 Debug - user existe:', !!user);
                      console.log('🔍 Debug - user.role:', user?.role);
                      console.log('🔍 Debug - event.teamAllocations existe:', !!event.teamAllocations);
                      console.log('🔍 Debug - event.teamAllocations.length:', event.teamAllocations?.length);
                    }
                    
                    // Fallback: mostrar ambas as equipes se não conseguir determinar
                    console.log('🔍 Debug - Usando fallback: mostrando ambas equipes');
                    return (
                      <>
                        {/* Equipe A */}
                        <div className="bg-gradient-to-r from-amber-700/80 to-amber-600/80 p-4 rounded-lg border border-amber-400/40">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-amber-100">Equipe A</span>
                            <div className="text-right">
                              <div className="text-amber-200 text-sm">R$ {event.dailyRateTeamA || 0}/dia</div>
                              <div className="text-amber-100 font-bold text-lg">
                                R$ {(event.dailyRateTeamA || 0) * (event.totalDays || 1)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Equipe B */}
                        <div className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 p-4 rounded-lg border border-amber-400/40">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-amber-100">Equipe B</span>
                            <div className="text-right">
                              <div className="text-amber-200 text-sm">R$ {event.dailyRateTeamB || 0}/dia</div>
                              <div className="text-amber-100 font-bold text-lg">
                                R$ {(event.dailyRateTeamB || 0) * (event.totalDays || 1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  </div>
                  
                  {/* Nota Multi-dia */}
                  {event.isMultiDay && (
                    <div className="bg-amber-800/60 p-3 rounded-lg border border-amber-400/30">
                      <p className="text-xs text-amber-200 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-2 text-amber-300" />
                        Este é um evento multi-dia. Os freelancers aceitarão todos os dias do evento.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="schedule">Programação</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            {isGestor && (
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            )}
          </TabsList>

          {/* Detalhes do Evento */}
          <TabsContent value="details" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requisitos de Equipe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Requisitos de Equipe</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {event.requirements && event.requirements.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {event.requirements.map((requirement) => (
                        <Badge key={requirement} variant="secondary" className="capitalize">
                          {requirement === 'camera' ? 'Câmera' :
                           requirement === 'audio' ? 'Áudio' :
                           requirement === 'lighting' ? 'Iluminação' :
                           requirement === 'director' ? 'Direção' :
                           requirement === 'producer' ? 'Produção' :
                           requirement === 'assistant' ? 'Assistente' :
                           requirement === 'technician' ? 'Técnico' :
                           requirement === 'streaming' ? 'Streaming' :
                           requirement === 'editing' ? 'Edição' : requirement}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nenhum requisito específico definido</p>
                  )}
                </CardContent>
              </Card>

              {/* Confirmação de Interesse - APENAS PARA FREELANCERS */}
              {user && user.role === 'freelancer' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Status de Participação</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                                        {/* Verificar status de confirmação de interesse do freelancer */}
                    {(() => {
                      // PRIORIDADE 1: Verificar se o usuário confirmou interesse
                      if (interestStatus) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                Interesse confirmado em {new Date(interestStatus.confirmedAt || interestStatus.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            {interestStatus.status === 'pending' && (
                              <div className="space-y-3">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-sm text-amber-700 text-center">
                                    ⏳ Aguardando aprovação do administrador
                                  </p>
                                  <p className="text-xs text-amber-600 text-center mt-1">
                                    Seu interesse foi registrado e será analisado
                                  </p>
                                </div>
                                
                                {/* Verificar se o freelancer está escalado antes de mostrar o botão de cancelar */}
                                {(() => {
                                  const userAllocation = event.teamAllocations?.find(
                                    allocation => allocation.userId === user.id
                                  );
                                  
                                  // Se não está alocado ou está alocado mas não confirmado, permitir cancelamento
                                  const canCancel = !userAllocation || userAllocation.status !== 'confirmed';
                                  
                                  if (canCancel) {
                                    return (
                                      <Button
                                        variant="outline"
                                        onClick={handleCancelInterest}
                                        disabled={interestLoading}
                                        className="w-full"
                                      >
                                        {interestLoading ? 'Cancelando...' : 'Cancelar Interesse'}
                                      </Button>
                                    );
                                  } else {
                                    return (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700 text-center">
                                          🔒 Você foi escalado para este evento
                                        </p>
                                        <p className="text-xs text-blue-600 text-center mt-1">
                                          Não é possível cancelar interesse após ser escalado
                                        </p>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                            
                            {interestStatus.status === 'confirmed' && (
                              <div className="space-y-3">
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-sm text-green-700 text-center">
                                    ✅ Seu interesse foi aprovado pelo administrador
                                  </p>
                                  <p className="text-xs text-green-600 text-center mt-1">
                                    Aguardando alocação na equipe do evento
                                  </p>
                                </div>
                                
                                {/* Mostrar informações de alocação se existir */}
                                {(() => {
                                  const userAllocation = event.teamAllocations?.find(
                                    allocation => allocation.userId === user.id
                                  );
                                  
                                  if (userAllocation) {
                                    return (
                                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800 mb-2">
                                          📋 Informações da Alocação:
                                        </p>
                                        <div className="space-y-1 text-xs text-blue-700">
                                          <div className="flex justify-between">
                                            <span>Função:</span>
                                            <span className="font-medium">{userAllocation.assignedRole}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Status da Alocação:</span>
                                            <Badge 
                                              variant={userAllocation.status === 'confirmed' ? 'default' : 'secondary'}
                                              className="text-xs"
                                            >
                                              {userAllocation.status === 'confirmed' ? 'Confirmado' : 
                                               userAllocation.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                            </Badge>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Taxa por dia:</span>
                                            <span className="font-medium">R$ {userAllocation.dailyRate}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Verificar se pode cancelar interesse baseado no status da alocação */}
                                        {userAllocation.status !== 'confirmed' && (
                                          <div className="mt-3">
                                            <Button
                                              variant="outline"
                                              onClick={handleCancelInterest}
                                              disabled={interestLoading}
                                              className="w-full"
                                            >
                                              {interestLoading ? 'Cancelando...' : 'Cancelar Interesse'}
                                            </Button>
                                          </div>
                                        )}
                                        
                                        {userAllocation.status === 'confirmed' && (
                                          <div className="mt-3 p-2 bg-blue-100 border border-blue-300 rounded">
                                            <p className="text-xs text-blue-800 text-center">
                                              🔒 Você foi escalado para este evento. Não é possível cancelar interesse.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  
                                  // Se não está alocado ainda, permitir cancelamento
                                  return (
                                    <div className="mt-3">
                                      <Button
                                        variant="outline"
                                        onClick={handleCancelInterest}
                                        disabled={interestLoading}
                                        className="w-full"
                                      >
                                        {interestLoading ? 'Cancelando...' : 'Cancelar Interesse'}
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            
                            {interestStatus.status === 'rejected' && (
                              <div className="space-y-3">
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-sm text-red-700 text-center">
                                    ❌ Seu interesse foi rejeitado pelo administrador
                                  </p>
                                  <p className="text-xs text-red-600 text-center mt-1">
                                    Entre em contato para mais informações
                                  </p>
                                </div>
                                
                                {/* Verificar se o freelancer está escalado antes de mostrar o botão de remover rejeição */}
                                {(() => {
                                  const userAllocation = event.teamAllocations?.find(
                                    allocation => allocation.userId === user.id
                                  );
                                  
                                  // Se não está alocado ou está alocado mas não confirmado, permitir remoção da rejeição
                                  const canCancel = !userAllocation || userAllocation.status !== 'confirmed';
                                  
                                  if (canCancel) {
                                    return (
                                      <Button
                                        variant="outline"
                                        onClick={handleCancelInterest}
                                        disabled={interestLoading}
                                        className="w-full"
                                      >
                                        {interestLoading ? 'Removendo...' : 'Remover Rejeição'}
                                      </Button>
                                    );
                                  } else {
                                    return (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700 text-center">
                                          🔒 Você foi escalado para este evento
                                        </p>
                                        <p className="text-xs text-blue-600 text-center mt-1">
                                          Não é possível remover a rejeição após ser escalado
                                        </p>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // PRIORIDADE 2: Se não confirmou interesse, verificar se está alocado
                      const userAllocation = event.teamAllocations?.find(
                        allocation => allocation.userId === user.id
                      );
                      
                      // Debug: Log do status real da alocação
                      if (userAllocation) {
                        console.log('🔍 Status real da alocação:', {
                          status: userAllocation.status,
                          statusType: typeof userAllocation.status,
                          statusLength: userAllocation.status ? userAllocation.status.length : 'null/undefined',
                          assignedRole: userAllocation.assignedRole,
                          dailyRate: userAllocation.dailyRate,
                          fullAllocation: userAllocation
                        });
                      }
                      
                      if (userAllocation) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">
                                Escalado para este Evento
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Função:</span>
                                <span className="font-medium">{userAllocation.assignedRole}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status da Participação:</span>
                                <Badge 
                                  variant={interestStatus ? 
                                    (interestStatus.status === 'confirmed' ? 'default' : 'secondary') :
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {interestStatus ? 
                                    (interestStatus.status === 'pending' ? 'Pendente' :
                                     interestStatus.status === 'confirmed' ? 'Confirmado' :
                                     interestStatus.status === 'rejected' ? 'Rejeitado' : 'Desconhecido') :
                                    'Não confirmado'
                                  }
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status da Alocação:</span>
                                <Badge 
                                  variant={
                                    userAllocation.status === 'confirmed' && interestStatus?.status === 'confirmed' ? 'default' :
                                    userAllocation.status === 'confirmed' && interestStatus?.status !== 'confirmed' ? 'secondary' :
                                    userAllocation.status === 'pending' ? 'secondary' :
                                    userAllocation.status === 'cancelled' ? 'destructive' :
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {userAllocation.status === 'confirmed' && interestStatus?.status === 'confirmed' ? 'Confirmado' :
                                   userAllocation.status === 'confirmed' && interestStatus?.status !== 'confirmed' ? 'Alocado pelo Admin' :
                                   userAllocation.status === 'pending' ? 'Pendente' : 
                                   userAllocation.status === 'cancelled' ? 'Cancelado' :
                                   userAllocation.status || 'Desconhecido'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Taxa por dia:</span>
                                <span className="font-medium">R$ {userAllocation.dailyRate}</span>
                              </div>
                            </div>
                            
                            {userAllocation.status === 'confirmed' ? (
                              <div className="space-y-3">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-700 text-center">
                                    🎯 Você foi escalado pelo administrador para este evento
                                  </p>
                                  <p className="text-xs text-blue-600 text-center mt-1">
                                    O administrador te escolheu especificamente para este evento
                                  </p>
                                </div>
                                
                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="text-xs text-yellow-700 text-center">
                                    ⚠️ Para confirmar sua participação, clique em "Confirmar Interesse" abaixo
                                  </p>
                                </div>
                                
                                <Button
                                  onClick={handleConfirmInterest}
                                  disabled={interestLoading}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  {interestLoading ? 'Confirmando...' : 'Confirmar Interesse'}
                                </Button>
                              </div>
                            ) : userAllocation.status === 'pending' ? (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-700 text-center">
                                  ⏳ Aguardando confirmação do administrador
                                </p>
                                <p className="text-xs text-amber-600 text-center mt-1">
                                  Você foi escalado mas ainda não confirmado
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-700 text-center">
                                  📋 Status: {userAllocation.status || 'Desconhecido'}
                                </p>
                                <p className="text-xs text-gray-600 text-center mt-1">
                                  Aguardando definição do status
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // PRIORIDADE 3: Usuário não está alocado e não confirmou interesse
                      return (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Confirme seu interesse neste evento para que o administrador possa avaliar e gerenciar sua participação.
                          </p>
                          <Button
                            onClick={handleConfirmInterest}
                            disabled={interestLoading}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {interestLoading ? 'Confirmando...' : 'Confirmar Interesse'}
                          </Button>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Informações de Prioridade - APENAS PARA GESTORES */}
              {isGestor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Prioridade de Equipe</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Equipe Prioritária</p>
                      <Badge variant="outline" className="mt-1">
                        {event.teamPriority === 'equipe_a' ? 'Equipe A - Prioridade Máxima' : 
                         event.teamPriority === 'equipe_b' ? 'Equipe B - Suporte' : 'Ambas as Equipes'}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">Backup Equipe B</p>
                      <Badge variant={event.allowTeamB ? 'default' : 'secondary'} className="mt-1">
                        {event.allowTeamB ? 'Permitido' : 'Não permitido'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Observações */}
            {event.notes && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{event.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Programação dos Dias */}
          <TabsContent value="schedule" className="mt-4">
            {event.dailySchedule && event.dailySchedule.length > 0 ? (
              <div className="space-y-4">
                {event.dailySchedule.map((day, index) => (
                  <Card key={day.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5" />
                          <span>Dia {index + 1}: {formatDateShort(day.date)}</span>
                        </div>
                        <div className="flex space-x-2">
                          {day.isSetupDay && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Setup
                            </Badge>
                          )}
                          {day.isMainEventDay && (
                            <Badge className="bg-green-100 text-green-800">
                              Evento Principal
                            </Badge>
                          )}
                          {day.isTeardownDay && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Teardown
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Horários */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Horário de Início</p>
                          <p className="text-sm font-medium">{day.startTime}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Horário de Fim</p>
                          <p className="text-sm font-medium">{day.endTime}</p>
                        </div>
                      </div>

                      {/* Atividades */}
                      {day.activities && day.activities.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Atividades</p>
                          <div className="space-y-2">
                            {day.activities.map((activity, activityIndex) => (
                              <div key={activityIndex} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Funções Requeridas */}
                      {day.requiredRoles && day.requiredRoles.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Funções Requeridas</p>
                          <div className="flex flex-wrap gap-2">
                            {day.requiredRoles.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs capitalize">
                                {role === 'camera' ? 'Câmera' :
                                 role === 'audio' ? 'Áudio' :
                                 role === 'lighting' ? 'Iluminação' :
                                 role === 'director' ? 'Direção' :
                                 role === 'producer' ? 'Produção' :
                                 role === 'assistant' ? 'Assistente' :
                                 role === 'technician' ? 'Técnico' :
                                 role === 'streaming' ? 'Streaming' :
                                 role === 'editing' ? 'Edição' : role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observações do Dia */}
                      {day.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Observações</p>
                          <p className="text-sm text-gray-700">{day.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma programação diária definida</p>
                    <p className="text-sm">A programação será exibida aqui quando estiver disponível</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Informações da Equipe */}
          <TabsContent value="team" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Específicas */}
              {event.eventAgenda && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Agenda Geral</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{event.eventAgenda}</p>
                  </CardContent>
                </Card>
              )}

              {event.specialInstructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Instruções Especiais</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{event.specialInstructions}</p>
                  </CardContent>
                </Card>
              )}

              {event.setupRequirements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Requisitos de Setup</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{event.setupRequirements}</p>
                  </CardContent>
                </Card>
              )}

              {event.technicalSpecifications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Especificações Técnicas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{event.technicalSpecifications}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {!event.eventAgenda && !event.specialInstructions && !event.setupRequirements && !event.technicalSpecifications && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma informação específica disponível</p>
                    <p className="text-sm">As informações técnicas serão exibidas aqui quando estiverem disponíveis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Configurações do Evento (apenas para gestores) */}
          {isGestor && (
            <TabsContent value="settings" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status do Evento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Status do Evento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="eventStatus">Status Atual</Label>
                      <div className="mt-2">
                        {getStatusBadge()}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="statusSelect">Alterar Status</Label>
                      <Select
                        value={event?.status || ''}
                        onValueChange={handleStatusChange}
                        disabled={statusLoading}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Em Planejamento</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Em Planejamento:</strong> Evento sendo planejado, não visível para freelancers</p>
                      <p><strong>Confirmado:</strong> Evento confirmado, visível para freelancers</p>
                      <p><strong>Em Andamento:</strong> Evento em execução</p>
                      <p><strong>Concluído:</strong> Evento finalizado</p>
                      <p><strong>Cancelado:</strong> Evento cancelado</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Evento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5" />
                      <span>Informações do Evento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>ID do Evento</Label>
                      <p className="text-sm text-gray-600 font-mono">{event?.id}</p>
                    </div>
                    
                    <div>
                      <Label>Criado em</Label>
                      <p className="text-sm text-gray-600">
                        {event?.createdAt ? formatDate(event.createdAt) : 'Não informado'}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Última atualização</Label>
                      <p className="text-sm text-gray-600">
                        {event?.updatedAt ? formatDate(event.updatedAt) : 'Não informado'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
          >
            Voltar para Eventos
          </Button>
          {isGestor && (
            <Button
              onClick={() => navigate(`/events/${id}/edit`)}
            >
              Editar Evento
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
