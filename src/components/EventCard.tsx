
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { deleteEvent } from '@/services/eventService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onEventDeleted?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEventDeleted }) => {
  const navigate = useNavigate();
  const { isGestor } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) {
        return 'Data não informada';
      }
      
      let date: Date;
      
      // Se a data já tem timezone (formato ISO), usar diretamente
      if (dateString.includes('T') && (dateString.includes('+') || dateString.includes('Z'))) {
        date = new Date(dateString);
      } 
      // Se é apenas data (YYYY-MM-DD), adicionar horário no meio-dia
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T12:00:00');
      }
      // Para outros formatos, tentar criar data diretamente
      else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        logger.warn('Data inválida detectada:', dateString);
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
      logger.error('Erro ao formatar data:', error, 'String original:', dateString);
      return 'Data inválida';
    }
  };
  
  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return 'Horário não informado';
      
      let date: Date;
      
      // Se a data já tem timezone (formato ISO), usar diretamente
      if (dateString.includes('T') && (dateString.includes('+') || dateString.includes('Z'))) {
        date = new Date(dateString);
      } 
      // Se é apenas data (YYYY-MM-DD), adicionar horário no meio-dia
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T12:00:00');
      }
      // Para outros formatos, tentar criar data diretamente
      else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        logger.warn('Horário inválido detectado:', dateString);
        return 'Horário inválido';
      }
      
      const formatted = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      return formatted;
    } catch (error) {
      logger.error('Erro ao formatar horário:', error, 'String original:', dateString);
      return 'Horário inválido';
    }
  };

  const getStatusBadge = () => {
    switch(event.status) {
      case 'planning':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Em Planejamento</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Confirmado</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Em Progresso</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-100">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const isUpcoming = () => {
    try {
      const startDate = new Date(event.startDate);
      if (isNaN(startDate.getTime())) return false;
      return startDate > new Date();
    } catch (error) {
      return false;
    }
  };

  const isToday = () => {
    try {
      const startDate = new Date(event.startDate);
      if (isNaN(startDate.getTime())) return false;
      return startDate.toDateString() === new Date().toDateString();
    } catch (error) {
      return false;
    }
  };

  const handleDeleteEvent = async () => {
    if (!isGestor || event.status !== 'cancelled') return;
    
    setIsDeleting(true);
    try {
      await deleteEvent(event.id);
      
      toast({
        title: 'Evento excluído',
        description: `O evento "${event.title}" foi excluído com sucesso.`,
      });
      
      // Notificar o componente pai para atualizar a lista
      if (onEventDeleted) {
        onEventDeleted(event.id);
      }
      
      setShowDeleteDialog(false);
    } catch (error) {
      logger.error('Erro ao excluir evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o evento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{event.title}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-500">Local</p>
            <p className="font-medium">{event.location}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Data de Início</p>
              <p className="font-medium">{formatDate(event.startDate)}</p>
              {event.dailySchedule && event.dailySchedule.length > 0 && (
                <p className="text-sm text-gray-500">
                  {event.dailySchedule[0].startTime} - {event.dailySchedule[0].endTime}
                </p>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Data de Fim</p>
              <p className="font-medium">{formatDate(event.endDate)}</p>
              {event.dailySchedule && event.dailySchedule.length > 0 && (
                <p className="text-sm text-gray-500">
                  {event.dailySchedule[event.dailySchedule.length - 1].startTime} - {event.dailySchedule[event.dailySchedule.length - 1].endTime}
                </p>
              )}
            </div>
          </div>
          
          {isToday() && (
            <div className="mt-2">
              <Badge className="bg-event-accent text-white hover:bg-event-accent">Hoje</Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            Ver Detalhes
          </Button>
          {isGestor && event.status !== 'cancelled' && (
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => navigate(`/events/${event.id}/edit`)}
            >
              Editar
            </Button>
          )}
          {isGestor && event.status === 'cancelled' && (
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </CardFooter>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o evento "{event.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EventCard;
