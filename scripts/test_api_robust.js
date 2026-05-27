#!/usr/bin/env node

/**
 * Script robusto para testar a API de Event Interest
 * Execute: node test_api_robust.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'SEU_TOKEN_JWT_AQUI'; // Substitua pelo token real

async function testAPI() {
  console.log('🧪 Teste Robusto da API de Event Interest\n');
  console.log('=' .repeat(60));

  try {
    // Teste 1: Health Check
    console.log('\n1️⃣ Testando Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check OK:', healthData.status);
      console.log('   Timestamp:', healthData.timestamp);
      console.log('   Ambiente:', healthData.environment);
    } else {
      console.log('❌ Health Check falhou:', healthResponse.status);
      const errorText = await healthResponse.text();
      console.log('   Erro:', errorText);
    }

    // Teste 2: Verificar se servidor está rodando
    console.log('\n2️⃣ Verificando se servidor está rodando...');
    try {
      const serverTest = await fetch(`${BASE_URL}/api/health`, { timeout: 5000 });
      if (serverTest.ok) {
        console.log('✅ Servidor está rodando e respondendo');
      } else {
        console.log('⚠️ Servidor respondeu mas com erro:', serverTest.status);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Servidor não está rodando');
        console.log('💡 Execute: npm run dev:server');
        return;
      } else if (error.code === 'ENOTFOUND') {
        console.log('❌ URL não encontrada');
        console.log('💡 Verifique se a URL está correta:', BASE_URL);
        return;
      } else {
        console.log('❌ Erro de conexão:', error.message);
        return;
      }
    }

    // Teste 3: Event Interest sem autenticação
    console.log('\n3️⃣ Testando Event Interest sem autenticação...');
    try {
      const noAuthResponse = await fetch(`${BASE_URL}/api/event-interest`, { timeout: 10000 });
      if (noAuthResponse.status === 401) {
        console.log('✅ Autenticação requerida (401) - Funcionando corretamente');
      } else if (noAuthResponse.status === 500) {
        console.log('❌ Erro 500 - Problema no servidor');
        const errorText = await noAuthResponse.text();
        console.log('   Detalhes do erro:', errorText);
      } else {
        console.log('⚠️ Status inesperado:', noAuthResponse.status);
        const responseText = await noAuthResponse.text();
        console.log('   Resposta:', responseText);
      }
    } catch (error) {
      console.log('❌ Erro ao testar sem autenticação:', error.message);
    }

    // Teste 4: Event Interest com token inválido
    console.log('\n4️⃣ Testando Event Interest com token inválido...');
    try {
      const invalidTokenResponse = await fetch(`${BASE_URL}/api/event-interest`, {
        headers: {
          'Authorization': 'Bearer token_invalido',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (invalidTokenResponse.status === 401) {
        console.log('✅ Autenticação funcionando (token inválido rejeitado)');
      } else if (invalidTokenResponse.status === 500) {
        console.log('❌ Erro 500 - Problema no servidor');
        const errorText = await invalidTokenResponse.text();
        console.log('   Detalhes do erro:', errorText);
      } else {
        console.log('⚠️ Status inesperado:', invalidTokenResponse.status);
      }
    } catch (error) {
      console.log('❌ Erro ao testar com token inválido:', error.message);
    }

    // Teste 5: Verificar logs do servidor
    console.log('\n5️⃣ Verificando logs do servidor...');
    console.log('💡 Verifique o terminal onde o servidor está rodando');
    console.log('   Procure por mensagens de erro relacionadas a:');
    console.log('   - Conexão com banco de dados');
    console.log('   - Tabelas não encontradas');
    console.log('   - Erros de sintaxe SQL');

    // Teste 6: Verificar banco de dados
    console.log('\n6️⃣ Verificando banco de dados...');
    console.log('💡 Execute no PostgreSQL:');
    console.log('   psql -U seu_usuario -d seu_banco');
    console.log('   \\dt event_interest_confirmations');
    console.log('   SELECT COUNT(*) FROM event_interest_confirmations;');

    // Teste 7: Solução recomendada
    console.log('\n7️⃣ Solução Recomendada...');
    console.log('🔧 Execute estes comandos para resolver:');
    console.log('');
    console.log('   1. Conectar ao banco:');
    console.log('      psql -U seu_usuario -d seu_banco');
    console.log('');
    console.log('   2. Executar script de criação:');
    console.log('      \\i database/create_event_interest_table_simple.sql');
    console.log('');
    console.log('   3. Verificar se foi criada:');
    console.log('      \\d event_interest_confirmations');
    console.log('');
    console.log('   4. Reiniciar servidor:');
    console.log('      npm run dev:server');

  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUÇÃO: Servidor não está rodando');
      console.log('   Execute: npm run dev:server');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 SOLUÇÃO: URL incorreta');
      console.log('   Verifique se a URL está correta:', BASE_URL);
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 SOLUÇÃO: Timeout na conexão');
      console.log('   Verifique se o servidor está respondendo');
    } else {
      console.log('\n💡 SOLUÇÃO: Erro desconhecido');
      console.log('   Verifique os logs do servidor');
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Teste concluído!');
}

// Função para mostrar instruções detalhadas
function showDetailedInstructions() {
  console.log(`
📋 INSTRUÇÕES DETALHADAS DE USO:

1. Configure o token JWT válido na variável TEST_TOKEN
2. Certifique-se de que o servidor está rodando (npm run dev:server)
3. Execute: node test_api_robust.js

🔧 DIAGNÓSTICO COMPLETO:

1. Verificar se servidor está rodando
2. Testar health check
3. Verificar autenticação
4. Identificar erros específicos
5. Verificar logs do servidor
6. Verificar banco de dados

🚨 PROBLEMAS COMUNS:

- Erro 500: Tabela não existe no banco
- ECONNREFUSED: Servidor não está rodando
- ENOTFOUND: URL incorreta
- ETIMEDOUT: Servidor lento ou sobrecarregado

📁 ARQUIVOS IMPORTANTES:
- database/create_event_interest_table_simple.sql
- database/check_event_interest_table.sql
- SOLUCAO_ERRO_500.md
- RESUMO_SOLUCAO_ERRO_500.md

💡 DICA: Execute o teste e siga as instruções específicas que aparecerem
`);
}

// Executar teste se for chamado diretamente
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showDetailedInstructions();
  } else {
    testAPI();
  }
}

module.exports = { testAPI };
