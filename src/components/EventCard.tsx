
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const { isGestor } = useAuth();

  // Log temporário para debug
  console.log('🎯 EVENTCARD RECEBEU:', {
    id: event.id,
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    startDateType: typeof event.startDate,
    endDateType: typeof event.endDate
  });

  const formatDate = (dateString: string | null | undefined) => {
    console.log('📅 formatDate chamada com:', dateString, 'Tipo:', typeof dateString);
    
    try {
      if (!dateString) {
        console.log('❌ Data vazia, retornando "Data não informada"');
        return 'Data não informada';
      }
      
      // Criar data no meio-dia para evitar problemas de timezone
      const date = new Date(dateString + 'T12:00:00');
      console.log('📅 Data criada:', date, 'É válida?', !isNaN(date.getTime()));
      
      if (isNaN(date.getTime())) {
        console.warn('❌ Data inválida detectada:', dateString);
        return 'Data inválida';
      }
      
      const formatted = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        weekday: 'long'
      });
      
      console.log('✅ Data formatada:', formatted);
      return formatted;
    } catch (error) {
      console.error('❌ Erro ao formatar data:', error, 'String original:', dateString);
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

  const getStatusBadge = () => {
    switch(event.status) {
      case 'planning':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Em Planejamento</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Ativo</Badge>;
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
          {isGestor && (
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => navigate(`/events/${event.id}/edit`)}
            >
              Editar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
