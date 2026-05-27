const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'frela_db',
  password: 'postgres',
  port: 5432,
});

async function checkTable() {
  try {
    // Verificar se a tabela existe
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_interest_confirmations'
      );
    `);
    
    console.log('Tabela event_interest_confirmations existe:', result.rows[0].exists);
    
    if (result.rows[0].exists) {
      // Verificar estrutura da tabela
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'event_interest_confirmations'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nEstrutura da tabela:');
      console.table(structure.rows);
      
      // Verificar se há dados
      const count = await pool.query('SELECT COUNT(*) FROM event_interest_confirmations');
      console.log('\nNúmero de registros:', count.rows[0].count);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkTable();
