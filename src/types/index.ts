
export type UserRole = 'gestor' | 'freelancer' | 'lider_freelancer';

// Sistema de categorias de experiência (substitui Equipe A/B)
export type TeamType = 'iniciante' | 'intermediario' | 'avancado' | 'sem_equipe';

// Tipos de eventos com valores diferentes
export type EventType = 'normal' | 'especial';

// Funções específicas para audiovisual
export type AudioVisualRole =
  | 'camera'
  | 'audio'
  | 'lighting'
  | 'director'
  | 'producer'
  | 'assistant'
  | 'technician'
  | 'streaming'
  | 'editing';

// Níveis de experiência
export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado' | 'expert';

// Interface para programação diária de eventos
export interface DailySchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activities: string[];
  requiredRoles: AudioVisualRole[];
  notes: string;
  isSetupDay: boolean;
  isMainEventDay: boolean;
  isTeardownDay: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  
  // Sistema de equipes (apenas para freelancers)
  teamType?: TeamType; // undefined para gestores
  
  // Campos específicos para freelancer
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cpf?: string;
  hourlyRate?: number; // Mantido para compatibilidade
  dailyRate?: number; // Novo: valor por diária (8 horas)
  experienceLevel: ExperienceLevel;
  audioVisualRoles: AudioVisualRole[];
  bio?: string;
  
  // Informações profissionais
  portfolio?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  
  // Experiência prévia
  previousExperience?: string;
  certifications?: string[];
  equipment?: string[];
  languages?: string[];
  
  // Estatísticas
  totalEventsAttended: number;
  totalEarnings: number;
  averageRating?: number;
  
  // Disponibilidade
  availability?: UserAvailability[];
  
  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Disponibilidade do usuário
export interface UserAvailability {
  id: string;
  userId: string;
  dayOfWeek: number; // 0-6 (domingo-sábado)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

// Novo tipo para gestão de equipes
export interface TeamAssignment {
  id: string;
  userId: string;
  fromTeamType?: TeamType;
  toTeamType: TeamType;
  changedBy: string; // ID do gestor que fez a alteração
  changedAt: string;
  notes?: string;
  userName?: string;
  userEmail?: string;
  changedByName?: string;
  // Aliases de compatibilidade para telas antigas.
  teamType: TeamType;
  assignedBy: string;
  assignedAt: string;
}

// Atualizando Event para incluir prioridade de equipe (visível apenas para gestores)
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Novos campos para audiovisual
  eventType: EventType; // 'normal' ou 'especial'
  estimatedDuration: number; // em horas
  budget?: number;
  requirements: AudioVisualRole[];
  notes?: string;
  
  // Sistema de prioridade por nível de experiência (APENAS PARA GESTORES)
  teamPriority: 'iniciante' | 'intermediario' | 'avancado' | 'ambas'; // Qual nível tem prioridade
  allowBackupLevels: boolean; // Se permite escalar outros níveis quando o prioritário não estiver disponível
  allowTeamB?: boolean; // Alias legado para compatibilidade

  // Sistema de valores por tipo de evento e nível de experiência
  dailyRateIniciante: number; // Valor por diária para Iniciante (mesmo de Intermediário)
  dailyRateIntermediario: number; // Valor por diária para Intermediário (mesmo de Iniciante)
  dailyRateAvancado: number; // Valor por diária para Avançado
  dailyRateTeamA?: number; // Alias legado para compatibilidade
  dailyRateTeamB?: number; // Alias legado para compatibilidade
  
  // Informações de multi-dia
  isMultiDay: boolean; // Se o evento dura múltiplos dias
  totalDays: number; // Total de dias do evento
  workingDays: string[]; // Array com as datas de trabalho (YYYY-MM-DD)
  
  // Programação detalhada dos dias do evento
  dailySchedule?: DailySchedule[];
  eventAgenda?: string;
  specialInstructions?: string;
  setupRequirements?: string;
  technicalSpecifications?: string;
  
  // Alocações de equipe
  teamAllocations?: TeamAllocation[];
  equipmentAllocations?: any[]; // Manter compatibilidade
  equipmentReservations?: EquipmentItemReservation[]; // Novo sistema
}

// Interface para freelancers verem apenas informações relevantes para sua equipe
export interface EventForFreelancer {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  eventType: EventType;
  estimatedDuration: number;
  budget?: number;
  requirements: AudioVisualRole[];
  notes?: string;
  
  // Informações específicas da equipe do freelancer
  userTeamType: TeamType;
  userDailyRate: number; // Valor da diária para a equipe do freelancer
  totalDays: number;
  isMultiDay: boolean;
  workingDays: string[];
  
  // Sem informações sobre prioridade de equipes
}

// Atualizando TeamAllocation para suportar controle de presença
export interface TeamAllocation {
  id: string;
  eventId: string;
  userId: string;
  assignedRole: AudioVisualRole;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  assignedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  // Sistema de pagamento por diária
  dailyRate: number; // Valor por diária para este freelancer
  totalDays: number; // Total de dias que o freelancer trabalhará
  totalPayment: number; // Pagamento total (dailyRate * totalDays)
  
  // Horas trabalhadas (para compatibilidade)
  totalHours: number;
  
