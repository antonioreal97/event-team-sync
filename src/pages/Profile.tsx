import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User, TeamType, ExperienceLevel, AudioVisualRole } from '@/types';
import { getTeamTypeLabel } from '@/lib/utils';
import { getApiBaseUrl, getStoredAuthToken } from '@/lib/api';
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
  FileText, 
  Globe, 
  Award, 
  Settings, 
  Save, 
  X,
  Plus,
  Trash2
} from 'lucide-react';

const Profile = () => {
  const { user, isFreelancer } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para campos de array
  const [newCertification, setNewCertification] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newRole, setNewRole] = useState('');

  // Estados para validação
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      setProfileData(user);
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeArrayItem = (field: string, index: number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addArrayItem = (field: string, value: string) => {
    if (value.trim()) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[] || []), value.trim()]
      }));
      
      // Limpar input
      switch (field) {
        case 'certifications':
          setNewCertification('');
          break;
        case 'equipment':
          setNewEquipment('');
          break;
        case 'languages':
          setNewLanguage('');
          break;
        case 'audioVisualRoles':
          setNewRole('');
          break;
      }
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!profileData.name || !profileData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!profileData.email || !profileData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    }

    if (profileData.phone && profileData.phone.trim()) {
      const phoneClean = profileData.phone.replace(/\D/g, '');
      if (phoneClean.length < 10 || phoneClean.length > 11) {
        newErrors.phone = 'Telefone deve ter 10 ou 11 dígitos';
      }
    }

    if (profileData.cpf && profileData.cpf.trim()) {
      const cpfClean = profileData.cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) {
        newErrors.cpf = 'CPF deve conter 11 dígitos';
      }
    }

    // Garantir que teamType não seja alterado pelo freelancer
    if (profileData.teamType !== user?.teamType) {
      newErrors.teamType = 'A equipe não pode ser alterada pelo freelancer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, corrija os erros antes de salvar',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Remover teamType dos dados a serem enviados, pois apenas o administrador pode alterá-lo
      const dataToSend = { ...profileData };
      delete dataToSend.teamType;

      const token = getStoredAuthToken();
      const response = await fetch(`${getApiBaseUrl()}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar perfil');
      }

      toast({
        title: 'Perfil Atualizado',
        description: 'Suas informações foram salvas com sucesso',
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao atualizar perfil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(user || {});
    setErrors({});
    setIsEditing(false);
  };

  if (!isFreelancer) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Esta página é exclusiva para freelancers.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={profileData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="(11) 99999-9999"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={profileData.cpf || ''}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      disabled={!isEditing}
                      placeholder="000.000.000-00"
                      className={errors.cpf ? 'border-red-500' : ''}
                    />
                    {errors.cpf && <p className="text-sm text-red-500 mt-1">{errors.cpf}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={profileData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={profileData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={profileData.state || ''}
                      onValueChange={(value) => handleInputChange('state', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Informações Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experienceLevel">Nível de Experiência</Label>
                    <Select
                      value={profileData.experienceLevel || ''}
                      onValueChange={(value) => handleInputChange('experienceLevel', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
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
                    <Label htmlFor="teamType">Equipe Atual</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-sm">
                          {profileData.teamType === 'iniciante' ? 'Iniciante' : 
                           profileData.teamType === 'intermediario' ? 'Intermediário' : 
                           profileData.teamType === 'avancado' ? 'Avançado' : 
                           profileData.teamType === 'sem_equipe' ? 'Sem Equipe' : 'Não definida'}
                        </Badge>
                      </div>
                      <p className="text-xs text-blue-700">
                        <strong>Importante:</strong> A gestão de equipes é responsabilidade exclusiva do administrador. 
                        Entre em contato com a administração se precisar de alterações em sua equipe.
                      </p>
                      {errors.teamType && (
                        <p className="text-xs text-red-600 mt-1">{errors.teamType}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="audioVisualRoles">Funções Audiovisuais</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Adicionar função"
                      disabled={!isEditing}
                      onKeyPress={(e) => e.key === 'Enter' && addArrayItem('audioVisualRoles', newRole)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('audioVisualRoles', newRole)}
                      disabled={!isEditing || !newRole.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.audioVisualRoles?.map((role, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {role}
                        {isEditing && (
                          <button
                            onClick={() => removeArrayItem('audioVisualRoles', index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Conte um pouco sobre você e sua experiência..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="previousExperience">Experiência Prévia</Label>
                  <Textarea
                    id="previousExperience"
                    value={profileData.previousExperience || ''}
                    onChange={(e) => handleInputChange('previousExperience', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Descreva suas experiências anteriores..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Links e Portfólio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Links e Portfólio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="portfolio">Portfólio</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    value={profileData.portfolio || ''}
                    onChange={(e) => handleInputChange('portfolio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://seu-portfolio.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={profileData.linkedin || ''}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/seu-perfil"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={profileData.instagram || ''}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      disabled={!isEditing}
                      placeholder="@seu_usuario"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profileData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://seu-site.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Certificações e Equipamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Certificações e Equipamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="certifications">Certificações</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Adicionar certificação"
                      disabled={!isEditing}
                      onKeyPress={(e) => e.key === 'Enter' && addArrayItem('certifications', newCertification)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('certifications', newCertification)}
                      disabled={!isEditing || !newCertification.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.certifications?.map((cert, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {cert}
                        {isEditing && (
                          <button
                            onClick={() => removeArrayItem('certifications', index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="equipment">Equipamentos</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                      placeholder="Adicionar equipamento"
                      disabled={!isEditing}
                      onKeyPress={(e) => e.key === 'Enter' && addArrayItem('equipment', newEquipment)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('equipment', newEquipment)}
                      disabled={!isEditing || !newEquipment.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.equipment?.map((equip, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {equip}
                        {isEditing && (
                          <button
                            onClick={() => removeArrayItem('equipment', index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="languages">Idiomas</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="Adicionar idioma"
                      disabled={!isEditing}
                      onKeyPress={(e) => e.key === 'Enter' && addArrayItem('languages', newLanguage)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('languages', newLanguage)}
                      disabled={!isEditing || !newLanguage.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages?.map((lang, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {lang}
                        {isEditing && (
                          <button
                            onClick={() => removeArrayItem('languages', index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Resumo e Estatísticas */}
          <div className="space-y-6">
            {/* Resumo do Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-lg">
                      {profileData.name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{profileData.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{profileData.role}</p>
                  {profileData.teamType && (
                    <Badge variant="secondary" className="mt-2">
                      {getTeamTypeLabel(profileData.teamType)}
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Experiência:</span>
                    <span className="text-sm font-medium capitalize">
                      {profileData.experienceLevel || 'Não definido'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Eventos:</span>
                    <span className="text-sm font-medium">
                      {profileData.totalEventsAttended || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ganhos Totais:</span>
                    <span className="text-sm font-medium">
                      R$ {typeof profileData.totalEarnings === 'number' ? profileData.totalEarnings.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  
                  {profileData.averageRating && typeof profileData.averageRating === 'number' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avaliação:</span>
                      <span className="text-sm font-medium">
                        ⭐ {profileData.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <Card>
              <CardContent className="pt-6">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      onClick={handleSave} 
                      className="w-full"
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
