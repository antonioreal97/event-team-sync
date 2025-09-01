
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types';
import { getEventById } from '@/services/eventService';
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

  useEffect(() => {
    if (id) {
      fetchEventData();
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

              {/* Informações de Prioridade */}
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
