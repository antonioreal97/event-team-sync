
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Event, TeamAllocation, User } from '@/types';
import { getAllEvents as getEvents, getTeamAllocationsForEvent } from '@/services/eventService';
import { getTeamStatistics } from '@/services/teamService';
import { filterEventForUser, getEventDisplayInfo, getEventDescription } from '@/services/eventVisibilityService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Users, DollarSign, TrendingUp, Award, UserCheck, Zap, Sparkles, Target } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import AppLayout from '@/components/AppLayout';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isGestor, isFreelancer } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [teamAllocations, setTeamAllocations] = useState<TeamAllocation[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
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
      
      const [eventsData, teamStatsData] = await Promise.all([
        getEvents(),
        isGestor ? getTeamStatistics() : null
      ]);
      
      setEvents(eventsData);
      setTeamStats(teamStatsData);
      
      // Buscar alocações apenas se for gestor
      if (isGestor) {
        const allocations = await Promise.all(
          eventsData.map(event => getTeamAllocationsForEvent(event.id))
        );
        setTeamAllocations(allocations.flat());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
      console.error('Failed to filter events:', error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    {events.filter(e => e.status === 'active').length} ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Equipe A</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">{teamStats?.equipeA || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamStats?.equipeAActive || 0} ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-glow hover:shadow-neon-lg transition-all duration-300 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-foreground">Equipe B</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">{teamStats?.equipeB || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {teamStats?.equipeBActive || 0} ativos
                  </p>
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
                    {filteredEvents.filter(e => e.status === 'active').length} ativos
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
                    {user?.teamType === 'equipe_a' ? 'Equipe A' : 'Equipe B'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user?.teamType === 'equipe_a' ? 'Prioridade máxima' : 'Suporte'}
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
                              {event.teamPriority === 'equipe_a' ? 'Prioridade A' : 
                               event.teamPriority === 'equipe_b' ? 'Prioridade B' : 'Ambas'}
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
                        <div className="text-lg font-bold text-primary">
                          R$ {allocation.dailyRate}/dia
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {allocation.totalDays} dia{allocation.totalDays > 1 ? 's' : ''}
                        </div>
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