  // Controle de presença e lista de chamada
  attendance: AttendanceRecord[]; // Registro de presença por dia
  attended: boolean; // Status geral de presença (calculado automaticamente)
  checkInTime?: string; // Check-in do freelancer
  checkOutTime?: string; // Check-out do freelancer
  
  // Data limite para cancelamento (5 dias antes do evento)
  cancellationDeadline: string;
  
  // Confirmação de presença
  confirmationDeadline: string;
  
  // Notas e observações
  notes?: string;
}

// Novo tipo para controle de presença por dia
export interface AttendanceRecord {
  id: string;
  date: string; // Data do evento (YYYY-MM-DD)
  status: 'present' | 'absent' | 'late' | 'pending'; // Status da presença
  checkInTime?: string; // Horário de chegada
  checkOutTime?: string; // Horário de saída
  confirmedBy?: string; // ID do gestor que confirmou
  confirmedAt?: string; // Quando foi confirmado
  notes?: string; // Observações sobre a presença
  dailyPayment: number; // Valor da diária para este dia
  paymentConfirmed: boolean; // Se o pagamento foi confirmado pelo gestor
}

// Status de presença para eventos multi-dia
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'pending';

// Interface para lista de chamada
export interface AttendanceList {
  eventId: string;
  eventDate: string;
  allocations: {
    allocationId: string;
    userId: string;
    userName: string;
    assignedRole: AudioVisualRole;
    teamType?: TeamType;
    attendance: AttendanceRecord;
  }[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalPending: number;
}

// Categorias de equipamentos
export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Equipamentos (tipos/modelos)
export interface Equipment {
  id: string;
  name: string;
  totalQuantity: number;
  description?: string;
  categoryId?: string;
  category?: string; // Campo legado
  categoryName?: string;
  categoryDescription?: string;
  hourlyRate?: number;
  dailyRate?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  location?: string;
  lastMaintenance?: string;
  createdAt: string;
  updatedAt: string;
}

// Itens individuais de equipamento (com controle por patrimônio)
export interface EquipmentItem {
  id: string;
  equipmentId: string;
  assetTag: string;
  serialNumber?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  status: 'in_service' | 'maintenance' | 'retired' | 'lost';
  location?: string;
  notes?: string;
  lastMaintenance?: string;
  createdAt: string;
  updatedAt: string;
  // Dados relacionados
  equipmentName?: string;
  equipmentDescription?: string;
  categoryName?: string;
  isAvailable?: boolean;
}

// Reservas de itens para eventos
export interface EquipmentItemReservation {
  id: string;
  eventId: string;
  equipmentItemId: string;
  status: 'reserved' | 'checked_out' | 'returned' | 'cancelled';
  
  // Dados de reserva
  reservedBy?: string;
  reservedAt?: string;
  reservedByName?: string;
  
  // Dados de checkout (retirada)
  checkedOutBy?: string;
  checkedOutAt?: string;
  checkedOutByName?: string;
  conditionOut?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  
  // Dados de checkin (devolução)
  checkedInBy?: string;
  checkedInAt?: string;
  checkedInByName?: string;
  conditionIn?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  postEventStatus?: 'ok' | 'maintenance' | 'replace' | 'lost' | 'damaged';
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Dados relacionados
  assetTag?: string;
  serialNumber?: string;
  itemCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  itemStatus?: 'in_service' | 'maintenance' | 'retired' | 'lost';
  equipmentName?: string;
  equipmentDescription?: string;
  categoryName?: string;
}

// Ordens de manutenção
export interface MaintenanceOrder {
  id: string;
  equipmentItemId: string;
  eventId?: string;
  openedBy: string;
  status: 'open' | 'in_progress' | 'completed' | 'discarded';
  requestedAction: 'maintenance' | 'replace';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Dados relacionados
  assetTag?: string;
  serialNumber?: string;
  itemCondition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  itemStatus?: 'in_service' | 'maintenance' | 'retired' | 'lost';
  equipmentName?: string;
  categoryName?: string;
  openedByName?: string;
  eventTitle?: string;
  eventStartDate?: string;
  eventEndDate?: string;
}

// Manter compatibilidade com sistema antigo
export interface EquipmentAllocation {
  id: string;
  eventId: string;
  equipmentId: string;
  quantity: number;
  equipment?: Equipment;
  // Novos campos para audiovisual
  startTime: string;
  endTime: string;
  totalHours: number;
  totalCost: number;
  notes?: string;
}

export interface CheckIn {
  id: string;
  allocationId: string;
  timestamp: string;
  // Novos campos para audiovisual
  location: string;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'allocation' | 'update' | 'reminder' | 'checkin' | 'payment' | 'schedule_conflict';
  relatedEventId?: string;
  createdAt: string;
  // Novos campos para audiovisual
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired?: boolean;
}

// Novo tipo para gestão de pagamentos
export interface PaymentRecord {
  id: string;
  userId: string;
  eventId: string;
  allocationId: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  receiptFile?: string; // Nome do arquivo do comprovante
  receiptUrl?: string; // URL para download do comprovante
  createdAt: string;
  updatedAt: string;
}

// Novo tipo para relatórios
export interface UserEventReport {
  userId: string;
  userName: string;
  totalEvents: number;
  confirmedEvents: number;
  attendedEvents: number;
  totalHours: number;
  totalEarnings: number;
  averageRating?: number;
  lastEventDate?: string;
}
