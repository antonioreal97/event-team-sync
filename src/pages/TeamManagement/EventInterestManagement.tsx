import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Calendar, 
  MapPin,
  AlertCircle,
  Info
} from 'lucide-react';

interface EventInterestConfirmation {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmedAt?: string;
  rejectedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  eventTitle: string;
  eventStartDate: string;
  eventEndDate: string;
  userName: string;
  userEmail: string;
  teamType?: string;
  experienceLevel?: string;
}

const EventInterestManagement = () => {
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [confirmations, setConfirmations] = useState<EventInterestConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfirmation, setSelectedConfirmation] = useState<EventInterestConfirmation | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isGestor) {
      fetchConfirmations();
    }
  }, [isGestor]);

  const fetchConfirmations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/event-interest', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('equipe-s4u-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar confirmações de interesse');
      }

      const data = await response.json();
      setConfirmations(data.confirmations);
    } catch (error) {
      console.error('Erro ao buscar confirmações:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar confirmações de interesse',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedConfirmation) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/event-interest/${selectedConfirmation.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('equipe-s4u-token')}`
        },
        body: JSON.stringify({ notes: actionNotes })
      });

      if (!response.ok) {
        throw new Error('Falha ao aprovar interesse');
      }

      toast({
        title: 'Sucesso',
        description: 'Interesse aprovado com sucesso',
        variant: 'default',
      });

      // Atualizar lista
      await fetchConfirmations();
      setSelectedConfirmation(null);
      setActionNotes('');
    } catch (error) {
      console.error('Erro ao aprovar interesse:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao aprovar interesse',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedConfirmation) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/event-interest/${selectedConfirmation.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('equipe-s4u-token')}`
        },
        body: JSON.stringify({ notes: actionNotes })
      });

      if (!response.ok) {
        throw new Error('Falha ao rejeitar interesse');
      }

      toast({
        title: 'Sucesso',
        description: 'Interesse rejeitado com sucesso',
        variant: 'default',
      });

      // Atualizar lista
      await fetchConfirmations();
      setSelectedConfirmation(null);
      setActionNotes('');
    } catch (error) {
      console.error('Erro ao rejeitar interesse:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao rejeitar interesse',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pendente</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Status desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!isGestor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600">Acesso negado. Apenas administradores podem acessar esta página.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
            <p className="text-foreground">Carregando confirmações de interesse...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const pendingConfirmations = confirmations.filter(c => c.status === 'pending');
  const confirmedConfirmations = confirmations.filter(c => c.status === 'confirmed');
  const rejectedConfirmations = confirmations.filter(c => c.status === 'rejected');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Interesse em Eventos</h1>
            <p className="text-gray-600">Gerencie as confirmações de interesse dos freelancers</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingConfirmations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">{confirmedConfirmations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedConfirmations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{confirmations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmações Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span>Confirmações Pendentes ({pendingConfirmations.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingConfirmations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma confirmação pendente</p>
            ) : (
              <div className="space-y-4">
                {pendingConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {confirmation.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{confirmation.userName}</h3>
                          <p className="text-sm text-gray-600">{confirmation.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(confirmation.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedConfirmation(confirmation)}
                            >
                              Gerenciar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gerenciar Interesse</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold">Evento</h4>
                                <p className="text-gray-700">{confirmation.eventTitle}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(confirmation.eventStartDate)} - {formatDate(confirmation.eventEndDate)}</span>
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-semibold">Freelancer</h4>
                                <p className="text-gray-700">{confirmation.userName}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  {confirmation.teamType && (
                                    <span className="flex items-center space-x-1">
                                      <Users className="h-4 w-4" />
                                      <span>Equipe {confirmation.teamType === 'equipe_a' ? 'A' : 'B'}</span>
                                    </span>
                                  )}
                                  {confirmation.experienceLevel && (
                                    <span className="capitalize">{confirmation.experienceLevel}</span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-semibold">Observações (opcional)</h4>
                                <Textarea
                                  placeholder="Adicione observações sobre a aprovação/rejeição..."
                                  value={actionNotes}
                                  onChange={(e) => setActionNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <div className="flex space-x-2">
                                <Button
                                  onClick={handleApprove}
                                  disabled={actionLoading}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {actionLoading ? 'Aprovando...' : 'Aprovar'}
                                </Button>
                                <Button
                                  onClick={handleReject}
                                  disabled={actionLoading}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  {actionLoading ? 'Rejeitando...' : 'Rejeitar'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Evento:</p>
                        <p className="font-medium">{confirmation.eventTitle}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Data do Evento:</p>
                        <p className="font-medium">
                          {formatDate(confirmation.eventStartDate)} - {formatDate(confirmation.eventEndDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Equipe:</p>
                        <p className="font-medium">
                          {confirmation.teamType ? `Equipe ${confirmation.teamType === 'equipe_a' ? 'A' : 'B'}` : 'Não definida'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Nível de Experiência:</p>
                        <p className="font-medium capitalize">
                          {confirmation.experienceLevel || 'Não informado'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Interesse confirmado em: {formatDateTime(confirmation.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmações Aprovadas */}
        {confirmedConfirmations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Confirmações Aprovadas ({confirmedConfirmations.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {confirmedConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="border rounded-lg p-4 space-y-3 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            {confirmation.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{confirmation.userName}</h3>
                          <p className="text-sm text-gray-600">{confirmation.eventTitle}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Aprovado em: {formatDateTime(confirmation.confirmedAt || '')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirmações Rejeitadas */}
        {rejectedConfirmations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Confirmações Rejeitadas ({rejectedConfirmations.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rejectedConfirmations.map((confirmation) => (
                  <div key={confirmation.id} className="border rounded-lg p-4 space-y-3 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-semibold">
                            {confirmation.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{confirmation.userName}</h3>
                          <p className="text-sm text-gray-600">{confirmation.eventTitle}</p>
                          {confirmation.notes && (
                            <p className="text-sm text-red-600">Motivo: {confirmation.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Rejeitado em: {formatDateTime(confirmation.rejectedAt || '')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default EventInterestManagement;
