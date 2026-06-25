import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  acceptFreelancerInvite,
  getCurrentPendingInvite,
  type FreelancerInvite,
} from '@/services/inviteService';

const teamLabels: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  sem_equipe: 'Sem equipe',
};

const InviteAccept = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<FreelancerInvite | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [form, setForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadInvite = async () => {
      setChecking(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setHasSession(Boolean(session?.user));

      if (session?.user) {
        const pendingInvite = await getCurrentPendingInvite();
        if (!mounted) return;
        setInvite(pendingInvite);
        setForm((current) => ({
          ...current,
          name: pendingInvite?.name || session.user.user_metadata?.name || '',
        }));
      }

      setChecking(false);
    };

    void loadInvite();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadInvite();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    try {
      await acceptFreelancerInvite({
        name: form.name,
        password: form.password,
        phone: form.phone,
        city: form.city,
        state: form.state,
      });
      toast.success('Cadastro concluído.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível aceitar o convite.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center">
            <img src="/logo-s4u.png" alt="Equipe S4U Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Convite Equipe S4U</h1>
            <p className="text-sm text-muted-foreground">Finalize seu acesso para acompanhar escalas.</p>
          </div>
        </div>

        {checking ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Validando convite...
            </CardContent>
          </Card>
        ) : !hasSession ? (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>Abra pelo link do email</AlertTitle>
            <AlertDescription>
              O convite precisa ser aberto pelo link enviado para seu email para liberar a criação da senha.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Completar cadastro
              </CardTitle>
              <CardDescription>
                {invite
                  ? `Convite para o nível ${teamLabels[invite.teamType] || invite.teamType}.`
                  : 'Complete seu perfil para entrar no sistema.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Nome completo</Label>
                  <Input
                    id="invite-name"
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-phone">Telefone</Label>
                    <Input
                      id="invite-phone"
                      value={form.phone}
                      onChange={(event) => handleChange('phone', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-state">Estado</Label>
                    <Input
                      id="invite-state"
                      value={form.state}
                      onChange={(event) => handleChange('state', event.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-city">Cidade</Label>
                  <Input
                    id="invite-city"
                    value={form.city}
                    onChange={(event) => handleChange('city', event.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-password">Senha</Label>
                    <Input
                      id="invite-password"
                      type="password"
                      minLength={6}
                      value={form.password}
                      onChange={(event) => handleChange('password', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-confirm-password">Confirmar senha</Label>
                    <Input
                      id="invite-confirm-password"
                      type="password"
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(event) => handleChange('confirmPassword', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Entrar na equipe
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;
