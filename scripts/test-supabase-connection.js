#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase
 * Execute: node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

console.log('🔗 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testando conexão básica...');
    
    // Teste 1: Verificar se consegue conectar
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Verificar tabelas existentes
    console.log('\n📋 Verificando tabelas...');
    
    const tables = [
      'users',
      'freelancer_profiles', 
      'events',
      'team_allocations',
      'attendance_records',
      'equipments',
      'equipment_allocations',
      'notifications',
      'freelancer_invites',
      'payment_records',
      'event_interests'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`⚠️  Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ${err.message}`);
      }
    }
    
    // Teste 3: Verificar usuário admin
    console.log('\n👤 Verificando usuário administrador...');
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@frela.com')
      .single();
    
    if (adminError) {
      console.log('⚠️  Usuário admin não encontrado:', adminError.message);
    } else {
      console.log('✅ Usuário admin encontrado:', adminUser.name);
    }
    
    // Teste 4: Verificar equipamentos
    console.log('\n🎥 Verificando equipamentos...');
    
    const { data: equipments, error: equipError } = await supabase
      .from('equipments')
      .select('count');
    
    if (equipError) {
      console.log('⚠️  Erro ao verificar equipamentos:', equipError.message);
    } else {
      console.log('✅ Equipamentos configurados');
    }
    
    console.log('\n🎉 Teste de conexão concluído!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    return false;
  }
}

// Executar teste
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ Supabase configurado corretamente!');
      console.log('🚀 Você pode agora usar o sistema com Supabase');
    } else {
      console.log('\n❌ Problemas encontrados na configuração');
      console.log('📖 Verifique o arquivo database/supabase-init.sql');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
