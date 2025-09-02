const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'frela_db',
  user: 'frela_user',
  password: 'frela_password'
});

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado do banco de dados...\n');
    
    // 1. Verificar usuários
    console.log('1. Usuários no sistema:');
    const users = await pool.query('SELECT id, name, email, role, is_active FROM users ORDER BY role, name');
    console.table(users.rows);
    
    // 2. Verificar eventos
    console.log('\n2. Eventos no sistema:');
    const events = await pool.query('SELECT id, title, status, start_date, end_date, created_by FROM events ORDER BY start_date DESC');
    console.table(events.rows);
    
    // 3. Verificar alocações de equipe
    console.log('\n3. Alocações de equipe:');
    const allocations = await pool.query(`
      SELECT 
        ta.id,
        ta.event_id,
        ta.user_id,
        ta.assigned_role,
        ta.status,
        e.title as event_title,
        u.name as user_name
      FROM team_allocations ta
      LEFT JOIN events e ON ta.event_id = e.id
      LEFT JOIN users u ON ta.user_id = u.id
      ORDER BY ta.created_at DESC
    `);
    console.table(allocations.rows);
    
    // 4. Verificar perfis de freelancer
    console.log('\n4. Perfis de freelancer:');
    const profiles = await pool.query(`
      SELECT 
        fp.id,
        fp.user_id,
        fp.team_type,
        fp.experience_level,
        u.name as user_name,
        u.email as user_email
      FROM freelancer_profiles fp
      LEFT JOIN users u ON fp.user_id = u.id
      ORDER BY fp.team_type, u.name
    `);
    console.table(profiles.rows);
    
    // 5. Verificar se há eventos disponíveis para freelancers
    console.log('\n5. Eventos disponíveis para freelancers:');
    const availableEvents = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.status,
        e.start_date,
        e.end_date,
        e.team_priority,
        e.allow_team_b
      FROM events e
      WHERE e.status IN ('planning', 'confirmed')
      ORDER BY e.start_date ASC
    `);
    console.table(availableEvents.rows);
    
    // 6. Verificar freelancers sem alocações
    console.log('\n6. Freelancers sem alocações ativas:');
    const freelancersWithoutAllocations = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        fp.team_type,
        fp.experience_level
      FROM users u
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      LEFT JOIN team_allocations ta ON u.id = ta.user_id AND ta.status IN ('pending', 'confirmed')
      WHERE u.role = 'freelancer' 
        AND u.is_active = true
        AND ta.id IS NULL
      ORDER BY fp.team_type, u.name
    `);
    console.table(freelancersWithoutAllocations.rows);
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
