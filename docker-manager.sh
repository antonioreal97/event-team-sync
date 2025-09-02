#!/bin/bash

# Script para gerenciar os containers Docker do projeto FRELA
# Uso: ./docker-manager.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}Gerenciador Docker para FRELA${NC}"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start       - Iniciar todos os serviços"
    echo "  stop        - Parar todos os serviços"
    echo "  restart     - Reiniciar todos os serviços"
    echo "  build       - Fazer build de todos os serviços"
    echo "  logs        - Mostrar logs de todos os serviços"
    echo "  status      - Mostrar status dos serviços"
    echo "  clean       - Limpar containers e volumes (CUIDADO!)"
    echo "  reset       - Reset completo do banco de dados"
    echo "  test-data   - Inserir dados de teste"
    echo "  debug       - Executar script de debug"
    echo "  help        - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./docker-manager.sh start"
    echo "  ./docker-manager.sh logs server"
    echo "  ./docker-manager.sh status"
}

# Função para verificar se o Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker não está rodando. Inicie o Docker Desktop primeiro.${NC}"
        exit 1
    fi
}

# Função para iniciar serviços
start_services() {
    echo -e "${BLUE}🚀 Iniciando serviços...${NC}"
    check_docker
    
    # Iniciar banco de dados primeiro
    echo -e "${YELLOW}📊 Iniciando PostgreSQL...${NC}"
    docker-compose up -d postgres
    
    # Aguardar banco estar pronto
    echo -e "${YELLOW}⏳ Aguardando banco de dados estar pronto...${NC}"
    sleep 10
    
    # Iniciar outros serviços
    echo -e "${YELLOW}🔧 Iniciando servidor...${NC}"
    docker-compose up -d server
    
    echo -e "${YELLOW}🌐 Iniciando frontend...${NC}"
    docker-compose up -d web
    
    echo -e "${GREEN}✅ Todos os serviços iniciados!${NC}"
    show_status
}

# Função para parar serviços
stop_services() {
    echo -e "${BLUE}🛑 Parando serviços...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Serviços parados!${NC}"
}

# Função para reiniciar serviços
restart_services() {
    echo -e "${BLUE}🔄 Reiniciando serviços...${NC}"
    stop_services
    sleep 2
    start_services
}

# Função para fazer build
build_services() {
    echo -e "${BLUE}🔨 Fazendo build dos serviços...${NC}"
    check_docker
    
    # Build do servidor
    echo -e "${YELLOW}🔧 Build do servidor...${NC}"
    docker-compose build server
    
    # Build do frontend
    echo -e "${YELLOW}🌐 Build do frontend...${NC}"
    docker-compose build web
    
    echo -e "${GREEN}✅ Build concluído!${NC}"
}

# Função para mostrar logs
show_logs() {
    local service=${1:-""}
    
    if [ -z "$service" ]; then
        echo -e "${BLUE}📋 Logs de todos os serviços:${NC}"
        docker-compose logs -f
    else
        echo -e "${BLUE}📋 Logs do serviço $service:${NC}"
        docker-compose logs -f "$service"
    fi
}

# Função para mostrar status
show_status() {
    echo -e "${BLUE}📊 Status dos serviços:${NC}"
    docker-compose ps
    
    echo ""
    echo -e "${BLUE}🌐 URLs dos serviços:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:3001${NC}"
    echo -e "  PgAdmin:  ${GREEN}http://localhost:5050${NC}"
    echo -e "  Database: ${GREEN}localhost:5432${NC}"
}

# Função para limpar
clean_all() {
    echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá remover TODOS os containers e volumes!${NC}"
    read -p "Tem certeza? Digite 'sim' para confirmar: " confirm
    
    if [ "$confirm" = "sim" ]; then
        echo -e "${BLUE}🧹 Limpando tudo...${NC}"
        docker-compose down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Limpeza concluída!${NC}"
    else
        echo -e "${YELLOW}❌ Operação cancelada.${NC}"
    fi
}

# Função para reset do banco
reset_database() {
    echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá resetar o banco de dados!${NC}"
    read -p "Tem certeza? Digite 'sim' para confirmar: " confirm
    
    if [ "$confirm" = "sim" ]; then
        echo -e "${BLUE}🔄 Resetando banco de dados...${NC}"
        docker-compose down -v
        docker-compose up -d postgres
        sleep 10
        echo -e "${GREEN}✅ Banco resetado!${NC}"
    else
        echo -e "${YELLOW}❌ Operação cancelada.${NC}"
    fi
}

# Função para inserir dados de teste
insert_test_data() {
    echo -e "${BLUE}📝 Inserindo dados de teste...${NC}"
    
    # Verificar se o banco está rodando
    if ! docker-compose ps postgres | grep -q "Up"; then
        echo -e "${RED}❌ Banco de dados não está rodando. Execute 'start' primeiro.${NC}"
        return 1
    fi
    
    # Executar script SQL
    echo -e "${YELLOW}📊 Executando script de dados de teste...${NC}"
    docker-compose exec -T postgres psql -U frela_user -d frela_db < database/insert-test-data.sql
    
    echo -e "${GREEN}✅ Dados de teste inseridos!${NC}"
}

# Função para executar debug
run_debug() {
    echo -e "${BLUE}🔍 Executando script de debug...${NC}"
    
    # Verificar se o banco está rodando
    if ! docker-compose ps postgres | grep -q "Up"; then
        echo -e "${RED}❌ Banco de dados não está rodando. Execute 'start' primeiro.${NC}"
        return 1
    fi
    
    # Executar script de debug
    node check-events-debug.js
}

# Função principal
main() {
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_services
            ;;
        logs)
            show_logs "$2"
            ;;
        status)
            show_status
            ;;
        clean)
            clean_all
            ;;
        reset)
            reset_database
            ;;
        test-data)
            insert_test_data
            ;;
        debug)
            run_debug
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Executar função principal
main "$@"
