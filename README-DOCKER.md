# FRELA - Sistema de Gerenciamento de Equipes para Eventos Audiovisuais

## 🐳 Executando com Docker

Este projeto agora está completamente containerizado com Docker, facilitando o desenvolvimento e deploy.

### 📋 Pré-requisitos

- Docker Desktop instalado e rodando
- Git para clonar o repositório

### 🚀 Início Rápido

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd event-team-sync
   ```

2. **Inicie todos os serviços:**
   ```bash
   # No Windows (PowerShell)
   .\docker-manager.sh start
   
   # No Linux/Mac
   chmod +x docker-manager.sh
   ./docker-manager.sh start
   ```

3. **Acesse a aplicação:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - PgAdmin: http://localhost:5050

### 🛠️ Comandos Disponíveis

O script `docker-manager.sh` oferece vários comandos úteis:

```bash
# Iniciar todos os serviços
./docker-manager.sh start

# Parar todos os serviços
./docker-manager.sh stop

# Reiniciar serviços
./docker-manager.sh restart

# Fazer build das imagens
./docker-manager.sh build

# Ver logs
./docker-manager.sh logs          # Todos os serviços
./docker-manager.sh logs server   # Apenas servidor
./docker-manager.sh logs web      # Apenas frontend

# Ver status dos serviços
./docker-manager.sh status

# Inserir dados de teste
./docker-manager.sh test-data

# Executar debug
./docker-manager.sh debug

# Reset completo do banco
./docker-manager.sh reset

# Limpeza completa (CUIDADO!)
./docker-manager.sh clean
```

### 🏗️ Arquitetura dos Containers

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (Nginx)       │    │   (Node.js)     │    │   Database      │
│   Porta 80      │    │   Porta 3001    │    │   Porta 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PgAdmin       │
                    │   Porta 5050    │
                    └─────────────────┘
```

### 🔧 Serviços

#### 1. **Frontend (Web)**
- **Porta:** 80
- **Tecnologia:** React + Vite + Nginx
- **URL:** http://localhost
- **Funcionalidades:** Interface do usuário, gerenciamento de eventos

#### 2. **Backend (Server)**
- **Porta:** 3001
- **Tecnologia:** Node.js + Express + TypeScript
- **URL:** http://localhost:3001
- **Funcionalidades:** API REST, autenticação, lógica de negócio

#### 3. **Banco de Dados (PostgreSQL)**
- **Porta:** 5432
- **Tecnologia:** PostgreSQL 15
- **Credenciais:**
  - Database: `frela_db`
  - Usuário: `frela_user`
  - Senha: `frela_password`

#### 4. **PgAdmin**
- **Porta:** 5050
- **Tecnologia:** PgAdmin 4
- **Credenciais:**
  - Email: `admin@frela.com`
  - Senha: `admin123`

### 📊 Dados de Teste

Para testar a funcionalidade completa, execute:

```bash
./docker-manager.sh test-data
```

Isso irá inserir:
- Usuário administrador
- Usuário freelancer de teste
- Eventos de exemplo
- Alocações de equipe

### 🔍 Debug e Troubleshooting

#### Verificar Status dos Serviços
```bash
./docker-manager.sh status
```

#### Ver Logs em Tempo Real
```bash
# Todos os serviços
./docker-manager.sh logs

# Serviço específico
./docker-manager.sh logs server
./docker-manager.sh logs web
./docker-manager.sh logs postgres
```

#### Executar Script de Debug
```bash
./docker-manager.sh debug
```

#### Problemas Comuns

1. **Porta já em uso:**
   ```bash
   # Verificar portas em uso
   netstat -an | findstr :80
   netstat -an | findstr :3001
   
   # Parar serviços
   ./docker-manager.sh stop
   ```

2. **Banco não conecta:**
   ```bash
   # Verificar logs do banco
   ./docker-manager.sh logs postgres
   
   # Resetar banco
   ./docker-manager.sh reset
   ```

3. **Build falha:**
   ```bash
   # Limpar cache Docker
   docker system prune -f
   
   # Rebuild
   ./docker-manager.sh build
   ```

### 🚀 Desenvolvimento

#### Modo Desenvolvimento
Os containers estão configurados com volumes para desenvolvimento:
- Código do servidor: `./server` → `/app/server`
- Código do banco: `./database` → `/app/database`

#### Hot Reload
- **Frontend:** Alterações no código são refletidas após rebuild
- **Backend:** Alterações no código são refletidas automaticamente

#### Variáveis de Ambiente
As variáveis de ambiente estão configuradas no `docker-compose.yml`:
- `NODE_ENV`: development
- `PORT`: 3001
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT

### 📝 Logs e Monitoramento

#### Logs dos Serviços
```bash
# Logs em tempo real
./docker-manager.sh logs

# Logs de serviço específico
./docker-manager.sh logs server
```

#### Health Checks
- **PostgreSQL:** Verificação automática de conectividade
- **Backend:** Endpoint `/api/health`
- **Frontend:** Verificação automática do Nginx

### 🧹 Limpeza e Manutenção

#### Limpeza Regular
```bash
# Limpar containers parados
docker container prune

# Limpar imagens não utilizadas
docker image prune

# Limpeza completa (CUIDADO!)
./docker-manager.sh clean
```

#### Backup do Banco
```bash
# Backup
docker-compose exec postgres pg_dump -U frela_user frela_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U frela_user -d frela_db < backup.sql
```

### 🔐 Segurança

- **CORS:** Configurado para desenvolvimento local
- **Helmet:** Headers de segurança habilitados
- **JWT:** Autenticação baseada em tokens
- **Validação:** Validação de entrada em todas as rotas

### 📚 Recursos Adicionais

- **Documentação da API:** http://localhost:3001/api/health
- **Banco de Dados:** Acessível via PgAdmin em http://localhost:5050
- **Logs:** Disponíveis via `./docker-manager.sh logs`

### 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `./docker-manager.sh logs`
2. Execute o debug: `./docker-manager.sh debug`
3. Verifique o status: `./docker-manager.sh status`
4. Consulte a documentação da API

---

**🎯 Objetivo:** Sistema completo para gerenciamento de equipes freelancer em eventos audiovisuais, com controle de alocações, pagamentos e equipamentos.
