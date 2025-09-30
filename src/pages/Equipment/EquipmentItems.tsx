import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, QrCode, Search, Filter } from 'lucide-react';
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
import { EquipmentItem, EquipmentCategory, Equipment } from '@/types';
import { getAllEquipmentItems, createEquipmentItem, updateEquipmentItem, deleteEquipmentItem } from '@/services/equipmentItemsService';
import { getAllEquipmentCategories } from '@/services/equipmentCategoriesService';
import { getAllEquipments } from '@/services/equipmentService';
import { QRCodeCanvas } from 'qrcode.react';

export default function EquipmentItems() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [qrItem, setQrItem] = useState<EquipmentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    equipmentId: '',
    assetTag: '',
    serialNumber: '',
    condition: 'good' as const,
    status: 'in_service' as const,
    location: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, categoriesData, equipmentsData] = await Promise.all([
        getAllEquipmentItems(),
        getAllEquipmentCategories(),
        getAllEquipments()
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
      setEquipments(equipmentsData);
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.categoryName === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreate = async () => {
    try {
      if (!formData.equipmentId || !formData.assetTag.trim()) {
        toast({
          title: 'Erro',
          description: 'Equipamento e etiqueta de patrimônio são obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      await createEquipmentItem(formData);
      toast({
        title: 'Sucesso',
        description: 'Item criado com sucesso',
      });
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar item',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!editingItem || !formData.assetTag.trim()) {
        toast({
          title: 'Erro',
          description: 'Etiqueta de patrimônio é obrigatória',
          variant: 'destructive',
        });
        return;
      }

      await updateEquipmentItem(editingItem.id, formData);
      toast({
        title: 'Sucesso',
        description: 'Item atualizado com sucesso',
      });
      setIsEditOpen(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (item: EquipmentItem) => {
    try {
      await deleteEquipmentItem(item.id);
      toast({
        title: 'Sucesso',
        description: 'Item deletado com sucesso',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar item',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (item: EquipmentItem) => {
    setEditingItem(item);
    setFormData({
      equipmentId: item.equipmentId,
      assetTag: item.assetTag,
      serialNumber: item.serialNumber || '',
      condition: item.condition,
      status: item.status,
      location: item.location || '',
      notes: item.notes || ''
    });
    setIsEditOpen(true);
  };

  const openQRDialog = (item: EquipmentItem) => {
    setQrItem(item);
    setIsQROpen(true);
  };

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      assetTag: '',
      serialNumber: '',
      condition: 'good',
      status: 'in_service',
      location: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      in_service: { label: 'Em Serviço', variant: 'default' as const },
      maintenance: { label: 'Manutenção', variant: 'secondary' as const },
      retired: { label: 'Aposentado', variant: 'outline' as const },
      lost: { label: 'Perdido', variant: 'destructive' as const }
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
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
          <p>Carregando itens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Itens de Equipamento</h1>
          <p className="text-muted-foreground">
            Gerencie os itens individuais com controle por patrimônio
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Item</DialogTitle>
              <DialogDescription>
                Crie um novo item de equipamento com etiqueta de patrimônio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment">Equipamento *</Label>
                  <Select
                    value={formData.equipmentId}
                    onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipments.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assetTag">Etiqueta de Patrimônio *</Label>
                  <Input
                    id="assetTag"
                    value={formData.assetTag}
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                    placeholder="Ex: EQU-0001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serialNumber">Número de Série</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Número de série do item"
                  />
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_service">Em Serviço</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="retired">Aposentado</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o item..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>
                Criar Item
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
                  placeholder="Buscar por etiqueta, série ou equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="in_service">Em Serviço</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="retired">Aposentado</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
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
        {filteredItems.map((item) => {
          const statusBadge = getStatusBadge(item.status);
          const conditionBadge = getConditionBadge(item.condition);
          
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">{item.assetTag}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.equipmentName}
                    </CardDescription>
                    {item.serialNumber && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Série: {item.serialNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openQRDialog(item)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(item)}
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
                            Tem certeza que deseja deletar o item "{item.assetTag}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item)}
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
                    <Badge variant={statusBadge.variant}>
                      {statusBadge.label}
                    </Badge>
                    <Badge variant={conditionBadge.variant}>
                      {conditionBadge.label}
                    </Badge>
                  </div>
                  {item.location && (
                    <p className="text-sm text-muted-foreground">
                      📍 {item.location}
                    </p>
                  )}
                  {item.categoryName && (
                    <p className="text-sm text-muted-foreground">
                      📦 {item.categoryName}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando um novo item de equipamento'
              }
            </p>
            {(!searchTerm && statusFilter === 'all' && categoryFilter === 'all') && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {qrItem?.assetTag}</DialogTitle>
            <DialogDescription>
              Escaneie este código para acessar informações do item
            </DialogDescription>
          </DialogHeader>
          {qrItem && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeCanvas value={qrItem.assetTag} size={200} level="M" />
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-bold">{qrItem.assetTag}</p>
                <p className="text-sm text-muted-foreground">{qrItem.equipmentName}</p>
              </div>
              <Button
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `qr-${qrItem.assetTag}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
              >
                Baixar QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-equipment">Equipamento *</Label>
                <Select
                  value={formData.equipmentId}
                  onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-assetTag">Etiqueta de Patrimônio *</Label>
                <Input
                  id="edit-assetTag"
                  value={formData.assetTag}
                  onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                  placeholder="Ex: EQU-0001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-serialNumber">Número de Série</Label>
                <Input
                  id="edit-serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Número de série do item"
                />
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
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_service">Em Serviço</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="retired">Aposentado</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o item..."
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

