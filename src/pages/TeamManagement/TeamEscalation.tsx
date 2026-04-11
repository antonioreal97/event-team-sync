import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Event, User } from '@/types';
import { Calendar, Users, Crown } from 'lucide-react';
import { transformEventFromBackend } from '@/utils/eventUtils';
import {
  apiGetPlanningEvents,
  apiGetActiveFreelancers,
  apiAllocateUser,
  flattenActiveFreelancers,
} from '@/services/teamAllocationApiService';

function mapApiFreelancerRowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    role: (row.role as User['role']) || 'freelancer',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teamType: (row.teamType as User['teamType']) || 'sem_equipe',
    phone: row.phone != null ? String(row.phone) : undefined,
    city: row.city != null ? String(row.city) : undefined,
    state: row.state != null ? String(row.state) : undefined,
    experienceLevel: (row.experienceLevel as User['experienceLevel']) || 'iniciante',
    audioVisualRoles: [],
    certifications: [],
    equipment: [],
    languages: [],
    totalEventsAttended: 0,
    totalEarnings: 0,
    dailyRate: undefined,
  };
}

export const TeamEscalation: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [freelancers, setFreelancers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [rawEvents, buckets] = await Promise.all([
        apiGetPlanningEvents(),
        apiGetActiveFreelancers(),
      ]);
      const mappedEvents = rawEvents.map((e) => transformEventFromBackend(e));
      setEvents(mappedEvents);
      setFreelancers(flattenActiveFreelancers(buckets).map(mapApiFreelancerRowToUser));
      setSelectedEvent((prev) => {
        if (prev && mappedEvents.some((ev) => ev.id === prev)) return prev;
        return mappedEvents[0]?.id ?? '';
      });
    } catch (error) {
      console.error('Erro ao carregar escalação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar eventos ou freelancers (verifique login na API).',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const createTeamAllocation = async (
    eventId: string,
    userId: string,
    role: string,
    _isLeader: boolean = false
  ) => {
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) throw new Error('Evento não encontrado');
      const user = freelancers.find((u) => u.id === userId);
      if (!user) throw new Error('Usuário não encontrado');

      const totalDays = event.totalDays || 1;

      await apiAllocateUser({
        eventId,
        userId,
        assignedRole: role,
        totalDays,
        notes: 'Escalação pelo painel de equipes',
      });

      toast({
        title: 'Sucesso',
        description: `${user.name} foi escalado. O profissional receberá notificação para confirmar disponibilidade.`,
      });
      void loadData();
    } catch (error) {
      console.error('Erro ao criar escalação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível escalar o freelancer.',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      lider_freelancer: 'bg-gradient-to-r from-amber-500 to-orange-500',
      freelancer: 'bg-blue-500',
      gestor: 'bg-purple-500',
    };
    return roleColors[role] || 'bg-gray-500';
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      lider_freelancer: 'Líder Freelancer',
      freelancer: 'Freelancer',
      gestor: 'Gestor',
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
              <img src="/logo-s4u.png" alt="Equipe S4U Logo" className="h-10 w-10 object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Escalação de Equipes
              </h1>
              <p className="text-foreground/70 text-lg">
                Escolha o evento em planejamento e escale profissionais; eles confirmam disponibilidade pela
                notificação.
              </p>
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum evento em planejamento encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedEvent || events[0]?.id} onValueChange={setSelectedEvent}>
            <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3 mb-6">
              {events.map((event) => (
                <TabsTrigger key={event.id} value={event.id} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {event.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {events.map((event) => (
              <TabsContent key={event.id} value={event.id}>
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {event.title}
                      </CardTitle>
                      <CardDescription>
                        {event.startDate
                          ? new Date(event.startDate).toLocaleDateString('pt-BR')
                          : ''}{' '}
                        - {event.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Duração</p>
                          <p className="font-semibold">{event.totalDays} dia(s)</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Diária (referência avançado)</p>
                          <p className="font-semibold">R$ {event.dailyRateAvancado || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profissionais disponíveis</p>
                          <p className="font-semibold">{freelancers.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Escalar profissionais
                      </CardTitle>
                      <CardDescription>
                        A diária é calculada no servidor conforme o nível do profissional e as diárias do evento.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {freelancers.map((user) => (
                          <div key={user.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-semibold">{user.name}</h3>
                                  <Badge className={`text-white ${getRoleColor(user.role)}`}>
                                    {user.role === 'lider_freelancer' && <Crown className="h-3 w-3 mr-1" />}
                                    {getRoleLabel(user.role)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {(user.teamType || 'sem_equipe').replace(/_/g, ' ')}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                                  <div>Experiência: {user.experienceLevel}</div>
                                  <div>
                                    Cidade: {user.city || '—'} {user.state ? `/${user.state}` : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
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
                                  <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Função na escalação" />
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
