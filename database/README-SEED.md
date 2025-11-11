# Arquivo Seed - Dados de Teste

Este arquivo contém dados de exemplo para popular o banco de dados durante o desenvolvimento e testes.

## ⚠️ IMPORTANTE
**Este arquivo deve ser REMOVIDO em produção!**

## Como Usar

### Opção 1: Via psql (PostgreSQL CLI)
```bash
psql -U seu_usuario -d seu_banco -f database/seed-data.sql
```

### Opção 2: Via Supabase SQL Editor
1. Acesse o Dashboard do Supabase
2. Vá em "SQL Editor"
3. Abra o arquivo `database/seed-data.sql`
4. Copie e cole o conteúdo
5. Execute o SQL

### Opção 3: Via pgAdmin ou DBeaver
1. Conecte-se ao banco de dados
2. Abra o arquivo SQL
3. Execute o script

## Dados Incluídos

### 👥 Usuários (7 usuários)
- **1 Administrador**
  - Email: admin@frela.com
  - Senha: admin123
  
- **1 Líder Freelancer**
  - Email: lider@frela.com
  - Senha: lider123
  
- **5 Freelancers**
  - joao@frela.com (Equipe A) - Senha: freelancer123
  - ana@frela.com (Equipe A) - Senha: freelancer123
  - lucas@frela.com (Equipe B) - Senha: freelancer123
  - fernanda@frela.com (Equipe B) - Senha: freelancer123
  - roberto@frela.com (Sem Equipe) - Senha: freelancer123

### 📦 Equipamentos (14 itens)
- **Câmeras**: Sony A7S III, Canon C300 Mark III, Blackmagic Pocket 6K
- **Iluminação**: Aputure 300d II, Godox SL-60W, Softboxes
- **Áudio**: Rode NTG3, Zoom H6, Sennheiser wireless
- **Suportes**: Tripés profissionais, C-Stands
- **Monitores**: SmallHD, Atomos Ninja V

### 📅 Eventos (4 eventos)
1. **Congresso de Tecnologia 2025** (em planejamento - 30 dias no futuro)
2. **Lançamento de Produto** (em planejamento - 15 dias no futuro)
3. **Workshop de Fotografia** (confirmado - 7 dias no futuro)
4. **Festival de Música Indie** (concluído - 10 dias atrás)

### 📋 Outros Dados
- **Interesses em eventos**: 6 registros de interesse
- **Alocações de equipe**: 5 alocações
- **Registros de presença**: 9 registros
- **Pagamentos**: 3 registros
- **Notificações**: 5 notificações
- **Alocações de equipamentos**: 2 alocações

## Cenários de Teste

### 1. Teste de Escalação
- Entre como admin@frela.com
- Acesse "Escalação de Equipe"
- Visualize os interesses no "Congresso de Tecnologia 2025"
- Faça a escalação da equipe

### 2. Teste de Interesse
- Entre como joao@frela.com
- Visualize os eventos disponíveis
- Confirme interesse em um evento

### 3. Teste de Presença
- Entre como admin@frela.com
- Acesse o evento "Workshop de Fotografia"
- Registre a presença dos freelancers escalados

### 4. Teste de Pagamentos
- Entre como admin@frela.com
- Visualize os pagamentos pendentes
- Confirme pagamentos

### 5. Teste de Líder Freelancer
- Entre como lider@frela.com
- Visualize seus eventos
- Acesse o checklist de equipamentos

## Limpeza de Dados

O script já inclui um `TRUNCATE TABLE` no início que limpa todos os dados existentes antes de inserir os novos. 

**Atenção**: Isso apagará TODOS os dados das tabelas!

Se você quiser manter alguns dados existentes, comente a seção de TRUNCATE no arquivo SQL:

```sql
-- TRUNCATE TABLE 
--   attendance_records,
--   payment_records,
--   ...
-- CASCADE;
```

## Verificação

Após executar o script, você verá um resumo dos dados inseridos e as credenciais de acesso.

## Removendo em Produção

Antes de fazer o deploy em produção:

1. Delete o arquivo `database/seed-data.sql`
2. Delete este README
3. Certifique-se de que nenhum script de deploy executa o seed

## Suporte

Se encontrar problemas ao executar o seed:

1. Verifique se todas as tabelas foram criadas corretamente
2. Verifique as constraints e foreign keys
3. Execute o script linha por linha para identificar o problema
4. Verifique os logs de erro do PostgreSQL
