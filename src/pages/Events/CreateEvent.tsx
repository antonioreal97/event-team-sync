
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Event, AudioVisualRole, EventType } from '@/types';
import { createEvent } from '@/services/eventService';
import { 
  generateEventPricingSummary, 
  calculateTotalDays, 
  isMultiDayEvent,
  getEventTypeDescription,
  calculateDailyRate,
  calculateTotalPayment
} from '@/services/pricingService';
import { Award, Users, Calendar, MapPin, DollarSign, Clock, Info } from 'lucide-react';

const CreateEvent = () => {
  const navigate = useNavigate();
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
    teamPriority: 'equipe_a' as const,
    allowTeamB: true,
  });

  const [loading, setLoading] = useState(false);
  const [pricingSummary, setPricingSummary] = useState<any>(null);

  // Calcula o resumo de preços quando os dados mudam
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.eventType) {
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
    }
  }, [formData.startDate, formData.endDate, formData.eventType, formData.teamPriority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calcula os valores automaticamente
      const totalDays = calculateTotalDays(formData.startDate, formData.endDate);
      const isMultiDay = isMultiDayEvent(formData.startDate, formData.endDate);
      const workingDays = calculateWorkingDays(formData.startDate, formData.endDate);

      const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'planning',
        createdBy: user!.id,
        eventType: formData.eventType,
        estimatedDuration: parseInt(formData.estimatedDuration),
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        requirements: formData.requirements,
        notes: formData.notes,
        teamPriority: formData.teamPriority,
        allowTeamB: formData.allowTeamB,
        dailyRateTeamA: pricingSummary?.equipe_a.dailyRate || 0,
        dailyRateTeamB: pricingSummary?.equipe_b.dailyRate || 0,
        isMultiDay,
        totalDays,
        workingDays,
      };

      await createEvent(eventData);

      toast({
        title: 'Evento criado',
        description: 'Evento criado com sucesso!',
      });

      navigate('/events');
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar evento',
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
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workingDays: string[] = [];
    
    // Se for o mesmo dia
    if (start.toDateString() === end.toDateString()) {
      workingDays.push(start.toISOString().split('T')[0]);
      return workingDays;
    }
    
    // Para eventos multi-dia
    const current = new Date(start);
    while (current <= end) {
      workingDays.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Criar Novo Evento</h1>
            <p className="text-gray-600">Configure os detalhes do evento e prioridade de equipe</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as EventType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Evento Normal</SelectItem>
                      <SelectItem value="especial">Evento Especial</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getEventTypeDescription(formData.eventType)}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Data e Horário</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedDuration">Duração Estimada (horas) *</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                    required
                    min="1"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    id="allowTeamB"
                    type="checkbox"
                    checked={formData.allowTeamB}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowTeamB: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="allowTeamB">Permitir Equipe B como backup</Label>
                </div>
              </div>

              {/* Pricing Summary - Design Dourado */}
              {pricingSummary && (
                <div className="mt-4 relative p-6 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-xl border-2 border-amber-400/50 shadow-inner">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Equipe A */}
                      <div className="bg-gradient-to-r from-amber-700/80 to-amber-600/80 p-4 rounded-lg border border-amber-400/40">
                        <div className="text-center">
                          <div className="font-semibold text-amber-100 mb-2">Equipe A</div>
                          <div className="text-amber-200 text-sm">R$ {pricingSummary.equipe_a.dailyRate}/dia</div>
                          <div className="text-amber-100 font-bold text-lg">
                            Total: R$ {pricingSummary.equipe_a.totalPayment}
                          </div>
                        </div>
                      </div>
                      
                      {/* Equipe B */}
                      <div className="bg-gradient-to-r from-amber-600/80 to-amber-500/80 p-4 rounded-lg border border-amber-400/40">
                        <div className="text-center">
                          <div className="font-semibold text-amber-100 mb-2">Equipe B</div>
                          <div className="text-amber-200 text-sm">R$ {pricingSummary.equipe_b.dailyRate}/dia</div>
                          <div className="text-amber-100 font-bold text-lg">
                            Total: R$ {pricingSummary.equipe_b.totalPayment}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Nota Multi-dia */}
                    {pricingSummary.isMultiDay && (
                      <div className="bg-amber-800/60 p-3 rounded-lg border border-amber-400/30">
                        <p className="text-xs text-amber-200 text-center">
                          ⚠️ Este é um evento multi-dia. Os freelancers aceitarão todos os dias do evento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Priority - Apenas para gestores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Prioridade de Equipe</span>
              </CardTitle>
              <CardDescription>
                Configure qual equipe tem prioridade para este evento (apenas gestores veem essas informações)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teamPriority">Equipe Prioritária *</Label>
                <Select
                  value={formData.teamPriority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teamPriority: value as any }))}
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
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Esta informação é visível apenas para gestores para evitar intrigas entre equipes
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  id="allowTeamB"
                  type="checkbox"
                  checked={formData.allowTeamB}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowTeamB: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="allowTeamB">Permitir Equipe B como backup</Label>
                <p className="text-xs text-gray-500 ml-2">
                  (Visível apenas para gestores)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Requisitos de Equipe</span>
              </CardTitle>
              <CardDescription>
                Selecione as funções necessárias para o evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'camera', 'audio', 'lighting', 'director', 
                  'producer', 'assistant', 'technician', 'streaming', 'editing'
                ].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <input
                      id={role}
                      type="checkbox"
                      checked={formData.requirements.includes(role as AudioVisualRole)}
                      onChange={(e) => handleRequirementChange(role as AudioVisualRole, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={role} className="text-sm capitalize">
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
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Informações adicionais, observações especiais, etc."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/events')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreateEvent;
