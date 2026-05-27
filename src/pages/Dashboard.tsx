
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Event, TeamAllocation, User } from '@/types';
import { getAllEvents as getEvents, getTeamAllocationsForEvent } from '@/services/eventService';
import { logger } from '@/utils/logger';
import { getTeamStatistics, getActiveFreelancersByTeam, isEventTeamFullyConfirmed } from '@/services/teamService';
import { filterEventForUser, getEventDisplayInfo, getEventDescription } from '@/services/eventVisibilityService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Users, DollarSign, TrendingUp, Award, UserCheck, Zap, Sparkles, Target, UserPlus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import AppLayout from '@/components/AppLayout';
import { getTeamTypeLabel, getTeamTypeDescription } from '@/lib/utils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isGestor, isFreelancer } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [teamAllocations, setTeamAllocations] = useState<TeamAllocation[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [activeFreelancers, setActiveFreelancers] = useState<any>(null);
  const [teamConfirmationStatus, setTeamConfirmationStatus] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (events.length > 0 && user) {
      filterEventsForUser();
    }
  }, [events, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [eventsData, teamStatsData, activeFreelancersData] = await Promise.all([
        getEvents(),
        isGestor ? getTeamStatistics() : null,
        isGestor ? getActiveFreelancersByTeam() : null
      ]);

      setEvents(eventsData);
      setTeamStats(teamStatsData);
      setActiveFreelancers(activeFreelancersData);

      // Buscar alocações apenas se for gestor
      if (isGestor) {
        const allocations = await Promise.all(
          eventsData.map(event => getTeamAllocationsForEvent(event.id))
        );
        setTeamAllocations(allocations.flat());

        // Verificar status de confirmação de cada evento
        const confirmationStatuses = await Promise.all(
          eventsData.map(async (event) => {
            try {
              const isConfirmed = await isEventTeamFullyConfirmed(event.id);
              return { [event.id]: isConfirmed };
            } catch (error) {
              logger.error(`Erro ao verificar evento ${event.title}:`, error);
              return { [event.id]: false };
            }
          })
        );

        const statusMap = confirmationStatuses.reduce((acc, status) => ({ ...acc, ...status }), {});
        setTeamConfirmationStatus(statusMap);
      }
    } catch (error) {
      logger.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsForUser = async () => {
    if (!user) return;
    
    try {
      if (user.role === 'gestor') {
        // Gestores veem todos os eventos
        setFilteredEvents(events);
      } else {
        // Freelancers veem apenas eventos filtrados
        const filtered = await Promise.all(
          events.map(event => filterEventForUser(event, user))
        );
        // Filtra valores null antes de definir o estado
        const validEvents = filtered.filter(event => event !== null);
        setFilteredEvents(validEvents);
      }
    } catch (error) {
      logger.error('Erro ao filtrar eventos:', error);
    }
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return filteredEvents
      .filter(event => event && event.startDate) // Filtra eventos null e sem startDate
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  };

  const getTodayEvents = () => {
    const today = new Date().toDateString();
    return filteredEvents
      .filter(event => event && event.startDate) // Filtra eventos null e sem startDate
      .filter(event => new Date(event.startDate).toDateString() === today);
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
                     <p className="text-foreground">Carregando dashboard...</p>
                   </div>
                 </div>
               </AppLayout>
             );
           }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
                         <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 flex items-center justify-center">
                       <img 
                         src="/logo-s4u.png" 
                         alt="Equipe S4U Logo" 
                         className="h-10 w-10 object-contain"
                       />
                     </div>
                     <div className="space-y-2">
                       <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                         Dashboard
                       </h1>
                       <p className="text-foreground/70 text-lg">
                         Bem-vindo, <span className="text-primary font-semibold">{user?.name}</span>! 
                         {isGestor ? ' Gerencie seus eventos e equipes' : ' Acompanhe seus eventos'}
                       </p>
                     </div>
                   </div>
          
                             {isGestor && (
                     <Button 
                       onClick={() => navigate('/team-management')}
                       className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-neon hover:shadow-neon-lg transition-all duration-300 neon-glow"
                     >
                       <img 
                         src="/logo-s4u.png" 
                         alt="Equipe S4U Logo" 
                         className="w-5 h-5 mr-2 object-contain"
                       />
                       Gestão de Equipes
                     </Button>
                   )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {isGestor ? (
            // Estatísticas para gestores
            <>
              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Total de Eventos</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">{events.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {events.filter(e => e.status === 'confirmed').length} confirmados
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Colaboradores Cadastrados</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {teamStats?.total || 
                     (activeFreelancers ? 
                       (activeFreelancers.iniciante?.total || 0) + 
                       (activeFreelancers.intermediario?.total || 0) + 
                       (activeFreelancers.avancado?.total || 0) + 
                       (activeFreelancers.sem_equipe?.total || 0) 
                       : 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeFreelancers ? 
                      ((activeFreelancers.iniciante?.active || 0) + 
                       (activeFreelancers.intermediario?.active || 0) + 
                       (activeFreelancers.avancado?.active || 0) + 
                       (activeFreelancers.sem_equipe?.active || 0)) 
                      : 0} ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Iniciante</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {activeFreelancers?.iniciante?.total || teamStats?.iniciante || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeFreelancers?.iniciante?.active || 0} ativos
                  </p>
                  {activeFreelancers?.iniciante?.users && activeFreelancers.iniciante.users.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-primary">Freelancers Ativos:</p>
                      {activeFreelancers.iniciante.users.slice(0, 3).map((freelancer: User) => (
                        <div key={freelancer.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground truncate">
                            {freelancer.name}
                          </span>
                        </div>
                      ))}
                      {activeFreelancers.iniciante.users.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{activeFreelancers.iniciante.users.length - 3} mais
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Intermediário</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {activeFreelancers?.intermediario?.total || teamStats?.intermediario || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeFreelancers?.intermediario?.active || 0} ativos
                  </p>
                  {activeFreelancers?.intermediario?.users && activeFreelancers.intermediario.users.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-primary">Freelancers Ativos:</p>
                      {activeFreelancers.intermediario.users.slice(0, 3).map((freelancer: User) => (
                        <div key={freelancer.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground truncate">
                            {freelancer.name}
                          </span>
                        </div>
                      ))}
                      {activeFreelancers.intermediario.users.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{activeFreelancers.intermediario.users.length - 3} mais
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Avançado</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {activeFreelancers?.avancado?.total || teamStats?.avancado || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeFreelancers?.avancado?.active || 0} ativos
                  </p>
                  {activeFreelancers?.avancado?.users && activeFreelancers.avancado.users.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-primary">Freelancers Ativos:</p>
                      {activeFreelancers.avancado.users.slice(0, 3).map((freelancer: User) => (
                        <div key={freelancer.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground truncate">
                            {freelancer.name}
                          </span>
                        </div>
                      ))}
                      {activeFreelancers.avancado.users.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{activeFreelancers.avancado.users.length - 3} mais
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Avaliação Média</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">{teamStats?.averageRating?.toFixed(1) || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamStats?.totalMembers || 0} membros
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            // Estatísticas para freelancers
            <>
              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Total de Eventos</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">{filteredEvents.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredEvents.filter(e => e.status === 'confirmed').length} confirmados
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Sua Equipe</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {getTeamTypeLabel(user?.teamType)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getTeamTypeDescription(user?.teamType)}
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Eventos Confirmados</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {filteredEvents.filter(e => e.status === 'confirmed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredEvents.filter(e => e.status === 'pending').length} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Taxa por Diária</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {filteredEvents[0]?.userDailyRate ? `R$ ${filteredEvents[0].userDailyRate}` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredEvents[0]?.eventType === 'especial' ? 'Evento Especial' : 'Evento Normal'}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Eventos de Hoje */}
        {getTodayEvents().length > 0 && (
          <Card className="card-gradient border-glow">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Eventos de Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTodayEvents().map(event => {
                  const displayInfo = getEventDisplayInfo(event, user!);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                          <p className="text-xs text-muted-foreground/70">
                            {event.description || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={event.status} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximos Eventos */}
        <Card className="card-gradient border-glow">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Próximos Eventos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getUpcomingEvents().map(event => {
                return (
                  <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                        <p className="text-xs text-muted-foreground/70">
                          {event.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={event.status} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Visão Geral da Equipe - Apenas para Gestores */}
        {isGestor && teamAllocations.length > 0 && (
          <Card className="card-gradient border-glow">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Visão Geral da Equipe</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamAllocations.slice(0, 5).map(allocation => {
                  const event = events.find(e => e.id === allocation.eventId);
                  if (!event) return null;
                  
                  return (
                    <div key={allocation.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {allocation.assignedRole} • {event.location}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs border-primary/20 bg-primary/10 text-primary">
                              {event.teamPriority === 'iniciante' ? 'Iniciante' : 
                               event.teamPriority === 'intermediario' ? 'Intermediário' : 
                               event.teamPriority === 'avancado' ? 'Avançado' : 'Todas'}
                            </Badge>
                            {event.allowTeamB && (
                              <Badge variant="outline" className="text-xs border-accent/20 bg-accent/10 text-accent">
                                Backup B
                              </Badge>
                            )}
                            {/* Event Type Badge */}
                            <Badge 
                              variant={event.eventType === 'especial' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {event.eventType === 'especial' ? 'Especial' : 'Normal'}
                            </Badge>
                            {/* Multi-day Indicator */}
                            {event.isMultiDay && (
                              <Badge variant="outline" className="text-xs border-primary/20 bg-primary/10 text-primary">
                                {event.totalDays} dia{event.totalDays > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {(() => {
                          const isFullyConfirmed = teamConfirmationStatus[allocation.eventId];
                          return (
                            <>
                              <div className="flex items-center justify-end space-x-2 mb-2">
                                <Badge 
                                  variant={isFullyConfirmed ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {isFullyConfirmed ? 'Equipe Confirmada' : 'Pendente Confirmação'}
                                </Badge>
                              </div>
                              {isFullyConfirmed ? (
                                <div className="text-lg font-bold text-primary">
                                  R$ {allocation.dailyRate}/dia
                                </div>
                              ) : (
                                <div className="text-lg font-bold text-muted-foreground">
                                  Custo: R$ {allocation.dailyRate}/dia
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {allocation.totalDays} dia{allocation.totalDays > 1 ? 's' : ''}
                              </div>
                              {!isFullyConfirmed && (
                                <div className="text-xs text-amber-500 mt-1">
                                  Custo visível após confirmação da equipe
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
