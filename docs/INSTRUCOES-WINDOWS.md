# 🪟 Instruções para Windows - FRELA Docker

## 📋 Pré-requisitos

1. **Docker Desktop** instalado e rodando
   - Baixe em: https://www.docker.com/products/docker-desktop/
   - Inicie o Docker Desktop e aguarde estar rodando

2. **PowerShell** (já incluído no Windows 10/11)

## 🚀 Início Rápido

### 1. Abrir PowerShell como Administrador
- Pressione `Win + X`
- Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

### 2. Navegar para o projeto
```powershell
cd "C:\Users\Antônio\Documents\FRELA_M\event-team-sync"
```

### 3. Iniciar todos os serviços
```powershell
.\docker-manager.ps1 start
```

### 4. Acessar a aplicação
- **Frontend:** http://localhost
- **Backend API:** http://localhost:3001
- **PgAdmin:** http://localhost:5050

## 🛠️ Comandos Disponíveis

### Comandos Básicos
```powershell
# Iniciar todos os serviços
.\docker-manager.ps1 start

# Parar todos os serviços
.\docker-manager.ps1 stop

# Reiniciar serviços
.\docker-manager.ps1 restart

# Ver status dos serviços
.\docker-manager.ps1 status
```

### Comandos de Desenvolvimento
```powershell
# Fazer build das imagens
.\docker-manager.ps1 build

# Ver logs em tempo real
.\docker-manager.ps1 logs

# Ver logs de serviço específico
.\docker-manager.ps1 logs server
.\docker-manager.ps1 logs web
.\docker-manager.ps1 logs postgres
```

### Comandos de Dados
```powershell
# Inserir dados de teste
.\docker-manager.ps1 test-data

# Executar script de debug
.\docker-manager.ps1 debug

# Reset completo do banco
.\docker-manager.ps1 reset
```

### Comandos de Manutenção
```powershell
# Limpeza completa (CUIDADO!)
.\docker-manager.ps1 clean

# Ver ajuda
.\docker-manager.ps1 help
```

## 🔧 Solução de Problemas

### 1. **Erro de Política de Execução**
Se aparecer erro sobre política de execução:
```powershell
# Verificar política atual
Get-ExecutionPolicy

# Alterar política (como administrador)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ou para este diretório apenas
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### 2. **Docker não está rodando**
```powershell
# Verificar se Docker está rodando
docker info

# Se der erro, inicie o Docker Desktop manualmente
```

### 3. **Portas já em uso**
```powershell
# Verificar portas em uso
netstat -an | findstr :80
netstat -an | findstr :3001

# Parar serviços
.\docker-manager.ps1 stop

# Verificar se há outros processos usando as portas
```

### 4. **Build falha**
```powershell
# Limpar cache Docker
docker system prune -f

# Rebuild
.\docker-manager.ps1 build
```

### 5. **Banco não conecta**
```powershell
# Verificar logs do banco
.\docker-manager.ps1 logs postgres

# Resetar banco
.\docker-manager.ps1 reset
```

## 📊 Monitoramento

### Ver Status dos Serviços
```powershell
.\docker-manager.ps1 status
```

### Ver Logs em Tempo Real
```powershell
# Todos os serviços
.\docker-manager.ps1 logs

# Serviço específico
.\docker-manager.ps1 logs server
```

### Health Check
- **Backend:** http://localhost:3001/api/health
- **Frontend:** http://localhost
- **PgAdmin:** http://localhost:5050

## 🗄️ Banco de Dados

### Credenciais
- **Host:** localhost
- **Porta:** 5432
- **Database:** frela_db
- **Usuário:** frela_user
- **Senha:** frela_password

### PgAdmin
- **URL:** http://localhost:5050
- **Email:** admin@frela.com
- **Senha:** admin123

### Inserir Dados de Teste
```powershell
.\docker-manager.ps1 test-data
```

## 🔍 Debug

### Executar Script de Debug
```powershell
.\docker-manager.ps1 debug
```

### Verificar Logs
```powershell
# Logs do servidor
.\docker-manager.ps1 logs server

# Logs do frontend
.\docker-manager.ps1 logs web

# Logs do banco
.\docker-manager.ps1 logs postgres
```

## 🧹 Manutenção

### Limpeza Regular
```powershell
# Limpar containers parados
docker container prune

# Limpar imagens não utilizadas
docker image prune

# Limpeza completa (CUIDADO!)
.\docker-manager.ps1 clean
```

### Backup do Banco
```powershell
# Backup
docker-compose exec postgres pg_dump -U frela_user frela_db > backup.sql

# Restore
Get-Content backup.sql | docker-compose exec -T postgres psql -U frela_user -d frela_db
```

## 📱 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost | Interface principal |
| Backend | http://localhost:3001 | API REST |
| PgAdmin | http://localhost:5050 | Gerenciador do banco |
| Health Check | http://localhost:3001/api/health | Status da API |

## 🆘 Suporte

### Sequência de Troubleshooting
1. **Verificar Docker:** `docker info`
2. **Verificar status:** `.\docker-manager.ps1 status`
3. **Ver logs:** `.\docker-manager.ps1 logs`
4. **Executar debug:** `.\docker-manager.ps1 debug`
5. **Reset se necessário:** `.\docker-manager.ps1 reset`

### Comandos Úteis do Docker
```powershell
# Ver containers rodando
docker ps

# Ver todos os containers
docker ps -a

# Ver imagens
docker images

# Ver volumes
docker volume ls

# Ver redes
docker network ls
```

---

**💡 Dica:** Use sempre o PowerShell como Administrador para evitar problemas de permissão!
