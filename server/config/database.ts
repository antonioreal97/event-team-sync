import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  user: process.env.DB_USER || 'frela_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'frela_db',
  password: process.env.DB_PASSWORD || 'frela_password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões ociosas
  connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão
};

// Pool de conexões
export const pool = new Pool(dbConfig);

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com PostgreSQL:', err);
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
