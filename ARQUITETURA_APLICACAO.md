# Arquitetura da Aplicação FRELA_M

## Visão Geral

O **FRELA_M** (Event Team Sync) é uma aplicação web completa para gerenciamento de equipes de eventos audiovisuais, desenvolvida com arquitetura moderna full-stack utilizando React, Node.js, PostgreSQL e Docker.

## Arquitetura Geral

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[Interface do Usuário]
        Components[Componentes React]
        Context[Context API]
        Services[Serviços de API]
    end
    
    subgraph "Backend (Node.js + Express)"
        API[API REST]
        Middleware[Middleware de Autenticação]
        Routes[Rotas da API]
        Services[Serviços de Negócio]
    end
    
    subgraph "Banco de Dados"
        PostgreSQL[(PostgreSQL)]
        Migrations[Migrações SQL]
    end
    
    subgraph "Infraestrutura"
        Docker[Docker Containers]
        Nginx[Nginx Reverse Proxy]
        Network[Rede Docker]
    end
    
    UI --> Components
    Components --> Context
    Context --> Services
    Services --> API
    API --> Middleware
    Middleware --> Routes
    Routes --> Services
    Services --> PostgreSQL
    Docker --> PostgreSQL
    Docker --> API
    Docker --> Nginx
    Nginx --> API
```

## Stack Tecnológica

### Frontend
- **React 18.3.1** - Biblioteca principal para interface
- **TypeScript 5.5.3** - Tipagem estática
- **Vite 5.4.1** - Build tool e dev server
- **Tailwind CSS 3.4.11** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **React Router DOM 6.26.2** - Roteamento
- **React Query (TanStack)** - Gerenciamento de estado e cache
- **React Hook Form 7.53.0** - Formulários
- **Zod 3.23.8** - Validação de schemas

### Backend
- **Node.js** - Runtime JavaScript
- **Express 4.18.2** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL 15** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Hash de senhas
- **Nodemailer** - Envio de emails
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Segurança HTTP

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração de serviços
- **Nginx** - Reverse proxy e servidor web
- **PostgreSQL** - Banco de dados principal
- **pgAdmin** - Interface de administração do banco

## Estrutura do Projeto

```
event-team-sync/
├── src/                          # Código fonte do frontend
│   ├── components/               # Componentes React reutilizáveis
│   │   ├── ui/                  # Componentes base (Radix UI)
│   │   └── ...                  # Componentes específicos
│   ├── pages/                   # Páginas da aplicação
│   │   ├── Events/             # Páginas relacionadas a eventos
│   │   ├── TeamManagement/     # Páginas de gestão de equipes
│   │   └── ...                 # Outras páginas
│   ├── contexts/                # Context API (Auth, etc.)
│   ├── hooks/                   # Hooks customizados
│   ├── services/                # Serviços de API
│   ├── types/                   # Definições de tipos TypeScript
│   ├── utils/                   # Utilitários
│   └── config/                  # Configurações
├── server/                      # Código fonte do backend
│   ├── routes/                  # Rotas da API
│   ├── middleware/              # Middleware (auth, error handling)
│   ├── config/                  # Configurações do servidor
│   └── scripts/                 # Scripts utilitários
├── database/                    # Scripts e migrações do banco
├── public/                      # Arquivos estáticos
├── dist/                        # Build de produção
└── docker/                      # Configurações Docker
```

## Arquitetura do Frontend

### Estrutura de Componentes

```mermaid
graph TD
    App[App.tsx] --> AuthProvider[AuthProvider]
    AuthProvider --> AppRoutes[AppRoutes]
    AppRoutes --> ProtectedRoute[ProtectedRoute]
    
    subgraph "Páginas Principais"
        Dashboard[Dashboard]
        EventsList[EventsList]
        EventDetail[EventDetail]
        TeamManagement[TeamManagement]
        Profile[Profile]
    end
    
    subgraph "Componentes Reutilizáveis"
        EventCard[EventCard]
        StatusBadge[StatusBadge]
        NotificationIndicator[NotificationIndicator]
        PaymentDisplay[PaymentDisplay]
    end
    
    subgraph "Sistema de UI"
        RadixUI[Radix UI Components]
        Tailwind[Tailwind CSS]
        CustomComponents[Componentes Customizados]
    end
    
    ProtectedRoute --> Dashboard
    ProtectedRoute --> EventsList
    ProtectedRoute --> EventDetail
    ProtectedRoute --> TeamManagement
    ProtectedRoute --> Profile
    
    EventsList --> EventCard
    EventDetail --> StatusBadge
    EventDetail --> NotificationIndicator
    EventDetail --> PaymentDisplay
