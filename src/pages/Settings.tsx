import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    eventReminders: boolean;
    teamUpdates: boolean;
    paymentNotifications: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordChangeRequired: boolean;
    loginNotifications: boolean;
  };
}

interface LoginHistory {
  id: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location: string;
  device: string;
  browser: string;
  os: string;
  status: 'success' | 'failed' | 'suspicious';
  reason?: string;
}

const Settings = () => {
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      eventReminders: true,
      teamUpdates: true,
      paymentNotifications: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 60,
      loginNotifications: true,
      passwordChangeRequired: false,
    },
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadUserSettings();
    loadLoginHistory();
  }, []);

  const loadUserSettings = async () => {
    setLoading(true);
    try {
      // Aqui você pode carregar as configurações do usuário da API
      // Por enquanto, usamos as configurações padrão
    } catch (error) {
      logger.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      // Capturar informações do login atual
      const currentLogin = await captureCurrentLoginInfo();
      
      // Carregar histórico existente do localStorage
      const existingHistory = localStorage.getItem('equipe-s4u-login-history');
      let history: LoginHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Converter strings de data de volta para objetos Date
      history = history.map(login => ({
        ...login,
        timestamp: new Date(login.timestamp)
      }));
      
      // Adicionar login atual se não existir
      const loginExists = history.find(login => 
        login.timestamp.toISOString() === currentLogin.timestamp.toISOString() &&
        login.ipAddress === currentLogin.ipAddress
      );
      
      if (!loginExists) {
        history.unshift(currentLogin);
        
        // Manter apenas os últimos 50 logins
        if (history.length > 50) {
          history = history.slice(0, 50);
        }
        
        // Salvar no localStorage
        localStorage.setItem('equipe-s4u-login-history', JSON.stringify(history));
      }
      
      setLoginHistory(history);
    } catch (error) {
      logger.error('Erro ao carregar histórico de logins:, error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar histórico de logins',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const captureCurrentLoginInfo = async (): Promise<LoginHistory> => {
    // Capturar informações do navegador
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    
    // Detectar dispositivo
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const device = isMobile ? 'Mobile' : 'Desktop';
    
    // Detectar navegador
    let browser = 'Desconhecido';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    // Detectar sistema operacional
    let os = 'Desconhecido';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    // Tentar obter IP e localização
    let ipAddress = 'Desconhecido';
    let location = 'Localização desconhecida';
    
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
      
      // Tentar obter localização baseada no IP
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        const geoData = await geoResponse.json();
        if (geoData.city && geoData.region && geoData.country_name) {
          location = `${geoData.city}, ${geoData.region}, ${geoData.country_name}`;
        }
      } catch (geoError) {
        logger.debug('Não foi possível obter localização geográfica');
      }
    } catch (ipError) {
      logger.debug('Não foi possível obter endereço IP');
    }
    
    // Gerar ID único
    const id = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      location,
      device,
      browser,
      os,
      status: 'success' as const
    };
  };

  const simulateFailedLogin = async () => {
    try {
      const failedLogin = await captureCurrentLoginInfo();
      failedLogin.status = 'failed';
      failedLogin.reason = 'Tentativa de login falhada (simulação)';
      
      // Adicionar ao histórico
      const existingHistory = localStorage.getItem('equipe-s4u-login-history');
      let history: LoginHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Converter strings de data de volta para objetos Date
      history = history.map(login => ({
        ...login,
        timestamp: new Date(login.timestamp)
      }));
      
      history.unshift(failedLogin);
      
      // Manter apenas os últimos 50 logins
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      // Salvar no localStorage
      localStorage.setItem('equipe-s4u-login-history', JSON.stringify(history));
      setLoginHistory(history);
      
      toast({
        title: 'Simulação',
        description: 'Tentativa de login falhada simulada e adicionada ao histórico',
      });
    } catch (error) {
      logger.error('Erro ao simular login falhado:, error);
    }
  };

  const simulateSuspiciousLogin = async () => {
    try {
      const suspiciousLogin = await captureCurrentLoginInfo();
      suspiciousLogin.status = 'suspicious';
      suspiciousLogin.reason = 'Acesso de localização incomum (simulação)';
      
      // Adicionar ao histórico
      const existingHistory = localStorage.getItem('equipe-s4u-login-history');
      let history: LoginHistory[] = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Converter strings de data de volta para objetos Date
      history = history.map(login => ({
        ...login,
        timestamp: new Date(login.timestamp)
      }));
      
      history.unshift(suspiciousLogin);
      
      // Manter apenas os últimos 50 logins
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      // Salvar no localStorage
      localStorage.setItem('equipe-s4u-login-history', JSON.stringify(history));
      setLoginHistory(history);
      
      toast({
        title: 'Simulação',
        description: 'Login suspeito simulado e adicionado ao histórico',
      });
    } catch (error) {
      logger.error('Erro ao simular login suspeito:, error);
    }
  };

  const clearLoginHistory = () => {
    localStorage.removeItem('equipe-s4u-login-history');
    setLoginHistory([]);
    toast({
      title: 'Histórico Limpo',
      description: 'Todo o histórico de logins foi removido',
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Aqui você pode salvar as configurações na API
      logger.debug('Salvando configurações:', settings);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao salvar configurações:, error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Aqui você pode implementar a mudança de senha na API
      logger.debug('Alterando senha...');
      
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso',
      });
      
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      logger.error('Erro ao alterar senha:, error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar senha',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

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
            <p className="text-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/logo-s4u.png" 
              alt="Equipe S4U Logo" 
              className="h-10 w-10 object-contain"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-foreground/70 text-lg">
              Gerencie suas preferências e configurações da aplicação
            </p>
          </div>
        </div>

        {/* Tabs de Configurações */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba: Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Informações do Perfil</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={user?.name || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={user?.phone || ''}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={user?.city || ''}
                      placeholder="Sua cidade"
                    />
                  </div>
                </div>

                <Separator />

                {/* Alteração de Senha */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Alterar Senha</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Notificações */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <span>Preferências de Notificação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Canais de Notificação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Canais de Notificação</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Notificações por Email</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações importantes por email
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Notificações Push</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificações em tempo real no navegador
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Notificações SMS</Label>
                        <p className="text-sm text-muted-foreground">
                          Alertas urgentes por mensagem de texto
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tipos de Notificação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Tipos de Notificação</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Lembretes de Eventos</Label>
                        <p className="text-sm text-muted-foreground">
                          Lembretes antes dos eventos
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.eventReminders}
                        onCheckedChange={(checked) => updateSetting('notifications', 'eventReminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Atualizações da Equipe</Label>
                        <p className="text-sm text-muted-foreground">
                          Mudanças na composição da equipe
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.teamUpdates}
                        onCheckedChange={(checked) => updateSetting('notifications', 'teamUpdates', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Notificações de Pagamento</Label>
                        <p className="text-sm text-muted-foreground">
                          Confirmações e atualizações de pagamento
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.paymentNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'paymentNotifications', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Aba: Segurança */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <span>Configurações de Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Autenticação de Dois Fatores</Label>
                      <p className="text-sm text-muted-foreground">
                        Adicionar uma camada extra de segurança
                      </p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tempo de Sessão (minutos)</Label>
                    <Select
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) => updateSetting('security', 'sessionTimeout', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="480">8 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Notificações de Login</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber alertas de novos logins
                      </p>
                    </div>
                    <Switch
                      checked={settings.security.loginNotifications}
                      onCheckedChange={(checked) => updateSetting('security', 'loginNotifications', checked)}
                    />
                  </div>

                                     <div className="flex items-center justify-between">
                     <div className="space-y-1">
                       <Label>Alteração Obrigatória de Senha</Label>
                       <p className="text-sm text-muted-foreground">
                         Forçar mudança de senha na próxima sessão
                       </p>
                     </div>
                     <Switch
                       checked={settings.security.passwordChangeRequired}
                       onCheckedChange={(checked) => updateSetting('security', 'passwordChangeRequired', checked)}
                     />
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Histórico de Logins */}
             <Card className="border-glow">
               <CardHeader>
                 <CardTitle className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <Lock className="w-5 h-5 text-primary" />
                     <span>Histórico de Logins</span>
                   </div>
                                       <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadLoginHistory}
                        disabled={loadingHistory}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {loadingHistory ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Atualizar
                      </Button>
                      
                      {/* Botões de Simulação para Teste */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={simulateFailedLogin}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        Simular Falha
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={simulateSuspiciousLogin}
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                      >
                        Simular Suspeito
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearLoginHistory}
                        className="border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
                      >
                        Limpar Histórico
                      </Button>
                    </div>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {loadingHistory ? (
                   <div className="flex items-center justify-center py-8">
                     <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
                     <span className="text-muted-foreground">Carregando histórico...</span>
                   </div>
                 ) : loginHistory.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                     <p>Nenhum login registrado</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between text-sm text-muted-foreground">
                       <span>Total de logins: {loginHistory.length}</span>
                       <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
                     </div>
                     
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                       {loginHistory.map((login) => (
                         <div
                           key={login.id}
                           className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                             login.status === 'success' 
                               ? 'border-green-200 bg-green-50/20' 
                               : login.status === 'failed'
                               ? 'border-red-200 bg-red-50/20'
                               : 'border-yellow-200 bg-yellow-50/20'
                           }`}
                         >
                           <div className="flex items-start justify-between">
                             <div className="flex-1 space-y-2">
                               <div className="flex items-center space-x-3">
                                 <Badge
                                   variant={
                                     login.status === 'success' ? 'default' :
                                     login.status === 'failed' ? 'destructive' :
                                     'secondary'
                                   }
                                   className={
                                     login.status === 'success' ? 'bg-green-500 hover:bg-green-600' :
                                     login.status === 'failed' ? 'bg-red-500 hover:bg-red-600' :
                                     'bg-yellow-500 hover:bg-yellow-600'
                                   }
                                 >
                                   {login.status === 'success' ? '✅ Sucesso' :
                                    login.status === 'failed' ? '❌ Falha' :
                                    '⚠️ Suspeito'}
                                 </Badge>
                                 <span className="text-sm font-medium text-foreground">
                                   {login.timestamp.toLocaleDateString('pt-BR')} às {login.timestamp.toLocaleTimeString('pt-BR')}
                                 </span>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                 <div className="space-y-1">
                                   <div className="flex items-center space-x-2">
                                     <span className="font-medium text-foreground">IP:</span>
                                     <span className="font-mono text-muted-foreground">{login.ipAddress}</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <span className="font-medium text-foreground">Localização:</span>
                                     <span className="text-muted-foreground">{login.location}</span>
                                   </div>
                                 </div>
                                 
                                 <div className="space-y-1">
                                   <div className="flex items-center space-x-2">
                                     <span className="font-medium text-foreground">Dispositivo:</span>
                                     <span className="text-muted-foreground">{login.device}</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <span className="font-medium text-foreground">Navegador:</span>
                                     <span className="text-muted-foreground">{login.browser}</span>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <span className="font-medium text-foreground">Sistema:</span>
                                     <span className="text-muted-foreground">{login.os}</span>
                                   </div>
                                 </div>
                               </div>
                               
                               {login.reason && (
                                 <div className="mt-2 p-2 bg-muted/50 rounded border-l-4 border-red-400">
                                   <span className="text-sm font-medium text-red-600">Motivo:</span>
                                   <span className="text-sm text-red-600 ml-2">{login.reason}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                     
                     <div className="pt-4 border-t border-border">
                       <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                         <div className="flex items-center space-x-2">
                           <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                           <span>Login bem-sucedido</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                           <span>Falha no login</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                           <span>Login suspeito</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <SettingsIcon className="w-4 h-4" />
            <span>Última atualização: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={loadUserSettings}
              disabled={loading}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
