#!/usr/bin/env node

/**
 * Script para testar a API de Event Interest
 * Execute: node test_event_interest_api.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'SEU_TOKEN_JWT_AQUI'; // Substitua pelo token real

async function testEventInterestAPI() {
  console.log('🧪 Testando API de Event Interest...\n');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check OK:', healthData.status);
    } else {
      console.log('❌ Health Check falhou:', healthResponse.status);
    }

    // Teste 2: Event Interest (sem token)
    console.log('\n2️⃣ Testando Event Interest sem autenticação...');
    const noAuthResponse = await fetch(`${BASE_URL}/api/event-interest`);
    if (noAuthResponse.status === 401) {
      console.log('✅ Autenticação requerida (401)');
    } else {
      console.log('❌ Autenticação não está funcionando:', noAuthResponse.status);
    }

    // Teste 3: Event Interest (com token)
    if (TEST_TOKEN !== 'SEU_TOKEN_JWT_AQUI') {
      console.log('\n3️⃣ Testando Event Interest com autenticação...');
      const authResponse = await fetch(`${BASE_URL}/api/event-interest`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (authResponse.ok) {
        const data = await authResponse.json();
        console.log('✅ API funcionando:', data);
      } else {
        const errorData = await authResponse.text();
        console.log('❌ Erro na API:', authResponse.status, errorData);
      }
    } else {
      console.log('\n3️⃣ ⚠️ Token não configurado - pulando teste de autenticação');
    }

    // Teste 4: Verificar se a tabela existe (via erro)
    console.log('\n4️⃣ Verificando se a tabela existe...');
    const tableTestResponse = await fetch(`${BASE_URL}/api/event-interest`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN !== 'SEU_TOKEN_JWT_AQUI' ? TEST_TOKEN : 'invalid'}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (tableTestResponse.status === 500) {
      console.log('❌ Erro 500 - Provavelmente a tabela não existe');
      console.log('💡 Execute: psql -U seu_usuario -d seu_banco -f database/create_event_interest_table_simple.sql');
    } else if (tableTestResponse.status === 401) {
      console.log('✅ Autenticação funcionando (token inválido)');
    } else {
      console.log('⚠️ Status inesperado:', tableTestResponse.status);
    }

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Servidor não está rodando. Execute: npm run dev:server');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Verifique se a URL está correta:', BASE_URL);
    }
  }
}

// Função para mostrar instruções
function showInstructions() {
  console.log(`
📋 INSTRUÇÕES DE USO:

1. Configure o token JWT válido na variável TEST_TOKEN
2. Certifique-se de que o servidor está rodando (npm run dev:server)
3. Execute: node test_event_interest_api.js

🔧 PARA RESOLVER ERRO 500:

1. Conecte ao banco PostgreSQL:
   psql -U seu_usuario -d seu_banco

2. Execute o script de criação:
   \\i database/create_event_interest_table_simple.sql

3. Verifique se a tabela foi criada:
   \\i database/check_event_interest_table.sql

4. Reinicie o servidor

📁 ARQUIVOS IMPORTANTES:
- database/create_event_interest_table_simple.sql
- database/check_event_interest_table.sql
- SOLUCAO_ERRO_500.md
`);
}

// Executar teste se for chamado diretamente
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showInstructions();
  } else {
    testEventInterestAPI();
  }
}

module.exports = { testEventInterestAPI };
