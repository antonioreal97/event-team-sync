import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentRecord, TeamAllocation, Event, User } from '@/types';
import { getAllEvents } from '@/services/eventService';
import { getAllUsers } from '@/services/userService';
import { getAllPaymentRecords, approvePayment, markPaymentAsPaid, cancelPayment, generateEventPaymentReport, generateFinancialSummary, createPaymentRecord } from '@/services/paymentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Calendar, Users, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, AlertCircle, FileText, Download, Plus, Upload } from 'lucide-react';

const PaymentManagement = () => {
  const { user, isGestor } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  
  // Estados para cadastrar pagamento
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [newPayment, setNewPayment] = useState({
    userId: '',
    eventId: '',
    allocationId: '',
    amount: 0,
    notes: '',
    receiptFile: null as File | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsData, usersData, paymentsData] = await Promise.all([
          getAllEvents(),
          getAllUsers(),
          getAllPaymentRecords()
        ]);
        setEvents(eventsData);
        setUsers(usersData);
        setPayments(paymentsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchFinancialSummary();
    }
  }, [startDate, endDate]);

  const fetchFinancialSummary = async () => {
    try {
      const summary = await generateFinancialSummary(new Date(startDate), new Date(endDate));
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await approvePayment(paymentId);
      toast({
        title: 'Pagamento aprovado',
        description: 'O pagamento foi aprovado com sucesso',
      });
      // Refresh payments
      const updatedPayments = await getAllPaymentRecords();
      setPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao aprovar pagamento',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    if (!paymentMethod.trim()) {
      toast({
        title: 'Erro',
        description: 'Selecione um método de pagamento',
        variant: 'destructive',
      });
      return;
    }

    try {
      await markPaymentAsPaid(paymentId, paymentMethod);
      toast({
        title: 'Pagamento marcado como pago',
        description: 'O pagamento foi registrado como pago',
      });
      setShowPaymentDialog(false);
      setSelectedPayment(null);
      setPaymentMethod('');
      // Refresh payments
      const updatedPayments = await getAllPaymentRecords();
      setPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to mark payment as paid:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao marcar pagamento como pago',
        variant: 'destructive',
      });
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    try {
      await cancelPayment(paymentId);
      toast({
        title: 'Pagamento cancelado',
        description: 'O pagamento foi cancelado com sucesso',
      });
      // Refresh payments
      const updatedPayments = await getAllPaymentRecords();
      setPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar pagamento',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.userId || !newPayment.eventId || !newPayment.amount || !newPayment.receiptFile) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios e faça o upload do comprovante',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Aqui você implementaria o upload do arquivo para o servidor
      // Por enquanto, vamos simular o processo
      const formData = new FormData();
      formData.append('receipt', newPayment.receiptFile);
      
      // Simular upload do arquivo
      const receiptFileName = `receipt_${Date.now()}_${newPayment.receiptFile.name}`;
      
      const paymentData = {
        userId: newPayment.userId,
        eventId: newPayment.eventId,
        allocationId: newPayment.allocationId,
        amount: newPayment.amount,
        notes: newPayment.notes,
        receiptFile: receiptFileName,
        status: 'pending' as const,
      };

      await createPaymentRecord(paymentData);
      
      toast({
        title: 'Pagamento cadastrado',
        description: 'O pagamento foi cadastrado com sucesso',
      });

      // Reset form and close dialog
      setNewPayment({
        userId: '',
        eventId: '',
        allocationId: '',
        amount: 0,
        notes: '',
        receiptFile: null,
      });
      setShowCreatePaymentDialog(false);

      // Refresh payments
      const updatedPayments = await getAllPaymentRecords();
      setPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to create payment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar pagamento',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setNewPayment(prev => ({ ...prev, receiptFile: file }));
    } else {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo PDF válido',
        variant: 'destructive',
      });
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle,
      paid: CheckCircle,
      cancelled: XCircle,
    };
    return icons[status] || Clock;
  };

  const filteredPayments = payments.filter(payment => {
    if (selectedEvent && selectedEvent.id !== 'all' && payment.eventId !== selectedEvent.id) return false;
    if (selectedUser && selectedUser.id !== 'all' && payment.userId !== selectedUser.id) return false;
    return true;
  });

  const totalPendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidAmount = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (!isGestor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Acesso restrito a gestores</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Gestão de Pagamentos</h1>
            <p className="text-gray-600">Gerencie pagamentos e relatórios financeiros</p>
          </div>
          <Button onClick={() => setShowCreatePaymentDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Pagamento
          </Button>
        </div>

        {/* Financial Summary Cards */}
        {financialSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {financialSummary?.totalRevenue?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialSummary?.totalEvents || 0} eventos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {financialSummary?.totalExpenses?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialSummary?.totalCollaborators || 0} colaboradores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(financialSummary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {(financialSummary?.netProfit || 0).toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Custo médio: R$ {(financialSummary?.averageEventCost || 0).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  R$ {totalPendingAmount.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredPayments.filter(p => p.status === 'pending').length} pagamentos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event">Evento</Label>
                <Select onValueChange={(value) => {
                  const event = events.find(e => e.id === value);
                  setSelectedEvent(event || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user">Colaborador</Label>
                <Select onValueChange={(value) => {
                  const user = users.find(u => u.id === value);
                  setSelectedUser(user || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os colaboradores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os colaboradores</SelectItem>
                    {users.filter(u => u.role === 'freelancer').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPayments.map((payment) => {
                    const event = events.find(e => e.id === payment.eventId);
                    const user = users.find(u => u.id === payment.userId);
                    const StatusIcon = getPaymentStatusIcon(payment.status);

                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{user?.name}</h4>
                            <p className="text-sm text-gray-500">{event?.title}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium text-lg">
                              R$ {payment.amount.toLocaleString('pt-BR')}
                            </div>
                            <Badge className={getPaymentStatusColor(payment.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {payment.status === 'pending' && 'Pendente'}
                              {payment.status === 'approved' && 'Aprovado'}
                              {payment.status === 'paid' && 'Pago'}
                              {payment.status === 'cancelled' && 'Cancelado'}
                            </Badge>
                          </div>

                          <div className="flex space-x-2">
                            {payment.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprovePayment(payment.id)}
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelPayment(payment.id)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {payment.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowPaymentDialog(true);
                                }}
                              >
                                Marcar como Pago
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredPayments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Nenhum pagamento encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Financeiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resumo por Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Período:</span>
                          <span className="font-medium">
                            {format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR })} - 
                            {format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de Eventos:</span>
                          <span className="font-medium">{financialSummary?.totalEvents || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de Colaboradores:</span>
                          <span className="font-medium">{financialSummary?.totalCollaborators || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Categorias de Despesa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {financialSummary?.topExpenseCategories?.map((category, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="capitalize">{category.category}:</span>
                            <span className="font-medium">
                              R$ {category.amount?.toLocaleString('pt-BR') || '0'}
                            </span>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-sm">Nenhuma categoria de despesa encontrada</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Relatório CSV
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Relatório PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Method Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Método de Pagamento</DialogTitle>
              <DialogDescription>
                Selecione o método de pagamento utilizado para {selectedPayment?.amount && `R$ ${selectedPayment.amount.toLocaleString('pt-BR')}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <Select onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito/Débito</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => selectedPayment && handleMarkAsPaid(selectedPayment.id)}>
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Payment Dialog */}
        <Dialog open={showCreatePaymentDialog} onOpenChange={setShowCreatePaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Pagamento</DialogTitle>
              <DialogDescription>
                Preencha os dados do pagamento e faça o upload do comprovante PDF
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userId">Colaborador</Label>
                <Select onValueChange={(value) => setNewPayment(prev => ({ ...prev, userId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role === 'freelancer').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="eventId">Evento</Label>
                <Select onValueChange={(value) => setNewPayment(prev => ({ ...prev, eventId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Input
                  id="notes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o pagamento"
                />
              </div>

              <div>
                <Label htmlFor="receipt">Comprovante PDF *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="receipt"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {newPayment.receiptFile ? newPayment.receiptFile.name : 'Clique para selecionar arquivo PDF'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Apenas arquivos PDF são aceitos
                    </p>
                  </label>
                </div>
                {newPayment.receiptFile && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Arquivo selecionado: {newPayment.receiptFile.name}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreatePaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePayment}>
                Cadastrar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PaymentManagement;


