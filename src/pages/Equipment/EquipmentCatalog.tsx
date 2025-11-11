import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Equipment, EquipmentCategory } from '@/types';
import { getAllEquipments, createEquipment, updateEquipment, deleteEquipment } from '@/services/equipmentService';
import { getAllEquipmentCategories } from '@/services/equipmentCategoriesService';

export default function EquipmentCatalog() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState<{
    name: string;
    totalQuantity: number;
    description: string;
    categoryId: string;
    hourlyRate: number;
    dailyRate: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    location: string;
    lastMaintenance: string;
  }>({
    name: '',
    totalQuantity: 0,
    description: '',
    categoryId: '',
    hourlyRate: 0,
    dailyRate: 0,
    condition: 'good',
    location: '',
    lastMaintenance: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentsData, categoriesData] = await Promise.all([
        getAllEquipments(),
        getAllEquipmentCategories()
      ]);
      setEquipments(equipmentsData);
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                           equipment.categoryName === categoryFilter ||
                           equipment.categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreate = async () => {
    try {
      if (!formData.name.trim() || formData.totalQuantity <= 0) {
        toast({
          title: 'Erro',
          description: 'Nome e quantidade total são obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      await createEquipment(formData);
      toast({
        title: 'Sucesso',
        description: 'Equipamento criado com sucesso',
      });
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar equipamento',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!editingEquipment || !formData.name.trim() || formData.totalQuantity <= 0) {
        toast({
          title: 'Erro',
          description: 'Nome e quantidade total são obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      await updateEquipment(editingEquipment.id, formData);
      toast({
        title: 'Sucesso',
        description: 'Equipamento atualizado com sucesso',
      });
      setIsEditOpen(false);
      setEditingEquipment(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar equipamento',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (equipment: Equipment) => {
    try {
      await deleteEquipment(equipment.id);
      toast({
        title: 'Sucesso',
        description: 'Equipamento deletado com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar equipamento',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      totalQuantity: equipment.totalQuantity,
      description: equipment.description || '',
      categoryId: equipment.categoryId || '',
      hourlyRate: equipment.hourlyRate || 0,
      dailyRate: equipment.dailyRate || 0,
      condition: equipment.condition,
      location: equipment.location || '',
      lastMaintenance: equipment.lastMaintenance || ''
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      totalQuantity: 0,
      description: '',
      categoryId: '',
      hourlyRate: 0,
      dailyRate: 0,
      condition: 'good',
      location: '',
      lastMaintenance: ''
    });
    setEditingEquipment(null);
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      excellent: { label: 'Excelente', variant: 'default' as const },
      good: { label: 'Bom', variant: 'secondary' as const },
      fair: { label: 'Regular', variant: 'outline' as const },
      poor: { label: 'Ruim', variant: 'destructive' as const },
      damaged: { label: 'Danificado', variant: 'destructive' as const }
    };
    return conditionMap[condition as keyof typeof conditionMap] || { label: condition, variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos e modelos de equipamentos disponíveis
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Equipamento</DialogTitle>
              <DialogDescription>
                Crie um novo tipo de equipamento no catálogo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Câmera Sony FX6"
                  />
                </div>
                <div>
                  <Label htmlFor="totalQuantity">Quantidade Total *</Label>
                  <Input
                    id="totalQuantity"
                    type="number"
                    min="0"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do equipamento..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Taxa Horária (R$)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dailyRate">Taxa Diária (R$)</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Condição</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excelente</SelectItem>
                      <SelectItem value="good">Bom</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="poor">Ruim</SelectItem>
                      <SelectItem value="damaged">Danificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: QG - Estante A"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lastMaintenance">Última Manutenção</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>
                Criar Equipamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipments.map((equipment) => {
          const conditionBadge = getConditionBadge(equipment.condition);
          
          return (
            <Card key={equipment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{equipment.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {equipment.description}
                    </CardDescription>
                    {equipment.categoryName && (
                      <Badge variant="outline" className="mt-2">
                        {equipment.categoryName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(equipment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o equipamento "{equipment.name}"?
                            Esta ação não pode ser desfeita e pode afetar itens existentes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(equipment)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={conditionBadge.variant}>
                      {conditionBadge.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Qtd: {equipment.totalQuantity}
                    </span>
                  </div>
                  {equipment.location && (
                    <p className="text-sm text-muted-foreground">
                      📍 {equipment.location}
                    </p>
                  )}
                  {(equipment.hourlyRate || equipment.dailyRate) && (
                    <div className="text-sm text-muted-foreground">
                      {equipment.hourlyRate && (
                        <span>R$ {equipment.hourlyRate}/h</span>
                      )}
                      {equipment.hourlyRate && equipment.dailyRate && <span> • </span>}
                      {equipment.dailyRate && (
                        <span>R$ {equipment.dailyRate}/dia</span>
                      )}
                    </div>
                  )}
                  {equipment.lastMaintenance && (
                    <p className="text-sm text-muted-foreground">
                      🔧 Última manutenção: {new Date(equipment.lastMaintenance).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEquipments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum equipamento encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando um novo equipamento'
              }
            </p>
            {(!searchTerm && categoryFilter === 'all') && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Equipamento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do equipamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Câmera Sony FX6"
                />
              </div>
              <div>
                <Label htmlFor="edit-totalQuantity">Quantidade Total *</Label>
                <Input
                  id="edit-totalQuantity"
                  type="number"
                  min="0"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do equipamento..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-hourlyRate">Taxa Horária (R$)</Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-dailyRate">Taxa Diária (R$)</Label>
                <Input
                  id="edit-dailyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-condition">Condição</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: any) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excelente</SelectItem>
                    <SelectItem value="good">Bom</SelectItem>
                    <SelectItem value="fair">Regular</SelectItem>
                    <SelectItem value="poor">Ruim</SelectItem>
                    <SelectItem value="damaged">Danificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-location">Localização</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: QG - Estante A"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-lastMaintenance">Última Manutenção</Label>
              <Input
                id="edit-lastMaintenance"
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

