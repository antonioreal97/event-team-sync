#!/usr/bin/env node

/**
 * Script para testar a rota /api/teams/active-freelancers
 * Execute: node test_active_freelancers.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testActiveFreelancers() {
  console.log('🧪 Testando rota /api/teams/active-freelancers...\n');
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
      return;
    }

    // Teste 2: Active Freelancers sem token
    console.log('\n2️⃣ Testando Active Freelancers sem autenticação...');
    const noAuthResponse = await fetch(`${BASE_URL}/api/teams/active-freelancers`);
    if (noAuthResponse.status === 401) {
      console.log('✅ Autenticação requerida (401)');
    } else {
      console.log('⚠️ Status inesperado:', noAuthResponse.status);
      const responseText = await noAuthResponse.text();
      console.log('   Resposta:', responseText);
    }

    // Teste 3: Active Freelancers com token inválido
    console.log('\n3️⃣ Testando Active Freelancers com token inválido...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/teams/active-freelancers`, {
      headers: {
        'Authorization': 'Bearer token_invalido',
        'Content-Type': 'application/json'
      }
    });
    
    if (invalidTokenResponse.status === 401) {
      console.log('✅ Autenticação funcionando (token inválido rejeitado)');
    } else {
      console.log('⚠️ Status inesperado:', invalidTokenResponse.status);
      const responseText = await invalidTokenResponse.text();
      console.log('   Resposta:', responseText);
    }

    // Teste 4: Verificar estrutura da resposta
    console.log('\n4️⃣ Verificando estrutura da resposta...');
    console.log('💡 A rota deve retornar 401 (não autenticado) ou 500 (erro interno)');
    console.log('   Se retornar 500, há um problema na implementação da rota');

    // Teste 5: Verificar logs do servidor
    console.log('\n5️⃣ Verificando logs do servidor...');
    console.log('💡 No terminal onde o servidor está rodando, procure por:');
    console.log('   - "Erro ao buscar freelancers ativos:"');
    console.log('   - Detalhes do erro SQL');
    console.log('   - Stack trace completo');

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
  console.log('2. Confirme que a rota está registrada em server/index.ts');
  console.log('3. Verifique os logs do servidor para detalhes do erro 500');
  console.log('4. Teste com um token JWT válido após resolver o erro');
}

// Executar teste se for chamado diretamente
if (require.main === module) {
  testActiveFreelancers();
}

module.exports = { testActiveFreelancers };
