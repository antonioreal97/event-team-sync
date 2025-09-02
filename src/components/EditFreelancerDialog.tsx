import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Clock, Trash2, Save, X, Key, AlertTriangle } from 'lucide-react';
import { User as UserType } from '@/types';

interface EditFreelancerDialogProps {
  freelancer: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFreelancer: Partial<UserType>) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
  onResetPassword: (userId: string) => Promise<void>;
}

const EditFreelancerDialog: React.FC<EditFreelancerDialogProps> = ({
  freelancer,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onResetPassword
}) => {
  const [formData, setFormData] = useState<Partial<UserType>>({});
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState(false);

  useEffect(() => {
    if (freelancer) {
      setFormData({
        teamType: freelancer.teamType || 'sem_equipe',
        isActive: freelancer.isActive ?? true
      });
    }
  }, [freelancer]);

  const handleInputChange = (field: keyof UserType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!freelancer) return;
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar freelancer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!freelancer) return;
    
    setLoading(true);
    try {
      await onDelete(freelancer.id);
      onClose();
    } catch (error) {
      console.error('Erro ao deletar freelancer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!freelancer) return;
    
    setLoading(true);
    try {
      await onResetPassword(freelancer.id);
      setResetPasswordConfirm(false);
      // Não fechar o dialog após reset de senha
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!freelancer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Gerenciar Acesso - {freelancer.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações de Identificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">
              Identificação do Usuário
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {freelancer.name}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {freelancer.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <Badge variant="secondary">{freelancer.role}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Data de Cadastro</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {freelancer.createdAt ? new Date(freelancer.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Controle de Acesso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">
              Controle de Acesso
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamType">Equipe *</Label>
                <Select
                  value={formData.teamType || ''}
                  onValueChange={(value) => handleInputChange('teamType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipe_a">Equipe A - Prioridade Máxima</SelectItem>
                    <SelectItem value="equipe_b">Equipe B - Suporte</SelectItem>
                    <SelectItem value="sem_equipe">Sem Equipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="isActive">Status da Conta</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => handleInputChange('isActive', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Redefinição de Senha */}
            <div className="space-y-2">
              <Label>Redefinição de Senha</Label>
              {!resetPasswordConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setResetPasswordConfirm(true)}
                  disabled={loading}
                  className="w-full"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Redefinir Senha do Usuário
                </Button>
              ) : (
                <div className="space-y-3 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Confirmar Redefinição de Senha</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Uma nova senha será gerada e enviada para o email do usuário. 
                    O usuário precisará alterar a senha no próximo login.
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetPasswordConfirm(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={loading}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {loading ? 'Processando...' : 'Confirmar Redefinição'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas de Uso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">
              Estatísticas de Uso
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {freelancer.totalEventsAttended || 0}
                </div>
                <div className="text-sm text-muted-foreground">Eventos Atendidos</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  ⭐ {freelancer.averageRating?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Avaliação Média</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  <Clock className="w-5 h-5 mx-auto" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {freelancer.updatedAt ? new Date(freelancer.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Aviso sobre Dados de Cadastro */}
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">Dados de Cadastro</span>
            </div>
            <p className="text-sm text-blue-700">
              As informações pessoais, profissionais e de contato são gerenciadas pelo próprio usuário 
              na aba "Meu Perfil". Esta seção é destinada apenas ao controle administrativo de acesso.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {!deleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirm(true)}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Usuário</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Confirmar Exclusão</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFreelancerDialog;
