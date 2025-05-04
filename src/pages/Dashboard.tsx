
import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserEvents } from '@/services/eventService';
import { Event } from '@/types';
import EventCard from '@/components/EventCard';

const Dashboard = () => {
  const { user, isProducer } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        const userEvents = await getUserEvents(user);
        setEvents(userEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Filter events
  const upcomingEvents = events.filter(event => 
    new Date(event.startDate) > new Date() && event.status !== 'cancelled'
  );
  
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString() && event.status !== 'cancelled';
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h1>Dashboard</h1>
          {isProducer && (
            <Button onClick={() => navigate('/events/new')}>
              Novo Evento
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Carregando...</p>
          </div>
        ) : (
          <>
            {todayEvents.length > 0 && (
              <section>
                <h2 className="text-xl font-heading mb-4">Eventos Hoje</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-heading mb-4">Próximos Eventos</h2>
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500">Nenhum evento futuro encontrado</p>
                    {isProducer && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate('/events/new')}
                      >
                        Criar Novo Evento
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-heading mb-4">Métricas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total de Eventos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">{events.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Eventos Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">
                      {events.filter(event => event.status === 'active').length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Eventos Futuros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">{upcomingEvents.length}</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
