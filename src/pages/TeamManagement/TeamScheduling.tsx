import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Event, User, AudioVisualRole, TeamAllocation } from '@/types';
import { getAllEvents, getEventsWithInterests, getEventInterests } from '@/services/eventService';
import { getAllUsers, getAvailableUsersForEvent, searchUsers } from '@/services/userService';
import { createTeamAllocation } from '@/services/eventService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, Users, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const TeamScheduling = () => {
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsWithInterests, setEventsWithInterests] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRole, setSelectedRole] = useState<AudioVisualRole | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [eventInterests, setEventInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsData, eventsWithInterestsData, usersData] = await Promise.all([
          getAllEvents(),
          getEventsWithInterests(),
          getAllUsers()
        ]);
        setEvents(eventsData);
        setEventsWithInterests(eventsWithInterestsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    if (selectedEvent && selectedRole) {
      fetchAvailableUsers();
    }
  }, [selectedEvent, selectedRole]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventInterests();
    }
  }, [selectedEvent]);

  const fetchAvailableUsers = async () => {
    if (!selectedEvent || !selectedRole) return;
    
    try {
      const available = await getAvailableUsersForEvent(
        selectedEvent.id,
        [selectedRole],
        selectedEvent.startDate,
        selectedEvent.endDate
      );
      setAvailableUsers(available);
    } catch (error) {
      console.error('Failed to fetch available users:', error);
    }
  };

  const fetchEventInterests = async () => {
    if (!selectedEvent) return;
    
    try {
      const interests = await getEventInterests(selectedEvent.id);
      setEventInterests(interests);
    } catch (error) {
      console.error('Failed to fetch event interests:', error);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setAvailableUsers(users.filter(u => u.role === 'collaborator'));
      return;
    }

    try {
      const searchResults = await searchUsers(searchQuery, {
        roles: selectedRole ? [selectedRole] : undefined
      });
      setAvailableUsers(searchResults);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  // Função para obter eventos de um mês específico
  const getEventsForMonth = (year: number, month: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  const handleAllocateUser = async (userId: string, role: AudioVisualRole) => {
    if (!selectedEvent) return;

    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Calculate total days
      const startTime = new Date(selectedEvent.startDate);
      const endTime = new Date(selectedEvent.endDate);
      const totalDays = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const allocationData = {
        eventId: selectedEvent.id,
        userId,
        assignedRole: role,
        totalDays,
        notes: `Escalado automaticamente pelo sistema`,
      };

      await createTeamAllocation(allocationData);

      toast({
        title: 'Usuário escalado com sucesso',
        description: `${user.name} foi escalado para ${selectedEvent.title}. A taxa diária foi calculada automaticamente baseada na equipe do freelancer.`,
      });

      // Refresh data
      fetchAvailableUsers();
      fetchEventInterests();
      setShowAllocationDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to allocate user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao escalar usuário',
        variant: 'destructive',
      });
    }
  };

  const getRoleColor = (role: AudioVisualRole) => {
    const colors: Record<AudioVisualRole, string> = {
      camera: 'bg-blue-100 text-blue-800',
      audio: 'bg-green-100 text-green-800',
      lighting: 'bg-yellow-100 text-yellow-800',
      director: 'bg-purple-100 text-purple-800',
      producer: 'bg-red-100 text-red-800',
      assistant: 'bg-gray-100 text-gray-800',
      technician: 'bg-orange-100 text-orange-800',
      streaming: 'bg-indigo-100 text-indigo-800',
      editing: 'bg-pink-100 text-pink-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (!isGestor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Acesso restrito a gestores</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Gestão de Escala</h1>
            <p className="text-gray-600">Gerencie a escala de equipe para seus eventos</p>
          </div>
        </div>

        <Tabs defaultValue="scheduling" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduling">Escalação</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="search">Buscar Colaboradores</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Escalar Equipe para Evento</CardTitle>
                <p className="text-sm text-gray-600">Selecione um evento com freelancers interessados para escalar a equipe</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event">Evento com Interesses</Label>
                    <Select onValueChange={(value) => {
                      const event = eventsWithInterests.find(e => e.id === value);
                      setSelectedEvent(event || null);
                      setSelectedRole(''); // Reset role when event changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento com interesses" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsWithInterests.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{event.title}</span>
                              <Badge variant="secondary" className="ml-2">
                                {(event as any).interest_count} interessados
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">Função Necessária</Label>
                    <Select onValueChange={(value) => setSelectedRole(value as AudioVisualRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera">Câmera</SelectItem>
                        <SelectItem value="audio">Áudio</SelectItem>
                        <SelectItem value="lighting">Iluminação</SelectItem>
                        <SelectItem value="streaming">Streaming</SelectItem>
                        <SelectItem value="editing">Edição</SelectItem>
                        <SelectItem value="assistant">Assistente</SelectItem>
                        <SelectItem value="technician">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedEvent && (
                  <div className="mt-6 space-y-6">
                    {/* Freelancers Interessados */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Freelancers Interessados ({eventInterests.length})
                      </h3>
                      {eventInterests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {eventInterests.map((interest) => {
                            const user = users.find(u => u.id === interest.user_id);
                            if (!user) return null;
                            
                            return (
                              <Card key={interest.id} className="p-4 border-l-4 border-l-blue-500">
                                <div className="flex items-start space-x-3">
                                  <Avatar>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm">{user.name}</h4>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {user.audioVisualRoles.map((role) => (
                                        <Badge key={role} variant="secondary" className={getRoleColor(role)}>
                                          {role}
                                        </Badge>
                                      ))}
                                    </div>
                                    <Badge variant="outline" className={getExperienceColor(user.experienceLevel)}>
                                      {user.experienceLevel}
                                    </Badge>
                                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-600">
                                      <MapPin className="w-3 h-3" />
                                      <span>{user.city}, {user.state}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600">
                                      <DollarSign className="w-3 h-3" />
                                      <span>R$ {user.hourlyRate}/h</span>
                                    </div>
                                    <div className="mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {user.teamType === 'equipe_a' ? 'Equipe A' : 
                                         user.teamType === 'equipe_b' ? 'Equipe B' : 'Sem Equipe'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowAllocationDialog(true);
                                    }}
                                  >
                                    Escalar
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>Nenhum freelancer interessado neste evento</p>
                        </div>
                      )}
                    </div>

                    {/* Colaboradores Disponíveis (se função selecionada) */}
                    {selectedRole && (
                      <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <Search className="w-5 h-5 mr-2" />
                          Colaboradores Disponíveis para {selectedRole}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {availableUsers.map((user) => (
                            <Card key={user.id} className="p-4">
                              <div className="flex items-start space-x-3">
                                <Avatar>
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{user.name}</h4>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {user.audioVisualRoles.map((role) => (
                                      <Badge key={role} variant="secondary" className={getRoleColor(role)}>
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                  <Badge variant="outline" className={getExperienceColor(user.experienceLevel)}>
                                    {user.experienceLevel}
                                  </Badge>
                                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-600">
                                    <MapPin className="w-3 h-3" />
                                    <span>{user.city}, {user.state}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600">
                                    <DollarSign className="w-3 h-3" />
                                    <span>R$ {user.hourlyRate}/h</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowAllocationDialog(true);
                                  }}
                                >
                                  Escalar
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {availableUsers.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>Nenhum colaborador disponível para esta função e horário</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span>Calendário Anual de Eventos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Controles do Calendário */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentYear(currentYear - 1)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        ← Ano Anterior
                      </Button>
                      <h3 className="text-xl font-bold text-primary">{currentYear}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentYear(currentYear + 1)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        Próximo Ano →
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                        {events.length} Eventos
                      </Badge>
                    </div>
                  </div>

                  {/* Grade de Meses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                      const month = monthIndex;
                      const monthName = new Date(currentYear, month).toLocaleDateString('pt-BR', { month: 'long' });
                      const monthEvents = getEventsForMonth(currentYear, month);
                      
                      return (
                        <Card key={month} className="border-glow hover:shadow-neon transition-all duration-300">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-center text-primary capitalize">
                              {monthName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="min-h-[120px] space-y-2">
                              {monthEvents.length > 0 ? (
                                monthEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    className="p-2 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDate(new Date(event.startDate))}
                                  >
                                    <div className="text-xs font-medium text-primary truncate">
                                      {event.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(event.startDate), 'dd/MM', { locale: ptBR })}
                                    </div>
                                    <div className="flex items-center space-x-1 mt-1">
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs px-1 py-0 border-primary/30 bg-primary/5 text-primary"
                                      >
                                        {event.teamPriority === 'equipe_a' ? 'Equipe A' : 
                                         event.teamPriority === 'equipe_b' ? 'Equipe B' : 'Ambas'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center text-muted-foreground text-xs py-8">
                                  Sem eventos
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary/20 border border-primary/30 rounded"></div>
                      <span>Evento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs px-2 py-0 border-primary/30 bg-primary/5 text-primary">
                        Equipe A
                      </Badge>
                      <span>Prioridade A</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs px-2 py-0 border-primary/30 bg-primary/5 text-primary">
                        Equipe B
                      </Badge>
                      <span>Prioridade B</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Colaboradores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por nome, email ou especialidade..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSearchUsers}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{user.name}</h4>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-600 mt-1">{user.bio}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.audioVisualRoles.map((role) => (
                              <Badge key={role} variant="secondary" className={getRoleColor(role)}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                          <Badge variant="outline" className={getExperienceColor(user.experienceLevel)}>
                            {user.experienceLevel}
                          </Badge>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            <span>{user.city}, {user.state}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600">
                            <DollarSign className="w-3 h-3" />
                            <span>R$ {user.hourlyRate}/h</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Allocation Confirmation Dialog */}
        <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Escalação</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja escalar {selectedUser?.name} para {selectedEvent?.title}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedUser && selectedEvent && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Detalhes da Escalação</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Colaborador:</span>
                      <span className="font-medium">{selectedUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Função:</span>
                      <Badge className={getRoleColor(selectedRole as AudioVisualRole)}>
                        {selectedRole}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Evento:</span>
                      <span className="font-medium">{selectedEvent.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span>{format(new Date(selectedEvent.startDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horário:</span>
                      <span>
                        {format(new Date(selectedEvent.startDate), 'HH:mm', { locale: ptBR })} - 
                        {format(new Date(selectedEvent.endDate), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="font-medium text-green-600">
                        R$ {((selectedUser.hourlyRate || 0) * selectedEvent.estimatedDuration).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAllocationDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => selectedUser && selectedRole && handleAllocateUser(selectedUser.id, selectedRole)}
              >
                Confirmar Escalação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default TeamScheduling;


