import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User, TeamType, TeamAssignment } from '@/types';
import { getAllUsers, createFreelancer, updateUser, deleteUser } from '@/services/userService';
import { 
  getAllTeamAssignments, 
  getUsersByTeam,
  assignUserToTeam,
  removeUserFromTeam,
  getActiveFreelancersByTeam
} from '@/services/teamService';
import { Users, Star, Award, UserPlus, UserMinus, Eye, EyeOff, Plus, Edit, Trash2, Shield } from 'lucide-react';
import EditFreelancerDialog from '@/components/EditFreelancerDialog';

const TeamManagement = () => {
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);
  const [teamAUsers, setTeamAUsers] = useState<User[]>([]);
  const [teamBUsers, setTeamBUsers] = useState<User[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('iniciante');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  
  // Estados para cadastrar freelancer
  const [showCreateFreelancerDialog, setShowCreateFreelancerDialog] = useState(false);
  const [newFreelancer, setNewFreelancer] = useState({
    name: '',
    email: '',
    password: '',
    teamType: 'iniciante' as TeamType,
    phone: '',
    address: '',
    city: '',
    state: '',
    cpf: '',
    experienceLevel: 'iniciante' as any,
    audioVisualRoles: [] as any[],
    bio: '',
    portfolio: '',
    linkedin: '',
    instagram: '',
    website: '',
    previousExperience: '',
    certifications: [] as string[],
    equipment: [] as string[],
    languages: [] as string[],
  });

  // Estados para validação em tempo real
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Estados para edição de freelancer
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFreelancer, setEditingFreelancer] = useState<User | null>(null);

  useEffect(() => {
    if (isGestor) {
      fetchData();
    }
  }, [isGestor]);

  // Validar formulário quando abrir o dialog
  useEffect(() => {
    if (showCreateFreelancerDialog) {
      // Limpar erros anteriores
      setFieldErrors({});
      setIsFormValid(false);
    } else {
      // Limpar formulário e erros quando fechar
      setNewFreelancer({
        name: '',
        email: '',
        password: '',
        teamType: 'iniciante',
        phone: '',
        address: '',
        city: '',
        state: '',
        cpf: '',
        experienceLevel: 'iniciante',
        audioVisualRoles: [],
        bio: '',
        portfolio: '',
        linkedin: '',
        instagram: '',
        website: '',
        previousExperience: '',
        certifications: [],
        equipment: [],
        languages: [],
      });
      setFieldErrors({});
      setIsFormValid(false);
    }
  }, [showCreateFreelancerDialog]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        usersData, 
        assignmentsData, 
        stats
      ] = await Promise.all([
        getAllUsers(),
        getAllTeamAssignments(),
        getActiveFreelancersByTeam()
      ]);

      // Buscar usuários por equipe
      const iniciante = await getUsersByTeam('iniciante');
      const intermediario = await getUsersByTeam('intermediario');
      const avancado = await getUsersByTeam('avancado');
      const unassigned = await getUsersByTeam('sem_equipe');

      setUsers(usersData);
      setTeamAssignments(assignmentsData);
      setTeamAUsers(iniciante);
      setTeamBUsers(intermediario);
      setUnassignedUsers(unassigned);
      setTeamStats(stats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados das equipes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUser || !selectedTeam) return;

    try {
      await assignUserToTeam(
        selectedUser.id, 
        selectedTeam, 
        assignmentNotes
      );

      toast({
        title: 'Usuário atribuído',
        description: `${selectedUser.name} foi atribuído ao nível ${getTeamLabel(selectedTeam)}`,
      });

      setShowAssignDialog(false);
      setSelectedUser(null);
      setSelectedTeam('iniciante');
      setAssignmentNotes('');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to assign user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atribuir usuário à equipe',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    try {
      await removeUserFromTeam(userId);
      
      toast({
        title: 'Usuário removido',
        description: `${userName} foi removido da equipe`,
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover usuário da equipe',
        variant: 'destructive',
      });
    }
  };

  // Função para validar campo individual
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          return 'Nome é obrigatório';
        }
        if (value.trim().length < 2) {
          return 'Nome deve ter pelo menos 2 caracteres';
        }
        if (value.trim().length > 255) {
          return 'Nome deve ter no máximo 255 caracteres';
        }
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) {
          return 'Nome deve conter apenas letras e espaços';
        }
        break;

      case 'email':
        if (!value || !value.trim()) {
          return 'Email é obrigatório';
        }
        if (value.trim().length > 255) {
          return 'Email deve ter no máximo 255 caracteres';
        }
        if (value.includes(' ')) {
          return 'Email não pode conter espaços';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Formato de email inválido';
        }
        break;

      case 'password':
        if (!value) {
          return 'Senha é obrigatória';
        }
        if (value.length < 6) {
          return 'Senha deve ter pelo menos 6 caracteres';
        }
        if (value.length > 100) {
          return 'Senha deve ter no máximo 100 caracteres';
        }
        if (value.includes(' ')) {
          return 'Senha não pode conter espaços';
        }
        if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
          return 'Senha deve conter pelo menos uma letra e um número';
        }
        break;

      case 'teamType':
        if (!value) {
          return 'Tipo de equipe é obrigatório';
        }
        if (!['iniciante', 'intermediario', 'avancado'].includes(value)) {
          return 'Nível de experiência deve ser "Iniciante", "Intermediário" ou "Avançado"';
        }
        break;

      case 'cpf':
        if (value && value.trim()) {
          const cpfClean = value.replace(/\D/g, '');
          if (cpfClean.length !== 11) {
            return 'CPF deve conter 11 dígitos';
          }
          if (/^(\d)\1{10}$/.test(cpfClean)) {
            return 'CPF inválido';
          }
        }
        break;

      case 'phone':
        if (value && value.trim()) {
          const phoneClean = value.replace(/\D/g, '');
          if (phoneClean.length < 10 || phoneClean.length > 11) {
            return 'Telefone deve ter 10 ou 11 dígitos';
          }
        }
        break;

      default:
        return '';
    }
    return '';
  };

  // Função de validação dos campos obrigatórios
  const validateRequiredFields = () => {
    const errors: string[] = [];

    // Validar nome
    const nameError = validateField('name', newFreelancer.name);
    if (nameError) errors.push(nameError);

    // Validar email
    const emailError = validateField('email', newFreelancer.email);
    if (emailError) errors.push(emailError);

    // Validar senha
    const passwordError = validateField('password', newFreelancer.password);
    if (passwordError) errors.push(passwordError);

    // Validar tipo de equipe
    const teamTypeError = validateField('teamType', newFreelancer.teamType);
    if (teamTypeError) errors.push(teamTypeError);

    return errors;
  };

  const handleCreateFreelancer = async () => {
    // Validar campos obrigatórios
    const validationErrors = validateRequiredFields();
    
    if (validationErrors.length > 0) {
      toast({
        title: 'Erro de Validação',
        description: validationErrors.join('\n'),
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    try {
      await createFreelancer(newFreelancer);
      
      toast({
        title: 'Freelancer cadastrado',
        description: `${newFreelancer.name} foi cadastrado com sucesso`,
      });

      // Reset form and close dialog
      setNewFreelancer({
        name: '',
        email: '',
        password: '',
        teamType: 'iniciante',
        phone: '',
        address: '',
        city: '',
        state: '',
        cpf: '',
        experienceLevel: 'iniciante',
        audioVisualRoles: [],
        bio: '',
        portfolio: '',
        linkedin: '',
        instagram: '',
        website: '',
        previousExperience: '',
        certifications: [],
        equipment: [],
        languages: [],
      });
      setShowCreateFreelancerDialog(false);

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Failed to create freelancer:', error);
      
      // Tratar erros específicos do servidor
      let errorMessage = 'Falha ao cadastrar freelancer';
      
      if (error.message) {
        if (error.message.includes('Email já cadastrado')) {
          errorMessage = 'Este email já está cadastrado no sistema';
        } else if (error.message.includes('CPF já cadastrado')) {
          errorMessage = 'Este CPF já está cadastrado no sistema';
        } else if (error.message.includes('Nome deve ter pelo menos 2 caracteres')) {
          errorMessage = 'Nome deve ter pelo menos 2 caracteres';
        } else if (error.message.includes('Formato de email inválido')) {
          errorMessage = 'Formato de email inválido';
        } else if (error.message.includes('Senha deve ter pelo menos 6 caracteres')) {
          errorMessage = 'Senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('Tipo de equipe inválido')) {
          errorMessage = 'Tipo de equipe inválido';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setNewFreelancer(prev => ({ ...prev, [field]: value }));
    
    // Validar campo em tempo real
    const error = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    // Verificar se o formulário está válido
    const allErrors = ['name', 'email', 'password', 'teamType'].map(f => 
      validateField(f, f === field ? value : newFreelancer[f as keyof typeof newFreelancer])
    );
    
    setIsFormValid(allErrors.every(error => !error));
  };

  const handleEditFreelancer = async (updatedData: Partial<User>) => {
    if (!editingFreelancer) return;
    
    setLoading(true);
    try {
      await updateUser(editingFreelancer.id, updatedData);
      
      toast({
        title: "Sucesso!",
        description: "Freelancer atualizado com sucesso!",
      });
      setShowEditDialog(false);
      setEditingFreelancer(null);
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao atualizar freelancer:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar freelancer. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFreelancer = async (userId: string) => {
    setLoading(true);
    try {
      await deleteUser(userId);
      
      toast({
        title: "Sucesso!",
        description: "Freelancer desativado com sucesso!",
      });
      setShowEditDialog(false);
      setEditingFreelancer(null);
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao deletar freelancer:', error);
      toast({
        title: "Erro",
        description: "Erro ao desativar freelancer. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (freelancer: User) => {
    setEditingFreelancer(freelancer);
    setShowEditDialog(true);
  };

  const handleResetPassword = async (userId: string) => {
    setLoading(true);
    try {
      // Aqui você implementaria a chamada para resetar a senha
      // await resetUserPassword(userId);
      
      toast({
        title: "Sucesso!",
        description: "Senha redefinida com sucesso! Uma nova senha foi enviada para o email do usuário.",
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInputChange = (field: string, value: string) => {
    if (value.trim()) {
      setNewFreelancer(prev => ({
        ...prev,
        [field]: [...prev[field as keyof typeof prev] as string[], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: string, index: number) => {
    setNewFreelancer(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const getTeamColor = (teamType: TeamType) => {
    switch (teamType) {
      case 'iniciante':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'intermediario':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'avancado':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTeamLabel = (teamType: TeamType) => {
    switch (teamType) {
      case 'iniciante':
        return 'Iniciante';
      case 'intermediario':
        return 'Intermediário';
      case 'avancado':
        return 'Avançado';
      default:
        return 'Sem Equipe';
    }
  };

  const getExperienceColor = (level: string) => {
    const colors: Record<string, string> = {
      'iniciante': 'bg-green-100 text-green-800',
      'intermediario': 'bg-yellow-100 text-yellow-800',
      'avancado': 'bg-orange-100 text-orange-800',
      'expert': 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p>Carregando dados das equipes...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Gestão de Equipes</h1>
            <p className="text-gray-600">Gerencie os níveis de experiência para priorização de eventos</p>
          </div>
          <Button onClick={() => setShowCreateFreelancerDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Freelancer
          </Button>
        </div>

        {/* Team Statistics */}
        {teamStats && teamStats.iniciante !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Iniciante</CardTitle>
                <Award className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{teamStats.iniciante.active}</div>
                <p className="text-xs text-muted-foreground">
                  {teamStats.iniciante.active} ativos • ⭐ 0.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Intermediário</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{teamStats.intermediario.active}</div>
                <p className="text-xs text-muted-foreground">
                  {teamStats.intermediario.active} ativos • ⭐ 0.0
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sem Equipe</CardTitle>
                <UserPlus className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{teamStats.sem_equipe.active}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando atribuição
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="teams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teams">Equipes</TabsTrigger>
            <TabsTrigger value="unassigned">Sem Equipe</TabsTrigger>
            <TabsTrigger value="assignments">Atribuições</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Iniciante */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span>Iniciante</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Freelancers iniciantes (mesmo valor de diária do Intermediário)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamAUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">{user.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className={getExperienceColor(user.experienceLevel)}>
                                {user.experienceLevel}
                              </Badge>
                              {user.averageRating && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                                  {user.averageRating}
                                </div>
                              )}
                            </div>
                            {user.dailyRate && (
                              <div className="text-xs text-gray-600 mt-1">
                                R$ {user.dailyRate}/dia
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Gerenciar Acesso"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user.id, user.name)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {teamAUsers.length === 0 && (
                      <p className="text-center py-4 text-gray-500">
                        Nenhum freelancer no nível Iniciante
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Intermediário */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Intermediário</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Freelancers intermediários (mesmo valor de diária do Iniciante)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamBUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">{user.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className={getExperienceColor(user.experienceLevel)}>
                                {user.experienceLevel}
                              </Badge>
                              {user.averageRating && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                                  {user.averageRating}
                                </div>
                              )}
                            </div>
                            {user.dailyRate && (
                              <div className="text-xs text-gray-600 mt-1">
                                R$ {user.dailyRate}/dia
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Gerenciar Acesso"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user.id, user.name)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {teamBUsers.length === 0 && (
                      <p className="text-center py-4 text-gray-500">
                        Nenhum freelancer no nível Intermediário
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="unassigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-gray-600" />
                  <span>Freelancers Sem Equipe</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Atribua freelancers às equipes para organizar prioridades
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unassignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-sm">{user.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className={getExperienceColor(user.experienceLevel)}>
                              {user.experienceLevel}
                            </Badge>
                            {user.averageRating && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                                {user.averageRating}
                              </div>
                            )}
                          </div>
                          {user.dailyRate && (
                            <div className="text-xs text-gray-600 mt-1">
                              R$ {user.dailyRate}/dia
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Gerenciar Acesso"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowAssignDialog(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Atribuir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {unassignedUsers.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      Todos os freelancers estão atribuídos a equipes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atribuições</CardTitle>
                <p className="text-sm text-gray-600">
                  Visualize a trilha de auditoria das mudanças de equipe
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamAssignments.map((assignment) => {
                    const user = users.find(u => u.id === assignment.userId);
                    if (!user) return null;

                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">{assignment.userName || user.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {assignment.fromTeamType && (
                                <Badge variant="outline" className="text-xs">
                                  {getTeamLabel(assignment.fromTeamType)}
                                </Badge>
                              )}
                              <Badge className={getTeamColor(assignment.toTeamType)}>
                                {getTeamLabel(assignment.toTeamType)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Alterado em {new Date(assignment.changedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {assignment.changedByName && (
                              <p className="text-xs text-gray-500 mt-1">
                                Alterado por {assignment.changedByName}
                              </p>
                            )}
                            {assignment.notes && (
                              <p className="text-xs text-gray-600 mt-1">{assignment.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {teamAssignments.length === 0 && (
                    <p className="text-center py-4 text-gray-500">
                      Nenhuma atribuição de equipe encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign User Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir Usuário à Equipe</DialogTitle>
              <DialogDescription>
                Escolha a equipe para {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team">Equipe</Label>
                <Select value={selectedTeam} onValueChange={(value) => setSelectedTeam(value as TeamType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Motivo da atribuição, especialidades, etc."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssignUser}>
                Atribuir à Equipe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Freelancer Dialog */}
        <Dialog open={showCreateFreelancerDialog} onOpenChange={setShowCreateFreelancerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Freelancer</DialogTitle>
              <DialogDescription>
                Preencha os dados do freelancer para cadastrá-lo na plataforma
              </DialogDescription>
              {/* Indicador de progresso dos campos obrigatórios */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>Campos obrigatórios:</span>
                  <span className={`font-medium ${isFormValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isFormValid ? '✓ Todos preenchidos' : '⚠ Preencha todos os campos'}
                  </span>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={newFreelancer.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo"
                    className={fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFreelancer.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className={fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newFreelancer.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Senha"
                    className={fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {fieldErrors.password && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newFreelancer.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className={fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={newFreelancer.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className={fieldErrors.cpf ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {fieldErrors.cpf && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.cpf}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="experienceLevel">Nível de Experiência</Label>
                  <Select value={newFreelancer.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teamType">Equipe *</Label>
                  <Select value={newFreelancer.teamType} onValueChange={(value) => handleInputChange('teamType', value)}>
                    <SelectTrigger className={fieldErrors.teamType ? 'border-red-500 focus:border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.teamType && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.teamType}</p>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={newFreelancer.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={newFreelancer.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={newFreelancer.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Especialidades */}
              <div>
                <Label htmlFor="audioVisualRoles">Especialidades Audiovisuais</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {['camera', 'audio', 'lighting', 'streaming', 'editing', 'production', 'direction', 'script'].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={role}
                        checked={newFreelancer.audioVisualRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('audioVisualRoles', [...newFreelancer.audioVisualRoles, role]);
                          } else {
                            handleInputChange('audioVisualRoles', newFreelancer.audioVisualRoles.filter(r => r !== role));
                          }
                        }}
                      />
                      <Label htmlFor={role} className="text-sm capitalize">{role}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio e Portfolio */}
              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={newFreelancer.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência e especialidades..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="portfolio">Portfolio</Label>
                  <Input
                    id="portfolio"
                    value={newFreelancer.portfolio}
                    onChange={(e) => handleInputChange('portfolio', e.target.value)}
                    placeholder="https://portfolio.com"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newFreelancer.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://meusite.com"
                  />
                </div>
              </div>

              {/* Redes Sociais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={newFreelancer.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={newFreelancer.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
              </div>

              {/* Experiência Anterior */}
              <div>
                <Label htmlFor="previousExperience">Experiência Anterior</Label>
                <Textarea
                  id="previousExperience"
                  value={newFreelancer.previousExperience}
                  onChange={(e) => handleInputChange('previousExperience', e.target.value)}
                  placeholder="Descreva suas experiências profissionais anteriores..."
                  rows={3}
                />
              </div>

              {/* Certificações */}
              <div>
                <Label htmlFor="certifications">Certificações</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Adicionar certificação"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        handleArrayInputChange('certifications', target.value);
                        target.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newFreelancer.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeArrayItem('certifications', index)}>
                      {cert} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Equipamentos */}
              <div>
                <Label htmlFor="equipment">Equipamentos</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Adicionar equipamento"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        handleArrayInputChange('equipment', target.value);
                        target.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newFreelancer.equipment.map((item, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeArrayItem('equipment', index)}>
                      {item} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Idiomas */}
              <div>
                <Label htmlFor="languages">Idiomas</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Adicionar idioma"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        handleArrayInputChange('languages', target.value);
                        target.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newFreelancer.languages.map((lang, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeArrayItem('languages', index)}>
                      {lang} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateFreelancerDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateFreelancer}
                disabled={!isFormValid}
                className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {!isFormValid ? 'Preencha os campos obrigatórios' : 'Cadastrar Freelancer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de Freelancer */}
        <EditFreelancerDialog
          freelancer={editingFreelancer}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingFreelancer(null);
          }}
          onSave={handleEditFreelancer}
          onDelete={handleDeleteFreelancer}
          onResetPassword={handleResetPassword}
        />
      </div>
    </AppLayout>
  );
};

export default TeamManagement;
