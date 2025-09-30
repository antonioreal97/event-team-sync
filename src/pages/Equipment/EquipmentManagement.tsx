import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import EquipmentCatalog from './EquipmentCatalog';
import EquipmentItems from './EquipmentItems';
import EquipmentCategories from './EquipmentCategories';

export default function EquipmentManagement() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
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
                Gestão de Equipamentos
              </h1>
              <p className="text-foreground/70 text-lg">
                Cadastre tipos, gerencie itens com patrimônio e organize categorias
              </p>
            </div>
          </div>
        </div>

        <Card className="card-gradient border-glow">
          <CardHeader>
            <CardTitle className="text-foreground">Inventário</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="catalog" className="space-y-4">
              <TabsList>
                <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                <TabsTrigger value="items">Itens</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="space-y-4">
                <EquipmentCatalog />
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <EquipmentItems />
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <EquipmentCategories />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


