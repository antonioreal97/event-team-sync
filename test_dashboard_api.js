#!/usr/bin/env node

/**
 * Script para testar as APIs do Dashboard
 * Execute: node test_dashboard_api.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'SEU_TOKEN_JWT_AQUI'; // Substitua pelo token real

async function testDashboardAPI() {
  console.log('🧪 Testando APIs do Dashboard...\n');
  console.log('=' .repeat(60));

  try {
    // Teste 1: Health Check
    console.log('\n1️⃣ Testando Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check OK:', healthData.status);
    } else {
      console.log('❌ Health Check falhou:', healthResponse.status);
      const errorText = await healthResponse.text();
      console.log('   Erro:', errorText);
    }

    // Teste 2: Teams (sem token)
    console.log('\n2️⃣ Testando Teams sem autenticação...');
    const teamsNoAuthResponse = await fetch(`${BASE_URL}/api/teams`);
    if (teamsNoAuthResponse.status === 401) {
      console.log('✅ Autenticação requerida (401)');
    } else {
      console.log('⚠️ Status inesperado:', teamsNoAuthResponse.status);
      const responseText = await teamsNoAuthResponse.text();
      console.log('   Resposta:', responseText);
    }

    // Teste 3: Teams com token inválido
    console.log('\n3️⃣ Testando Teams com token inválido...');
    const teamsInvalidTokenResponse = await fetch(`${BASE_URL}/api/teams`, {
      headers: {
        'Authorization': 'Bearer token_invalido',
        'Content-Type': 'application/json'
      }
    });
    
    if (teamsInvalidTokenResponse.status === 401) {
      console.log('✅ Autenticação funcionando (token inválido rejeitado)');
    } else {
      console.log('⚠️ Status inesperado:', teamsInvalidTokenResponse.status);
    }

    // Teste 4: Active Freelancers (sem token)
    console.log('\n4️⃣ Testando Active Freelancers sem autenticação...');
    const activeFreelancersNoAuthResponse = await fetch(`${BASE_URL}/api/teams/active-freelancers`);
    if (activeFreelancersNoAuthResponse.status === 401) {
      console.log('✅ Autenticação requerida (401)');
    } else {
      console.log('⚠️ Status inesperado:', activeFreelancersNoAuthResponse.status);
    }

    // Teste 5: Event Confirmation Status (sem token)
    console.log('\n5️⃣ Testando Event Confirmation Status sem autenticação...');
    const eventConfirmationNoAuthResponse = await fetch(`${BASE_URL}/api/teams/event/test-event-id/confirmation-status`);
    if (eventConfirmationNoAuthResponse.status === 401) {
      console.log('✅ Autenticação requerida (401)');
    } else {
      console.log('⚠️ Status inesperado:', eventConfirmationNoAuthResponse.status);
    }

    // Teste 6: Verificar se as rotas existem
    console.log('\n6️⃣ Verificando se as rotas existem...');
    const routesToTest = [
      '/api/teams',
      '/api/teams/active-freelancers',
      '/api/teams/event/test-event-id/confirmation-status'
    ];

    for (const route of routesToTest) {
      try {
        const response = await fetch(`${BASE_URL}${route}`, {
          headers: {
            'Authorization': 'Bearer token_invalido',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          console.log(`✅ Rota ${route} existe e requer autenticação`);
        } else if (response.status === 404) {
          console.log(`❌ Rota ${route} não encontrada (404)`);
        } else {
          console.log(`⚠️ Rota ${route} retornou status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao testar rota ${route}:`, error.message);
      }
    }

    // Teste 7: Verificar logs do servidor
    console.log('\n7️⃣ Verificando logs do servidor...');
    console.log('💡 Verifique o terminal onde o servidor está rodando');
    console.log('   Procure por mensagens relacionadas a:');
    console.log('   - Rotas registradas');
    console.log('   - Erros de middleware');
    console.log('   - Problemas de autenticação');

  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUÇÃO: Servidor não está rodando');
      console.log('   Execute: npm run dev:server');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 SOLUÇÃO: URL incorreta');
      console.log('   Verifique se a URL está correta:', BASE_URL);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Teste concluído!');
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verifique se o servidor está rodando');
  console.log('2. Confirme que as rotas estão registradas em server/index.ts');
  console.log('3. Verifique se o middleware de autenticação está funcionando');
  console.log('4. Teste com um token JWT válido');
}

// Executar teste se for chamado diretamente
if (require.main === module) {
  testDashboardAPI();
}

module.exports = { testDashboardAPI };
