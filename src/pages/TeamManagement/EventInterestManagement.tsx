import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetPendingAllocationsForGestor } from '@/services/teamAllocationApiService';
import { Users, Calendar, Clock, ExternalLink } from 'lucide-react';

interface PendingAllocationRow {
  id: string;
  event_id: string;
  user_id: string;
  assigned_role: string;
  status: string;
  event_title: string;
  event_start_date: string;
  user_name: string;
  user_email: string;
  created_at?: string;
}

const EventInterestManagement = () => {
  const { isGestor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState<PendingAllocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await apiGetPendingAllocationsForGestor();
      setAllocations(rows as unknown as PendingAllocationRow[]);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar pendências de escalação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isGestor) void load();
  }, [isGestor, load]);

  if (!isGestor) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Apenas gestores podem acessar esta página.
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pendências de escalação</h1>
            <p className="text-muted-foreground text-sm">
              Profissionais escalados que ainda não confirmaram disponibilidade. Ao recusar, eles notificam você
              para escalar outro.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : allocations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhuma alocação pendente de confirmação de disponibilidade.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {allocations.map((a) => (
              <Card key={a.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{a.event_title}</CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {a.event_start_date
                        ? new Date(a.event_start_date).toLocaleDateString('pt-BR')
                        : '—'}
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Aguardando freelancer
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Profissional: </span>
                    <span className="font-medium">{a.user_name}</span>
                    <span className="text-muted-foreground"> ({a.user_email})</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Função: </span>
                    <span className="font-medium">{a.assigned_role}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/events/${a.event_id}`)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir evento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EventInterestManagement;