```

### Gerenciamento de Estado

- **Context API** para autenticação global
- **React Query** para cache e sincronização de dados
- **Local Storage** para persistência de sessão
- **Estado local** para formulários e componentes específicos

### Sistema de Roteamento

```typescript
// Rotas protegidas com autenticação
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="/events" element={<ProtectedRoute><EventsList /></ProtectedRoute>} />
<Route path="/team-management" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />

// Rotas públicas
<Route path="/login" element={<Login />} />
```

## Arquitetura do Backend

### Estrutura do Servidor

```mermaid
graph TD
    Express[Express App] --> Middleware[Middleware Stack]
    Middleware --> Security[Security Middleware]
    Security --> Helmet[Helmet]
    Security --> CORS[CORS]
    
    Middleware --> Parsing[Parsing Middleware]
    Parsing --> JSON[JSON Parser]
    Parsing --> URLEncoded[URL Encoded]
    
    Middleware --> Logging[Logging Middleware]
    Middleware --> Auth[Authentication Middleware]
    
    subgraph "Rotas da API"
        AuthRoutes[Auth Routes]
        UserRoutes[User Routes]
        EventRoutes[Event Routes]
        TeamRoutes[Team Routes]
        EquipmentRoutes[Equipment Routes]
        NotificationRoutes[Notification Routes]
    end
    
    Express --> AuthRoutes
    Express --> UserRoutes
    Express --> EventRoutes
    Express --> TeamRoutes
    Express --> EquipmentRoutes
    Express --> NotificationRoutes
    
    subgraph "Camadas de Negócio"
        Controllers[Controllers]
        Services[Services]
        Models[Data Models]
    end
    
    Routes --> Controllers
    Controllers --> Services
    Services --> Models
    Models --> Database[(PostgreSQL)]
