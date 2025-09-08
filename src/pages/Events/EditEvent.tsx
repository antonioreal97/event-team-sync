import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Event, AudioVisualRole, EventType, DailySchedule } from '@/types';
import { getEventById, updateEvent, cancelEvent } from '@/services/eventService';
import { 
  calculateDailyRate, 
  calculateTotalPayment,
  calculateTotalDays,
  isMultiDayEvent
} from '@/services/pricingService';
import { Award, Users, Calendar, MapPin, DollarSign, Clock, Info, Plus, Trash2, FileText, Settings, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    eventType: 'normal' as EventType,
    estimatedDuration: '',
    budget: '',
    requirements: [] as AudioVisualRole[],
    notes: '',
    teamPriority: 'equipe_a' as 'equipe_a' | 'equipe_b' | 'ambas',
    allowTeamB: true,
    dailySchedule: [] as DailySchedule[],
    eventAgenda: '',
    specialInstructions: '',
    setupRequirements: '',
    technicalSpecifications: '',
    status: 'planning' as 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  });

  const [pricingSummary, setPricingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      calculatePricing();
    }
  }, [formData.startDate, formData.endDate, formData.eventType, formData.teamPriority]);

  // Gera programação automática quando as datas mudam
  useEffect(() => {
    // Só gerar programação se não houver programação existente
    if (formData.startDate && formData.endDate && formData.dailySchedule.length === 0) {
      generateDailySchedule();
    }
  }, [formData.startDate, formData.endDate, formData.dailySchedule.length]);

  const calculatePricing = () => {
    if (!formData.startDate || !formData.endDate) return;
    
    const totalDays = calculateTotalDays(formData.startDate, formData.endDate);
    const isMultiDay = isMultiDayEvent(formData.startDate, formData.endDate);
    
    const summary = {
      totalDays,
      isMultiDay,
      equipe_a: {
        dailyRate: calculateDailyRate(formData.eventType, 'equipe_a'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(formData.eventType, 'equipe_a'),
          totalDays
        ),
      },
      equipe_b: {
        dailyRate: calculateDailyRate(formData.eventType, 'equipe_b'),
        totalPayment: calculateTotalPayment(
          calculateDailyRate(formData.eventType, 'equipe_b'),
          totalDays
        ),
      },
    };
    
    setPricingSummary(summary);
  };

  const fetchEventData = async () => {
    if (!id) return;
    
    try {
      setInitialLoading(true);
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



      // Preenche o formulário com os dados existentes
      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        location: eventData.location || '',
        startDate: eventData.startDate ? new Date(eventData.startDate).toISOString().split('T')[0] : '',
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().split('T')[0] : '',
        eventType: eventData.eventType || 'normal',
        estimatedDuration: eventData.estimatedDuration?.toString() || '',
        budget: eventData.budget?.toString() || '',
        requirements: eventData.requirements || [],
        notes: eventData.notes || '',
        teamPriority: eventData.teamPriority || 'equipe_a' as const,
        allowTeamB: eventData.allowTeamB ?? true,
        // Novos campos
        dailySchedule: eventData.dailySchedule || [],
        eventAgenda: eventData.eventAgenda || '',
        specialInstructions: eventData.specialInstructions || '',
        setupRequirements: eventData.setupRequirements || '',
        technicalSpecifications: eventData.technicalSpecifications || '',
        status: eventData.status || 'planning',
      });


    } catch (error) {
      console.error('Failed to fetch event data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do evento',
        variant: 'destructive',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const generateDailySchedule = () => {
    if (!formData.startDate || !formData.endDate) return;
    

    
    // Criar datas sem problemas de timezone - usar UTC para evitar conversão
    const start = new Date(formData.startDate + 'T12:00:00Z');
    const end = new Date(formData.endDate + 'T12:00:00Z');
    

    
    const schedule: DailySchedule[] = [];
    
    let current = new Date(start);
    let dayIndex = 0;
    
    while (current <= end) {
      // Usar UTC para evitar problemas de timezone
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, '0');
      const day = String(current.getUTCDate()).padStart(2, '0');
      const currentDateString = `${year}-${month}-${day}`;
      

      
      // Verificar se já existe uma programação para este dia
      const existingDay = formData.dailySchedule.find(d => d.date === currentDateString);
      
      // Para este evento específico, TODOS os dias são "Evento Principal"
      schedule.push({
        id: `day-${dayIndex}`,
        date: currentDateString,
        startTime: existingDay?.startTime || '09:00', // Preservar horário existente ou usar padrão
        endTime: existingDay?.endTime || '17:00',     // Preservar horário existente ou usar padrão
        activities: existingDay?.activities || [],
        requiredRoles: existingDay?.requiredRoles || [],
        notes: existingDay?.notes || '',
        isSetupDay: false,      // Sempre false
        isMainEventDay: true,   // Sempre true
        isTeardownDay: false,   // Sempre false
      });
      
      // Avançar para o próximo dia usando UTC
      current.setUTCDate(current.getUTCDate() + 1);
      dayIndex++;
    }
    

    
    setFormData(prev => ({ ...prev, dailySchedule: schedule }));
  };

  const addActivityToDay = (dayId: string, activity: string) => {
    if (!activity.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      dailySchedule: prev.dailySchedule.map(day => 
        day.id === dayId 
          ? { ...day, activities: [...day.activities, activity.trim()] }
          : day
      )
    }));
  };

  const removeActivityFromDay = (dayId: string, activityIndex: number) => {
    setFormData(prev => ({
      ...prev,
      dailySchedule: prev.dailySchedule.map(day => 
        day.id === dayId 
          ? { ...day, activities: day.activities.filter((_, index) => index !== activityIndex) }
          : day
      )
    }));
  };

  const updateDaySchedule = (dayId: string, field: keyof DailySchedule, value: any) => {
    setFormData(prev => ({
      ...prev,
      dailySchedule: prev.dailySchedule.map(day => 
        day.id === dayId ? { ...day, [field]: value } : day
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);

    try {
      // Calcula os valores automaticamente
      const totalDays = calculateTotalDays(formData.startDate, formData.endDate);
      const isMultiDay = isMultiDayEvent(formData.startDate, formData.endDate);
      const workingDays = calculateWorkingDays(formData.startDate, formData.endDate);

      // Usa snake_case para os campos como esperado pelo backend
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: formData.startDate,
        end_date: formData.endDate,
        event_type: formData.eventType,
        estimated_duration: parseInt(formData.estimatedDuration),
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        requirements: formData.requirements,
        notes: formData.notes,
        team_priority: formData.teamPriority,
        allow_team_b: formData.allowTeamB,
        daily_rate_team_a: pricingSummary?.equipe_a.dailyRate || 0,
        daily_rate_team_b: pricingSummary?.equipe_b.dailyRate || 0,
        is_multi_day: isMultiDay,
        total_days: totalDays,
        working_days: workingDays,
        // Novos campos para programação
        daily_schedule: formData.dailySchedule,
        event_agenda: formData.eventAgenda,
        special_instructions: formData.specialInstructions,
        setup_requirements: formData.setupRequirements,
        technical_specifications: formData.technicalSpecifications,
        status: formData.status,
      };

      await updateEvent(id, eventData);

      toast({
        title: 'Evento atualizado',
        description: 'Evento atualizado com sucesso!',
      });

      navigate('/events');
    } catch (error) {
      console.error('Failed to update event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementChange = (requirement: AudioVisualRole, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirement]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        requirements: prev.requirements.filter(r => r !== requirement)
      }));
    }
  };

  const calculateWorkingDays = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate + 'T12:00:00Z');
    const end = new Date(endDate + 'T12:00:00Z');
    const workingDays: string[] = [];
    
    if (start.toDateString() === end.toDateString()) {
      workingDays.push(start.toISOString().split('T')[0]);
      return workingDays;
    }
    
    const current = new Date(start);
    while (current <= end) {
      workingDays.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }
    
    return workingDays;
  };

  const handleCancelEvent = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await cancelEvent(id, cancelReason || undefined);
      
      toast({
        title: 'Evento Cancelado',
        description: 'O evento foi cancelado e os interessados foram notificados.',
      });
      
      navigate('/events');
    } catch (error) {
      console.error('Erro ao cancelar evento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar evento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Data não informada';
      
      // Criar data usando UTC para evitar problemas de timezone
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      
      if (isNaN(date.getTime())) return 'Data inválida';
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Verificar se o usuário tem permissão para editar
  if (!isGestor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h2>
            <p className="text-gray-600">Apenas gestores podem editar eventos.</p>
            <Button 
              onClick={() => navigate('/events')}
              className="mt-4"
            >
              Voltar para Eventos
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (initialLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Carregando evento...</p>
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
            <h1 className="text-3xl font-bold">Editar Evento</h1>
            <p className="text-gray-600">Atualize as informações do evento e programação</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {formData.status === 'planning' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Evento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span>Cancelar Evento</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá cancelar o evento e notificar todos os freelancers que demonstraram interesse. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cancelReason">Motivo do cancelamento (opcional)</Label>
                    <Textarea
                      id="cancelReason"
                      placeholder="Explique o motivo do cancelamento..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter Evento</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelEvent}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <Button
              variant="outline"
              onClick={() => navigate('/events')}
            >
              Voltar para Eventos
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="title">Título do Evento *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventType">Tipo de Evento *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value: EventType) => setFormData(prev => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Evento Normal</SelectItem>
                      <SelectItem value="especial">Evento Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status do Evento *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Local *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimatedDuration">Duração Estimada (horas)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    min="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Preços - Design Dourado */}
          {pricingSummary && (
            <Card className="bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-700 border-amber-500/30 shadow-2xl">
              <CardHeader className="border-b border-amber-400/20">
                <CardTitle className="flex items-center space-x-2 text-amber-100">
                  <DollarSign className="h-6 w-6 text-amber-300" />
                  <span className="text-amber-100 font-bold">Resumo de Preços</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Barra de Ouro Principal */}
                <div className="relative p-6 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-xl border-2 border-amber-400/50 shadow-inner">
                  {/* Efeito de Brilho */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"></div>
                  
                  <div className="relative z-10 space-y-4">
                    {/* Total de Dias - Destaque */}
                    <div className="text-center pb-3 border-b border-amber-400/30">
                      <div className="text-2xl font-bold text-amber-900 mb-1">
                        {pricingSummary.totalDays}
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
                            <div className="text-amber-200 text-sm">R$ {pricingSummary.equipe_a.dailyRate}/dia</div>
                            <div className="text-amber-100 font-bold text-lg">
                              R$ {pricingSummary.equipe_a.totalPayment}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Equipe B */}
                      <div className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 p-4 rounded-lg border border-amber-400/40">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-amber-100">Equipe B</span>
                          <div className="text-right">
                            <div className="text-amber-200 text-sm">R$ {pricingSummary.equipe_b.dailyRate}/dia</div>
                            <div className="text-amber-100 font-bold text-lg">
                              R$ {pricingSummary.equipe_b.totalPayment}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requisitos de Equipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Requisitos de Equipe</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['camera', 'audio', 'lighting', 'director', 'producer', 'assistant', 'technician', 'streaming', 'editing'] as AudioVisualRole[]).map((requirement) => (
                  <div key={requirement} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={requirement}
                      checked={formData.requirements.includes(requirement)}
                      onChange={(e) => handleRequirementChange(requirement, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={requirement} className="capitalize">
                      {requirement === 'camera' ? 'Câmera' :
                       requirement === 'audio' ? 'Áudio' :
                       requirement === 'lighting' ? 'Iluminação' :
                       requirement === 'director' ? 'Direção' :
                       requirement === 'producer' ? 'Produção' :
                       requirement === 'assistant' ? 'Assistente' :
                       requirement === 'technician' ? 'Técnico' :
                       requirement === 'streaming' ? 'Streaming' :
                       requirement === 'editing' ? 'Edição' : requirement}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Equipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Configurações de Equipe</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamPriority">Prioridade de Equipe</Label>
                  <Select
                    value={formData.teamPriority}
                    onValueChange={(value: 'equipe_a' | 'equipe_b' | 'ambas') => 
                      setFormData(prev => ({ ...prev, teamPriority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipe_a">Equipe A - Prioridade Máxima</SelectItem>
                      <SelectItem value="equipe_b">Equipe B - Suporte</SelectItem>
                      <SelectItem value="ambas">Ambas as Equipes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="allowTeamB">Backup Equipe B</Label>
                  <Select
                    value={formData.allowTeamB ? 'true' : 'false'}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, allowTeamB: value === 'true' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Permitido</SelectItem>
                      <SelectItem value="false">Não permitido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Programação dos Dias do Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Programação dos Dias do Evento</span>
              </CardTitle>
              <CardDescription>
                Configure a agenda detalhada para cada dia do evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.dailySchedule.map((day, index) => (
                <div key={day.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold">Dia {index + 1}</h4>
                      <Badge className="bg-green-100 text-green-800">
                        Evento Principal
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDate(day.date)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`startTime-${day.id}`}>Horário de Início</Label>
                      <Input
                        id={`startTime-${day.id}`}
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDaySchedule(day.id, 'startTime', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`endTime-${day.id}`}>Horário de Fim</Label>
                      <Input
                        id={`endTime-${day.id}`}
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDaySchedule(day.id, 'endTime', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor={`activities-${day.id}`}>Atividades do Dia</Label>
                    <Textarea
                      id={`activities-${day.id}`}
                      value={day.activities.join('\n')}
                      onChange={(e) => {
                        const activities = e.target.value.split('\n').filter(activity => activity.trim());
                        updateDaySchedule(day.id, 'activities', activities);
                      }}
                      rows={3}
                      placeholder="Descreva as atividades deste dia..."
                    />
                  </div>

                  <div className="mb-4">
                    <Label>Funções Requeridas</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(['camera', 'audio', 'lighting', 'director', 'producer', 'assistant', 'technician', 'streaming', 'editing'] as AudioVisualRole[]).map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${day.id}-${role}`}
                            checked={day.requiredRoles.includes(role)}
                            onChange={(e) => {
                              const currentRoles = [...day.requiredRoles];
                              if (e.target.checked) {
                                currentRoles.push(role);
                              } else {
                                const index = currentRoles.indexOf(role);
                                if (index > -1) {
                                  currentRoles.splice(index, 1);
                                }
                              }
                              updateDaySchedule(day.id, 'requiredRoles', currentRoles);
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`${day.id}-${role}`} className="text-sm capitalize">
                            {role === 'camera' ? 'Câmera' :
                             role === 'audio' ? 'Áudio' :
                             role === 'lighting' ? 'Iluminação' :
                             role === 'director' ? 'Direção' :
                             role === 'producer' ? 'Produção' :
                             role === 'assistant' ? 'Assistente' :
                             role === 'technician' ? 'Técnico' :
                             role === 'streaming' ? 'Streaming' :
                             role === 'editing' ? 'Edição' : role}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`notes-${day.id}`}>Observações do Dia</Label>
                    <Textarea
                      id={`notes-${day.id}`}
                      value={day.notes}
                      onChange={(e) => updateDaySchedule(day.id, 'notes', e.target.value)}
                      rows={2}
                      placeholder="Observações específicas para este dia..."
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Informações Específicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Informações Específicas</span>
              </CardTitle>
              <CardDescription>
                Detalhes técnicos e instruções para a equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventAgenda">Agenda Geral</Label>
                <Textarea
                  id="eventAgenda"
                  value={formData.eventAgenda}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventAgenda: e.target.value }))}
                  rows={3}
                  placeholder="Descreva a agenda geral do evento..."
                />
              </div>

              <div>
                <Label htmlFor="specialInstructions">Instruções Especiais</Label>
                <Textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  rows={3}
                  placeholder="Instruções especiais para a equipe..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="setupRequirements">Requisitos de Setup</Label>
                  <Textarea
                    id="setupRequirements"
                    value={formData.setupRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, setupRequirements: e.target.value }))}
                    rows={3}
                    placeholder="Requisitos para montagem e preparação..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="technicalSpecifications">Especificações Técnicas</Label>
                  <Textarea
                    id="technicalSpecifications"
                    value={formData.technicalSpecifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, technicalSpecifications: e.target.value }))}
                    rows={3}
                    placeholder="Especificações técnicas do evento..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/events')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar Evento'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default EditEvent;
