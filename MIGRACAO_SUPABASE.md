# 🚀 Migração para Supabase

Este guia explica como migrar o sistema FRELA de PostgreSQL local para Supabase.

## 📋 Pré-requisitos

1. Conta no Supabase (gratuita): https://supabase.com
2. Node.js instalado
3. Projeto FRELA configurado

## 🔧 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Escolha sua organização
4. Configure:
   - **Name**: `frela-team-sync`
   - **Database Password**: (anote esta senha!)
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
5. Clique em "Create new project"

### 2. Obter Credenciais

No painel do Supabase, vá em **Settings > API**:

- **Project URL**: `https://seu-projeto.supabase.co`
- **anon public**: Chave pública (para frontend)
- **service_role**: Chave privada (para backend) ⚠️ **MANTENHA SECRETA**

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
cp config.supabase.env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
USE_SUPABASE=true
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Executar Schema no Supabase

1. No painel do Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo do arquivo `database/supabase-init.sql`
3. Cole no editor SQL
4. Clique em **Run** para executar

### 5. Testar Conexão

Execute o script de teste:
```bash
node test-supabase-connection.js
```

Se tudo estiver correto, você verá:
```
✅ Conexão estabelecida com sucesso!
✅ Tabela users: OK
✅ Tabela events: OK
...
🎉 Teste de conexão concluído!
```

### 6. Iniciar Aplicação

```bash
npm run server:dev
```

## 🔄 Alternando entre Local e Supabase

### Para usar PostgreSQL local:
```env
USE_SUPABASE=false
```

### Para usar Supabase:
```env
USE_SUPABASE=true
```

## 📊 Vantagens do Supabase

### ✅ Benefícios
- **Gerenciado**: Sem necessidade de manter servidor
- **Escalável**: Cresce automaticamente
- **Backup automático**: Dados sempre seguros
- **APIs automáticas**: REST e GraphQL gerados automaticamente
- **Real-time**: Atualizações em tempo real
- **Autenticação**: Sistema de auth integrado
- **Dashboard**: Interface visual para gerenciar dados

### 🆓 Plano Gratuito
- 500MB de armazenamento
- 2GB de transferência
- 50MB de upload de arquivos
- 2 projetos simultâneos

## 🔒 Segurança

### Row Level Security (RLS)
O Supabase inclui políticas de segurança configuradas:
- Usuários só veem seus próprios dados
- Gestores têm acesso completo
- APIs protegidas automaticamente

### Chaves de API
- **anon key**: Para operações do frontend (pública)
- **service_role key**: Para operações do backend (privada)

## 🚨 Troubleshooting

### Erro de Conexão
```
❌ Erro na conexão: Invalid API key
```
**Solução**: Verifique se as chaves estão corretas no `.env`

### Tabela não encontrada
```
⚠️ Tabela users: relation "users" does not exist
```
**Solução**: Execute o script `database/supabase-init.sql` no SQL Editor

### SSL Error
```
❌ SSL connection error
```
**Solução**: O Supabase requer SSL. A configuração já inclui `ssl: { rejectUnauthorized: false }`

## 📈 Próximos Passos

Após a migração bem-sucedida, você pode:

1. **Usar APIs automáticas**: Acesse dados via REST/GraphQL
2. **Implementar Real-time**: Notificações em tempo real
3. **Usar Storage**: Upload de arquivos (fotos, documentos)
4. **Autenticação avançada**: Login social, 2FA, etc.

## 🆘 Suporte

- **Documentação Supabase**: https://supabase.com/docs
- **Comunidade**: https://github.com/supabase/supabase/discussions
- **Status**: https://status.supabase.com

---

**🎉 Parabéns!** Seu sistema FRELA agora está rodando no Supabase!


