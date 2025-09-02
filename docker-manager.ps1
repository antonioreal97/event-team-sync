# Script PowerShell para gerenciar os containers Docker do projeto FRELA
# Uso: .\docker-manager.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Função para mostrar ajuda
function Show-Help {
    Write-Host "Gerenciador Docker para FRELA" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Comandos disponíveis:" -ForegroundColor White
    Write-Host "  start       - Iniciar todos os serviços" -ForegroundColor Yellow
    Write-Host "  stop        - Parar todos os serviços" -ForegroundColor Yellow
    Write-Host "  restart     - Reiniciar todos os serviços" -ForegroundColor Yellow
    Write-Host "  build       - Fazer build de todos os serviços" -ForegroundColor Yellow
    Write-Host "  logs        - Mostrar logs de todos os serviços" -ForegroundColor Yellow
    Write-Host "  status      - Mostrar status dos serviços" -ForegroundColor Yellow
    Write-Host "  clean       - Limpar containers e volumes (CUIDADO!)" -ForegroundColor Yellow
    Write-Host "  reset       - Reset completo do banco de dados" -ForegroundColor Yellow
    Write-Host "  test-data   - Inserir dados de teste" -ForegroundColor Yellow
    Write-Host "  debug       - Executar script de debug" -ForegroundColor Yellow
    Write-Host "  help        - Mostrar esta ajuda" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor White
    Write-Host "  .\docker-manager.ps1 start" -ForegroundColor Cyan
    Write-Host "  .\docker-manager.ps1 logs server" -ForegroundColor Cyan
    Write-Host "  .\docker-manager.ps1 status" -ForegroundColor Cyan
}

# Função para verificar se o Docker está rodando
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Host "❌ Docker não está rodando. Inicie o Docker Desktop primeiro." -ForegroundColor Red
        return $false
    }
}

# Função para iniciar serviços
function Start-Services {
    Write-Host "🚀 Iniciando serviços..." -ForegroundColor Blue
    
    if (-not (Test-Docker)) { return }
    
    # Iniciar banco de dados primeiro
    Write-Host "📊 Iniciando PostgreSQL..." -ForegroundColor Yellow
    docker-compose up -d postgres
    
    # Aguardar banco estar pronto
    Write-Host "⏳ Aguardando banco de dados estar pronto..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Iniciar outros serviços
    Write-Host "🔧 Iniciando servidor..." -ForegroundColor Yellow
    docker-compose up -d server
    
    Write-Host "🌐 Iniciando frontend..." -ForegroundColor Yellow
    docker-compose up -d web
    
    Write-Host "✅ Todos os serviços iniciados!" -ForegroundColor Green
    Show-Status
}

# Função para parar serviços
function Stop-Services {
    Write-Host "🛑 Parando serviços..." -ForegroundColor Blue
    docker-compose down
    Write-Host "✅ Serviços parados!" -ForegroundColor Green
}

# Função para reiniciar serviços
function Restart-Services {
    Write-Host "🔄 Reiniciando serviços..." -ForegroundColor Blue
    Stop-Services
    Start-Sleep -Seconds 2
    Start-Services
}

# Função para fazer build
function Build-Services {
    Write-Host "🔨 Fazendo build dos serviços..." -ForegroundColor Blue
    
    if (-not (Test-Docker)) { return }
    
    # Build do servidor
    Write-Host "🔧 Build do servidor..." -ForegroundColor Yellow
    docker-compose build server
    
    # Build do frontend
    Write-Host "🌐 Build do frontend..." -ForegroundColor Yellow
    docker-compose build web
    
    Write-Host "✅ Build concluído!" -ForegroundColor Green
}

# Função para mostrar logs
function Show-Logs {
    param([string]$Service = "")
    
    if ($Service -eq "") {
        Write-Host "📋 Logs de todos os serviços:" -ForegroundColor Blue
        docker-compose logs -f
    }
    else {
        Write-Host "📋 Logs do serviço $Service:" -ForegroundColor Blue
        docker-compose logs -f $Service
    }
}

# Função para mostrar status
function Show-Status {
    Write-Host "📊 Status dos serviços:" -ForegroundColor Blue
    docker-compose ps
    
    Write-Host ""
    Write-Host "🌐 URLs dos serviços:" -ForegroundColor Blue
    Write-Host "  Frontend: http://localhost" -ForegroundColor Green
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Green
    Write-Host "  PgAdmin:  http://localhost:5050" -ForegroundColor Green
    Write-Host "  Database: localhost:5432" -ForegroundColor Green
}

# Função para limpar
function Clean-All {
    Write-Host "⚠️  ATENÇÃO: Esta operação irá remover TODOS os containers e volumes!" -ForegroundColor Red
    $confirm = Read-Host "Tem certeza? Digite 'sim' para confirmar"
    
    if ($confirm -eq "sim") {
        Write-Host "🧹 Limpando tudo..." -ForegroundColor Blue
        docker-compose down -v --remove-orphans
        docker system prune -f
        Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
    }
}

# Função para reset do banco
function Reset-Database {
    Write-Host "⚠️  ATENÇÃO: Esta operação irá resetar o banco de dados!" -ForegroundColor Red
    $confirm = Read-Host "Tem certeza? Digite 'sim' para confirmar"
    
    if ($confirm -eq "sim") {
        Write-Host "🔄 Resetando banco de dados..." -ForegroundColor Blue
        docker-compose down -v
        docker-compose up -d postgres
        Start-Sleep -Seconds 10
        Write-Host "✅ Banco resetado!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
    }
}

# Função para inserir dados de teste
function Insert-TestData {
    Write-Host "📝 Inserindo dados de teste..." -ForegroundColor Blue
    
    # Verificar se o banco está rodando
    $postgresStatus = docker-compose ps postgres | Select-String "Up"
    if (-not $postgresStatus) {
        Write-Host "❌ Banco de dados não está rodando. Execute 'start' primeiro." -ForegroundColor Red
        return
    }
    
    # Executar script SQL
    Write-Host "📊 Executando script de dados de teste..." -ForegroundColor Yellow
    Get-Content "database\insert-test-data.sql" | docker-compose exec -T postgres psql -U frela_user -d frela_db
    
    Write-Host "✅ Dados de teste inseridos!" -ForegroundColor Green
}

# Função para executar debug
function Run-Debug {
    Write-Host "🔍 Executando script de debug..." -ForegroundColor Blue
    
    # Verificar se o banco está rodando
    $postgresStatus = docker-compose ps postgres | Select-String "Up"
    if (-not $postgresStatus) {
        Write-Host "❌ Banco de dados não está rodando. Execute 'start' primeiro." -ForegroundColor Red
        return
    }
    
    # Executar script de debug
    node check-events-debug.js
}

# Função principal
function Main {
    switch ($Command.ToLower()) {
        "start" {
            Start-Services
        }
        "stop" {
            Stop-Services
        }
        "restart" {
            Restart-Services
        }
        "build" {
            Build-Services
        }
        "logs" {
            Show-Logs $args[1]
        }
        "status" {
            Show-Status
        }
        "clean" {
            Clean-All
        }
        "reset" {
            Reset-Database
        }
        "test-data" {
            Insert-TestData
        }
        "debug" {
            Run-Debug
        }
        "help" {
            Show-Help
        }
        default {
            Write-Host "Comando '$Command' não reconhecido." -ForegroundColor Red
            Show-Help
        }
    }
}

# Executar função principal
Main
