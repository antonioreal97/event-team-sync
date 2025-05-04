
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const isUpcoming = new Date(event.startDate) > new Date();
  const isToday = new Date(event.startDate).toDateString() === new Date().toDateString();

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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-500">Data</p>
              <p className="font-medium">{formatDate(event.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Horário</p>
              <p className="font-medium">{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
            </div>
          </div>
          {isToday && (
            <div className="mt-2">
              <Badge className="bg-event-accent text-white hover:bg-event-accent">Hoje</Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
