# Validações de Formulário - Frontend

## Campos Obrigatórios

### 1. Nome Completo (*)
- **Obrigatório**: Sim
- **Validações**:
  - Não pode estar vazio
  - Mínimo: 2 caracteres
  - Máximo: 255 caracteres
  - Apenas letras e espaços (incluindo acentos)
  - Não pode conter números

### 2. Email (*)
- **Obrigatório**: Sim
- **Validações**:
  - Não pode estar vazio
  - Máximo: 255 caracteres
  - Formato válido de email
  - Não pode conter espaços
  - Apenas caracteres válidos: a-z, A-Z, 0-9, @, ., _, -

### 3. Senha (*)
- **Obrigatório**: Sim
- **Validações**:
  - Não pode estar vazia
  - Mínimo: 6 caracteres
  - Máximo: 100 caracteres
  - Deve conter pelo menos uma letra
  - Deve conter pelo menos um número
  - Não pode conter espaços
  - Caracteres especiais permitidos: !@#$%^&*()_+-=[]{}|;':",./<>?

### 4. Tipo de Equipe (*)
- **Obrigatório**: Sim
- **Validações**:
  - Deve ser selecionado
  - Valores válidos: 'equipe_a' ou 'equipe_b'

## Campos Opcionais com Validação

### 5. CPF
- **Obrigatório**: Não
- **Validações** (quando preenchido):
  - Deve conter 11 dígitos (após remoção de caracteres especiais)
  - Não pode ser todos os dígitos iguais
  - Máximo: 14 caracteres (incluindo formatação)

### 6. Telefone
- **Obrigatório**: Não
- **Validações** (quando preenchido):
  - Deve ter 10 ou 11 dígitos (após remoção de caracteres especiais)
  - Máximo: 20 caracteres (incluindo formatação)

## Funcionalidades de Validação

### Validação em Tempo Real
- Os campos são validados conforme o usuário digita
- Erros são exibidos imediatamente abaixo de cada campo
- Bordas dos campos ficam vermelhas quando há erro

### Indicador de Progresso
- Mostra no topo do formulário se todos os campos obrigatórios estão preenchidos
- Verde: ✓ Todos preenchidos
- Vermelho: ⚠ Preencha todos os campos

### Botão de Cadastro
- Fica desabilitado até que todos os campos obrigatórios sejam preenchidos corretamente
- Texto muda para "Preencha os campos obrigatórios" quando inválido
- Texto volta para "Cadastrar Freelancer" quando válido

### Tratamento de Erros do Servidor
- Captura erros específicos retornados pelo backend
- Exibe mensagens de erro claras e em português
- Duração dos toasts de erro: 5 segundos

## Estados de Validação

### fieldErrors
- Objeto que armazena erros de cada campo
- Chave: nome do campo
- Valor: mensagem de erro

### isFormValid
- Boolean que indica se o formulário está válido
- True: todos os campos obrigatórios estão corretos
- False: há pelo menos um campo com erro

## Limpeza Automática

### Ao Abrir o Dialog
- Limpa todos os erros anteriores
- Reseta estado de validação

### Ao Fechar o Dialog
- Limpa formulário
- Limpa todos os erros
- Reseta estado de validação

## Exemplos de Mensagens de Erro

### Nome
- "Nome é obrigatório"
- "Nome deve ter pelo menos 2 caracteres"
- "Nome deve ter no máximo 255 caracteres"
- "Nome deve conter apenas letras e espaços"

### Email
- "Email é obrigatório"
- "Email deve ter no máximo 255 caracteres"
- "Email não pode conter espaços"
- "Formato de email inválido"

### Senha
- "Senha é obrigatória"
- "Senha deve ter pelo menos 6 caracteres"
- "Senha deve ter no máximo 100 caracteres"
- "Senha não pode conter espaços"
- "Senha deve conter pelo menos uma letra e um número"

### Tipo de Equipe
- "Tipo de equipe é obrigatório"
- "Tipo de equipe deve ser 'Equipe A' ou 'Equipe B'"

### CPF
- "CPF deve conter 11 dígitos"
- "CPF inválido"

### Telefone
- "Telefone deve ter 10 ou 11 dígitos"
