import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Event, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, UserCheck, Crown } from 'lucide-react';

interface EventInterestConfirmation {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'interested' | 'confirmed' | 'rejected';
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventInterest {
  event: Event;
  interests: Array<{
    user: User;
    interest: EventInterestConfirmation;
  }>;
}

export const TeamEscalation: React.FC = () => {
  const [eventsWithInterests, setEventsWithInterests] = useState<EventInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadEventsWithInterests();
  }, []);

  const loadEventsWithInterests = async () => {
    try {
      // Buscar eventos em planejamento
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'planning')
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      const eventsWithInterestsData: EventInterest[] = [];

      for (const event of events || []) {
        // Buscar interesses para cada evento
        const { data: interests, error: interestsError } = await supabase
          .from('event_interests')
          .select(`
            *,
            users!inner (
              *,
              freelancer_profiles (*)
            )
          `)
          .eq('event_id', event.id)
          .eq('status', 'interested');

        if (interestsError) throw interestsError;

        const mappedInterests = interests?.map(interest => ({
          user: mapDatabaseUserToUser(interest.users),
          interest: {
            id: interest.id,
            eventId: interest.event_id,
            userId: interest.user_id,
            status: interest.status,
            confirmedAt: interest.created_at,
            createdAt: interest.created_at,
            updatedAt: interest.updated_at,
          } as EventInterestConfirmation
        })) || [];

        if (mappedInterests.length > 0) {
          eventsWithInterestsData.push({
            event: mapDatabaseEventToEvent(event),
            interests: mappedInterests
          });
        }
      }

      setEventsWithInterests(eventsWithInterestsData);
    } catch (error) {
      console.error('Erro ao carregar eventos com interesses:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos com interesses.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const mapDatabaseUserToUser = (dbUser: any): User => {
    const freelancerProfile = dbUser.freelancer_profiles?.[0];
    
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatar: dbUser.avatar,
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      teamType: freelancerProfile?.team_type,
      phone: freelancerProfile?.phone,
      address: freelancerProfile?.address,
      city: freelancerProfile?.city,
      state: freelancerProfile?.state,
      cpf: freelancerProfile?.cpf,
      hourlyRate: freelancerProfile?.hourly_rate,
      dailyRate: freelancerProfile?.daily_rate,
      experienceLevel: freelancerProfile?.experience_level || 'iniciante',
      audioVisualRoles: freelancerProfile?.audio_visual_roles || [],
      bio: freelancerProfile?.bio,
      portfolio: freelancerProfile?.portfolio,
      linkedin: freelancerProfile?.linkedin,
      instagram: freelancerProfile?.instagram,
      website: freelancerProfile?.website,
      previousExperience: freelancerProfile?.previous_experience,
      certifications: freelancerProfile?.certifications || [],
      equipment: freelancerProfile?.equipment || [],
      languages: freelancerProfile?.languages || [],
      totalEventsAttended: freelancerProfile?.total_events_attended || 0,
      totalEarnings: freelancerProfile?.total_earnings || 0,
      averageRating: freelancerProfile?.average_rating,
    };
  };

  const mapDatabaseEventToEvent = (dbEvent: any): Event => {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      startDate: dbEvent.start_date,
      endDate: dbEvent.end_date,
      location: dbEvent.location,
      status: dbEvent.status,
      eventType: dbEvent.event_type,
      budget: dbEvent.budget,
      requirements: dbEvent.requirements || [],
      notes: dbEvent.notes,
      createdBy: dbEvent.created_by,
      createdAt: dbEvent.created_at,
      updatedAt: dbEvent.updated_at,
      teamPriority: dbEvent.team_priority,
      allowTeamB: dbEvent.allow_team_b,
      estimatedDuration: dbEvent.estimated_duration,
      dailyRateTeamA: dbEvent.daily_rate_team_a,
      dailyRateTeamB: dbEvent.daily_rate_team_b,
      isMultiDay: dbEvent.is_multi_day,
      totalDays: dbEvent.total_days,
      workingDays: dbEvent.working_days || [],
    };
  };

  const createTeamAllocation = async (eventId: string, userId: string, role: string, isLeader: boolean = false) => {
    try {
      const event = eventsWithInterests.find(e => e.event.id === eventId)?.event;
      if (!event) throw new Error('Evento não encontrado');

      const user = eventsWithInterests
        .find(e => e.event.id === eventId)
        ?.interests.find(i => i.user.id === userId)?.user;
      if (!user) throw new Error('Usuário não encontrado');

      const dailyRate = event.teamPriority === 'equipe_a' ? event.dailyRateTeamA : event.dailyRateTeamB;
      const totalDays = event.totalDays || 1;
      const totalPayment = dailyRate * totalDays;

      // Definir deadlines (24h para confirmação, 48h para cancelamento)
      const confirmationDeadline = new Date();
      confirmationDeadline.setHours(confirmationDeadline.getHours() + 24);
      
      const cancellationDeadline = new Date();
      cancellationDeadline.setHours(cancellationDeadline.getHours() + 48);

      const { error } = await supabase
        .from('team_allocations')
        .insert({
          event_id: eventId,
          user_id: userId,
          assigned_role: role,
          daily_rate: dailyRate,
          total_days: totalDays,
          total_payment: totalPayment,
          status: 'pending',
          confirmation_deadline: confirmationDeadline.toISOString(),
          cancellation_deadline: cancellationDeadline.toISOString(),
        });

      if (error) throw error;

      // Criar notificação para o freelancer
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: `Escalação para Evento${isLeader ? ' - LÍDER' : ''}`,
          message: `Você foi escalado${isLeader ? ' como LÍDER' : ''} para o evento "${event.title}". Confirme sua participação.`,
          type: 'allocation',
          related_event_id: eventId,
          is_read: false
        });

      toast({
        title: 'Sucesso',
        description: `${user.name} foi escalado${isLeader ? ' como líder' : ''} para o evento.`,
      });

      // Recarregar dados
      loadEventsWithInterests();
    } catch (error) {
      console.error('Erro ao criar escalação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível escalar o freelancer.',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'lider_freelancer': 'bg-gradient-to-r from-amber-500 to-orange-500',
      'freelancer': 'bg-blue-500',
      'gestor': 'bg-purple-500',
    };
    return roleColors[role] || 'bg-gray-500';
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'lider_freelancer': 'Líder Freelancer',
      'freelancer': 'Freelancer',
      'gestor': 'Gestor',
    };
    return roleLabels[role] || role;
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
            <p className="text-foreground">Carregando escalação...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
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
                Escalação de Equipes
              </h1>
              <p className="text-foreground/70 text-lg">
                Visualize os interesses e monte as equipes para cada evento
              </p>
            </div>
          </div>
        </div>

        {eventsWithInterests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum evento com interesses demonstrados encontrado.
              </p>
            </CardContent>
          </Card>
        ) : (
        <Tabs value={selectedEvent || eventsWithInterests[0]?.event.id} onValueChange={setSelectedEvent}>
          <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3 mb-6">
            {eventsWithInterests.map(({ event }) => (
              <TabsTrigger key={event.id} value={event.id} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {event.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {eventsWithInterests.map(({ event, interests }) => (
            <TabsContent key={event.id} value={event.id}>
              <div className="grid gap-6">
                {/* Informações do Evento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {event.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(event.startDate).toLocaleDateString('pt-BR')} - {event.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Duração</p>
                        <p className="font-semibold">{event.totalDays} dia(s)</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diária Equipe A</p>
                        <p className="font-semibold">R$ {event.dailyRateTeamA}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Interesses</p>
                        <p className="font-semibold">{interests.length} freelancer(s)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Interessados */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Freelancers Interessados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {interests.map(({ user, interest }) => (
                        <div key={user.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold">{user.name}</h3>
                                <Badge className={`text-white ${getRoleColor(user.role)}`}>
                                  {user.role === 'lider_freelancer' && <Crown className="h-3 w-3 mr-1" />}
                                  {getRoleLabel(user.role)}
                                </Badge>
                                <Badge variant="outline">
                                  {user.teamType?.replace('equipe_', 'Equipe ').toUpperCase() || 'Sem equipe'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                                <div>Experiência: {user.experienceLevel}</div>
                                <div>Diária: R$ {user.dailyRate || 'Não informado'}</div>
                                <div>Eventos: {user.totalEventsAttended}</div>
                              </div>

                              {user.audioVisualRoles && user.audioVisualRoles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {user.audioVisualRoles.map(role => (
                                    <Badge key={role} variant="secondary" className="text-xs">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {user.role === 'lider_freelancer' && (
                                <Button
                                  onClick={() => createTeamAllocation(event.id, user.id, 'leader', true)}
                                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                >
                                  <Crown className="h-4 w-4 mr-1" />
                                  Escalar como Líder
                                </Button>
                              )}
                              
                              <Select onValueChange={(role) => createTeamAllocation(event.id, user.id, role)}>
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Escalar como..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="camera">Câmera</SelectItem>
                                  <SelectItem value="audio">Áudio</SelectItem>
                                  <SelectItem value="lighting">Iluminação</SelectItem>
                                  <SelectItem value="director">Diretor</SelectItem>
                                  <SelectItem value="producer">Produtor</SelectItem>
                                  <SelectItem value="assistant">Assistente</SelectItem>
                                  <SelectItem value="technician">Técnico</SelectItem>
                                  <SelectItem value="streaming">Streaming</SelectItem>
                                  <SelectItem value="editing">Edição</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        )}
      </div>
    </AppLayout>
  );
};