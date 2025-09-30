import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EquipmentCategory } from '@/types';
import { getAllEquipmentCategories, createEquipmentCategory, updateEquipmentCategory, deleteEquipmentCategory } from '@/services/equipmentCategoriesService';

export default function EquipmentCategories() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllEquipmentCategories();
      setCategories(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Erro',
          description: 'Nome da categoria é obrigatório',
          variant: 'destructive',
        });
        return;
      }

      await createEquipmentCategory(formData);
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      });
      setIsCreateOpen(false);
      setFormData({ name: '', description: '' });
      loadCategories();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar categoria',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!editingCategory || !formData.name.trim()) {
        toast({
          title: 'Erro',
          description: 'Nome da categoria é obrigatório',
          variant: 'destructive',
        });
        return;
      }

      await updateEquipmentCategory(editingCategory.id, formData);
      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso',
      });
      setIsEditOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      loadCategories();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar categoria',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (category: EquipmentCategory) => {
    try {
      await deleteEquipmentCategory(category.id);
      toast({
        title: 'Sucesso',
        description: 'Categoria deletada com sucesso',
      });
      loadCategories();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar categoria',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (category: EquipmentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias de Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos equipamentos do sistema
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma nova categoria para organizar os equipamentos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Câmeras de Gravação"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da categoria..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>
                Criar Categoria
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(category)}
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
                          Tem certeza que deseja deletar a categoria "{category.name}"?
                          Esta ação não pode ser desfeita e pode afetar equipamentos existentes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category)}
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Criada em {new Date(category.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando uma nova categoria para organizar seus equipamentos
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Câmeras de Gravação"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria..."
                rows={3}
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

