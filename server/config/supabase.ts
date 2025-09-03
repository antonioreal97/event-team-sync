import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Para operações do servidor
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Para operações do cliente

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente do Supabase para operações do servidor (com privilégios elevados)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente do Supabase para operações do cliente (com privilégios limitados)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey);

// Função para testar conexão
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao testar conexão Supabase:', error);
      return false;
    }
    
    console.log('✅ Conectado ao Supabase com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão Supabase:', error);
    return false;
  }
};

// Função para executar queries SQL diretas (quando necessário)
export const executeSQL = async (query: string, params?: any[]) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      query, 
      params: params || [] 
    });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
    throw error;
  }
};

// Função para migrar dados (se necessário)
export const migrateData = async () => {
  console.log('🔄 Iniciando migração de dados para Supabase...');
  
  try {
    // Aqui você pode adicionar lógica para migrar dados existentes
    // Por exemplo, se você tiver dados em um banco local
    
    console.log('✅ Migração de dados concluída');
    return true;
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    return false;
  }
};
