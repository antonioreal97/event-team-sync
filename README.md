# Equipe S4U

Sistema de gerenciamento de equipes para eventos audiovisuais com priorização de equipes e gestão de freelancers.

## 🚀 **Status do Projeto**

✅ **Sistema Conectado ao PostgreSQL** - Migração completa de mock data para banco real  
✅ **Backend API Funcional** - Todas as rotas implementadas e funcionando  
✅ **Frontend Atualizado** - Serviços conectados à API real  
✅ **Sistema de Autenticação** - JWT implementado e funcionando  
✅ **Banco de Dados Limpo** - Sistema iniciando sem dados de teste  

## 🏗️ **Arquitetura**

### **Frontend**
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **React Router DOM** para navegação
- **Context API** para gerenciamento de estado

### **Backend**
- **Node.js** com TypeScript
- **Express.js** para API REST
- **PostgreSQL** como banco de dados principal
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **Docker** para containerização

### **Banco de Dados**
- **PostgreSQL 15** rodando em container Docker
- **PgAdmin** para administração do banco
- **Scripts de inicialização** automáticos

## 🛠️ **Instalação e Configuração**

### **Pré-requisitos**
- Docker e Docker Compose
- Node.js 18+
- npm ou yarn

### **1. Clone o repositório**
```bash
git clone <repository-url>
cd equipe-s4u
```

### **2. Configure as variáveis de ambiente**
```bash
cp config.env.example config.env
# Edite config.env com suas configurações
```

### **3. Inicie o banco de dados**
```bash
docker-compose up -d postgres pgadmin
```

### **4. Instale as dependências**
```bash
npm install
```

### **5. Inicie o backend**
```bash
npm run server:dev
```

### **6. Inicie o frontend**
```bash
npm run dev
```

## 🌐 **URLs da Aplicação**

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **PgAdmin**: http://localhost:5050

## 🔐 **Credenciais de Acesso**

### **Usuário Admin**
- **Email**: admin@frela.com
- **Senha**: admin123
- **Role**: gestor

### **Banco de Dados**
- **Host**: localhost
- **Port**: 5432
- **Database**: frela_db
- **Username**: frela_user
- **Password**: frela_password

### **PgAdmin**
- **Email**: admin@admin.com
- **Senha**: root

## 📊 **Funcionalidades Implementadas**

### **✅ Sistema de Autenticação**
- Login/logout com JWT
- Proteção de rotas
- Gerenciamento de sessão

### **✅ Gestão de Usuários**
- Criação de freelancers
- Atribuição de equipes
- Perfis completos com experiência

### **✅ Gestão de Eventos**
- Criação e edição de eventos
- Tipos de evento (normal/especial)
- Priorização de equipes
- Sistema de diárias

### **✅ Gestão de Equipes**
- Equipe A (prioridade máxima)
- Equipe B (suporte)
- Atribuição dinâmica de usuários

### **✅ Sistema de Pagamentos**
- Cálculo automático de diárias
- Confirmação de presença
- Histórico de pagamentos

### **✅ Gestão de Equipamentos**
- Cadastro de equipamentos
- Alocação para eventos
- Controle de manutenção

### **✅ Sistema de Notificações**
- Notificações em tempo real
- Diferentes tipos e prioridades
- Histórico de notificações

## 🔧 **Estrutura do Projeto**

```
equipe-s4u/
├── src/
│   ├── components/          # Componentes React
│   ├── contexts/            # Contextos (Auth, etc.)
│   ├── hooks/               # Hooks customizados
│   ├── pages/               # Páginas da aplicação
│   ├── services/            # Serviços de API
│   ├── types/               # Definições de tipos TypeScript
│   ├── utils/               # Utilitários e helpers
│   └── config/              # Configurações
├── server/                  # Backend Node.js
│   ├── routes/              # Rotas da API
│   ├── middleware/          # Middlewares
│   └── config/              # Configurações do servidor
├── database/                # Scripts SQL
└── docker-compose.yml       # Configuração Docker
```

## 📡 **API Endpoints**

### **Autenticação**
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `GET /api/auth/verify` - Verificar token

### **Usuários**
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `PATCH /api/users/:id/team` - Atualizar equipe

### **Eventos**
- `GET /api/events` - Listar eventos
- `POST /api/events` - Criar evento
- `PUT /api/events/:id` - Atualizar evento
- `DELETE /api/events/:id` - Deletar evento

### **Equipes**
- `GET /api/teams` - Informações das equipes
- `POST /api/teams/allocate` - Alocar usuário
- `POST /api/teams/attendance/:id` - Atualizar presença

## 🎯 **Próximos Passos**

### **🔄 Funcionalidades em Desenvolvimento**
- [ ] Sistema de convites por email
- [ ] Relatórios avançados
- [ ] Dashboard de métricas
- [ ] Sistema de backup automático

### **🚀 Melhorias Planejadas**
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Integração com calendários
- [ ] API para aplicações móveis

## 🐛 **Solução de Problemas**

### **Problema: Erro de CORS**
```bash
# Verificar se o backend está rodando na porta 3000
curl http://localhost:3000/api/health
```

### **Problema: Banco não conecta**
```bash
# Verificar se o Docker está rodando
docker ps

# Reiniciar containers
docker-compose down && docker-compose up -d
```

### **Problema: Dependências não instaladas**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 **Equipe**

- **Desenvolvedor**: [Seu Nome]
- **Email**: [seu-email@exemplo.com]
- **LinkedIn**: [seu-linkedin]

## 📞 **Suporte**

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato via email
- Consulte a documentação da API

---

**Equipe S4U** - Gerenciando equipes audiovisuais com eficiência! 🎬✨