```

### Middleware Stack

1. **Helmet** - Headers de segurança HTTP
2. **CORS** - Configuração de cross-origin
3. **JSON Parser** - Parsing de requisições JSON
4. **URL Encoded** - Parsing de formulários
5. **Logging** - Log de requisições
6. **Authentication** - Verificação de JWT
7. **Error Handler** - Tratamento global de erros

### Sistema de Autenticação

- **JWT (JSON Web Tokens)** para autenticação
- **bcryptjs** para hash de senhas
- **Middleware de autenticação** para rotas protegidas
- **Refresh tokens** para renovação de sessão

## Arquitetura do Banco de Dados

### Modelo de Dados

```mermaid
erDiagram
    users {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
        varchar avatar
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    freelancer_profiles {
        uuid id PK
        uuid user_id FK
        varchar team_type
        varchar phone
        text address
        varchar city
        varchar state
        varchar cpf UK
        decimal hourly_rate
        decimal daily_rate
        varchar experience_level
        text[] audio_visual_roles
        text bio
        varchar portfolio
        varchar linkedin
        varchar instagram
        varchar website
        text previous_experience
        text[] certifications
        text[] equipment
        text[] languages
        integer total_events_attended
        decimal total_earnings
        decimal average_rating
    }
    
    events {
        uuid id PK
        varchar title
        text description
        text location
        timestamp start_date
        timestamp end_date
        varchar status
        uuid created_by FK
        varchar event_type
        integer estimated_duration
        decimal budget
        text[] requirements
        text notes
        varchar team_priority
        boolean allow_team_b
        decimal daily_rate_team_a
        decimal daily_rate_team_b
        boolean is_multi_day
        integer total_days
        date[] working_days
    }
    
    team_allocations {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        varchar assigned_role
        varchar status
        timestamp assigned_at
        timestamp confirmed_at
        decimal daily_rate
        integer total_days
        decimal total_payment
        integer total_hours
        boolean attended
        timestamp cancellation_deadline
        timestamp confirmation_deadline
        text notes
    }
    
    attendance_records {
        uuid id PK
        uuid team_allocation_id FK
        date date
        varchar status
        decimal daily_payment
        boolean payment_confirmed
        uuid confirmed_by FK
        timestamp confirmed_at
        text notes
    }
    
    equipments {
        uuid id PK
        varchar name
        integer total_quantity
        text description
        varchar category
        decimal hourly_rate
        decimal daily_rate
        varchar condition
        varchar location
        date last_maintenance
    }
    
    notifications {
        uuid id PK
        uuid user_id FK
        varchar title
        text message
        varchar type
        boolean is_read
        uuid related_event_id FK
        timestamp created_at
        timestamp read_at
    }
    
    users ||--|| freelancer_profiles : has
    users ||--o{ events : creates
    events ||--o{ team_allocations : has
    team_allocations ||--o{ attendance_records : tracks
    events ||--o{ equipments : uses
    users ||--o{ notifications : receives
```

### Índices e Performance

- **Índices primários** em todas as chaves primárias
- **Índices secundários** em campos frequentemente consultados
- **Índices compostos** para consultas complexas
- **Triggers** para atualização automática de timestamps

### Relacionamentos

- **One-to-One**: `users` ↔ `freelancer_profiles`
- **One-to-Many**: `users` → `events`, `events` → `team_allocations`
- **Many-to-Many**: `events` ↔ `equipments` (via `equipment_allocations`)

## Sistema de Equipes

### Estrutura de Equipes

```mermaid
graph TD
    subgraph "Sistema de Equipes"
        EquipeA[Equipe A - Prioridade Alta]
        EquipeB[Equipe B - Prioridade Baixa]
        SemEquipe[Sem Equipe - Freelancers Independentes]
    end
    
    subgraph "Atribuições"
        Gestor[Gestor] --> EquipeA
        Gestor --> EquipeB
        Gestor --> SemEquipe
        
        Evento[Evento] --> Prioridade[Prioridade de Equipe]
        Prioridade --> EquipeA
        Prioridade --> EquipeB
    end
    
    subgraph "Controle de Acesso"
        Gestor --> VerTodas[Ver Todas as Equipes]
        Freelancer --> VerPropria[Ver Apenas Própria Equipe]
    end
```

### Priorização de Equipes

- **Equipe A**: Prioridade alta para eventos especiais
- **Equipe B**: Prioridade baixa, usado quando A não está disponível
- **Sem Equipe**: Freelancers independentes para projetos específicos

## Sistema de Eventos

### Tipos de Eventos

```typescript
type EventType = 'normal' | 'especial';

interface Event {
  eventType: EventType;
  teamPriority: 'equipe_a' | 'equipe_b' | 'ambas';
  allowTeamB: boolean;
  dailyRateTeamA: number;
  dailyRateTeamB: number;
  isMultiDay: boolean;
  totalDays: number;
  workingDays: string[];
}
```

### Programação de Eventos

- **Eventos de um dia**: Pagamento por diária
- **Eventos multi-dia**: Programação detalhada por dia
- **Dias de setup/teardown**: Configuração e desmontagem
- **Controle de presença**: Lista de chamada diária

## Sistema de Pagamentos

### Estrutura de Pagamentos

```mermaid
graph TD
    subgraph "Sistema de Pagamentos"
        Diaria[Pagamento por Diária]
        EventoCompleto[Pagamento por Evento Completo]
        Bonus[Pagamentos por Bônus]
        Ajuste[Ajustes e Correções]
    end
    
    subgraph "Controle de Presença"
        Presente[Presente] --> Diaria
        Ausente[Ausente] --> SemPagamento
        Atrasado[Atrasado] --> DiariaReduzida
    end
    
    subgraph "Confirmação"
        Gestor[Gestor] --> ConfirmaPagamento[Confirma Pagamento]
        ConfirmaPagamento --> RegistroPagamento[Registro de Pagamento]
    end
```

### Tipos de Pagamento

- **Pagamento por diária**: Baseado na presença diária
- **Pagamento por evento completo**: Valor total do evento
- **Bônus**: Pagamentos extras por performance
- **Ajustes**: Correções e compensações

## Sistema de Notificações

### Tipos de Notificações

```typescript
type NotificationType = 
  | 'allocation'      // Nova alocação
  | 'update'          // Atualização de evento
  | 'reminder'        // Lembretes
  | 'checkin'         // Check-in/Check-out
  | 'payment'         // Confirmação de pagamento
  | 'schedule_conflict'; // Conflito de agenda
```

### Sistema de Prioridades

- **Baixa**: Informações gerais
- **Média**: Atualizações importantes
- **Alta**: Ações requeridas
- **Urgente**: Requer atenção imediata

## Infraestrutura Docker

### Arquitetura de Containers

```mermaid
graph TD
    subgraph "Docker Network: frela_network"
        subgraph "Container: frela_postgres"
            PostgreSQL[(PostgreSQL 15)]
        end
        
        subgraph "Container: frela_pgadmin"
            PgAdmin[pgAdmin 4]
        end
        
        subgraph "Container: frela_server"
            NodeServer[Node.js Server]
        end
        
        subgraph "Container: frela_web"
            Nginx[Nginx + React App]
        end
    end
    
    Client[Cliente Web] --> Nginx
    Nginx --> NodeServer
    NodeServer --> PostgreSQL
    PgAdmin --> PostgreSQL
```

### Configuração de Serviços

#### PostgreSQL
- **Porta**: 5432
- **Database**: frela_db
- **Usuário**: frela_user
- **Health Check**: pg_isready

#### pgAdmin
- **Porta**: 5050
- **Email**: admin@frela.com
- **Dependência**: PostgreSQL (health check)

#### Servidor Node.js
- **Porta**: 3001
- **Dependência**: PostgreSQL (health check)
- **Volumes**: server/ e database/
- **Restart**: unless-stopped

#### Frontend + Nginx
- **Porta**: 80
- **Dependência**: Servidor Node.js
- **Reverse Proxy**: Para API do servidor

## Segurança

### Camadas de Segurança

1. **Helmet.js**: Headers de segurança HTTP
2. **CORS**: Controle de cross-origin
3. **JWT**: Autenticação baseada em tokens
4. **bcryptjs**: Hash seguro de senhas
5. **Validação**: Schemas Zod para validação de dados
6. **Rate Limiting**: Proteção contra ataques de força bruta

### Autenticação e Autorização

```typescript
// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

## Performance e Escalabilidade

### Otimizações de Frontend

- **Code Splitting**: Carregamento lazy de componentes
- **React Query**: Cache inteligente de dados
- **Bundle Optimization**: Vite para build otimizado
- **Image Optimization**: Otimização de assets

### Otimizações de Backend

- **Connection Pooling**: Pool de conexões PostgreSQL
- **Query Optimization**: Índices estratégicos
- **Caching**: Cache de consultas frequentes
- **Async/Await**: Operações não-bloqueantes

### Otimizações de Banco

- **Índices**: Para consultas frequentes
- **Triggers**: Atualizações automáticas
- **Constraints**: Integridade referencial
- **Partitioning**: Para tabelas grandes (futuro)

## Monitoramento e Logs

### Sistema de Logs

```typescript
// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Health Checks

- **API Health**: `/api/health`
- **Database Health**: pg_isready
- **Container Health**: Docker health checks

## Deploy e CI/CD

### Scripts de Deploy

- **docker-manager.ps1**: Scripts PowerShell para Windows
- **docker-manager.sh**: Scripts Bash para Linux/macOS
- **Docker Compose**: Orquestração de serviços

### Variáveis de Ambiente

```bash
# Configuração do banco
DB_USER=frela_user
DB_HOST=localhost
DB_NAME=frela_db
DB_PASSWORD=frela_password
DB_PORT=5432

# Configuração do servidor
PORT=3001
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Funcionalidades Principais

### Para Gestores

1. **Gestão de Eventos**: Criação, edição, cancelamento
2. **Gestão de Equipes**: Alocação de freelancers
3. **Controle de Presença**: Lista de chamada
4. **Gestão de Pagamentos**: Confirmação e registro
5. **Relatórios**: Estatísticas e análises

### Para Freelancers

1. **Visualização de Eventos**: Apenas eventos da própria equipe
2. **Confirmação de Presença**: Aceitar/rejeitar alocações
3. **Check-in/Check-out**: Registro de presença
4. **Perfil Profissional**: Atualização de informações
5. **Histórico**: Eventos anteriores e pagamentos

## Roadmap e Melhorias Futuras

### Funcionalidades Planejadas

1. **Sistema de Avaliações**: Rating de freelancers
2. **Integração com Pagamentos**: PIX, cartão, etc.
3. **App Mobile**: Versão mobile nativa
4. **Sistema de Chat**: Comunicação em tempo real
5. **Analytics Avançados**: Dashboards de performance
6. **API Pública**: Integração com terceiros

### Melhorias Técnicas

1. **Microserviços**: Separação de domínios
2. **Message Queue**: Processamento assíncrono
3. **Cache Redis**: Cache distribuído
4. **Load Balancer**: Balanceamento de carga
5. **Monitoramento**: APM e métricas
6. **Testes**: Testes automatizados

## Conclusão

O FRELA_M é uma aplicação robusta e bem arquitetada que demonstra boas práticas de desenvolvimento moderno. A arquitetura em camadas, uso de TypeScript, containerização Docker e design responsivo tornam a aplicação escalável, manutenível e preparada para crescimento futuro.

A separação clara entre frontend e backend, o sistema de autenticação seguro, e a estrutura de banco de dados bem normalizada fornecem uma base sólida para funcionalidades avançadas e integrações futuras.
