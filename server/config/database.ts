import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Verificar se está usando Supabase ou PostgreSQL local
const useSupabase = process.env.USE_SUPABASE === 'true';

let dbConfig: PoolConfig;

if (useSupabase) {
  // Configuração para Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL não configurada');
  }
  
  // Extrair informações da URL do Supabase
  const url = new URL(supabaseUrl);
  const [user, password] = url.username.split(':');
  
  dbConfig = {
    user: user,
    host: url.hostname,
    database: url.pathname.substring(1), // Remove a barra inicial
    password: password,
    port: parseInt(url.port || '5432'),
    ssl: { rejectUnauthorized: false }, // Necessário para Supabase
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  
  console.log('🔗 Configurado para usar Supabase');
} else {
  // Configuração para PostgreSQL local
  dbConfig = {
    user: process.env.DB_USER || 'frela_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'frela_db',
    password: process.env.DB_PASSWORD || 'frela_password',
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  
  console.log('🔗 Configurado para usar PostgreSQL local');
}

// Pool de conexões
export const pool = new Pool(dbConfig);

// Testar conexão
pool.on('connect', () => {
  if (useSupabase) {
    console.log('✅ Conectado ao Supabase');
  } else {
    console.log('✅ Conectado ao banco PostgreSQL local');
  }
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

// Função para testar conexão
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Teste de conexão bem-sucedido:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
};

// Função para fechar pool (usar em shutdown)
export const closePool = async () => {
  await pool.end();
  console.log('🔌 Pool de conexões fechado');
};

// Exportar configuração para uso em outros módulos
export { useSupabase, dbConfig };
