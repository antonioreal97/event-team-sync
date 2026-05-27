const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'frela_user',
  host: 'localhost',
  database: 'frela_db',
  password: 'frela_password',
  port: 5432,
});

async function debugEvents() {
  try {
    console.log('🔍 Iniciando debug dos eventos...\n');

    // 1. Verificar se o banco está conectado
    console.log('1. Testando conexão com o banco...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso\n');

    // 2. Verificar usuários existentes
    console.log('2. Verificando usuários...');
    const usersResult = await client.query('SELECT id, name, email, role FROM users ORDER BY created_at');
    console.log(`Total de usuários: ${usersResult.rows.length}`);
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    // 3. Verificar eventos existentes
    console.log('3. Verificando eventos...');
    const eventsResult = await client.query('SELECT id, title, status, start_date FROM events ORDER BY created_at');
    console.log(`Total de eventos: ${eventsResult.rows.length}`);
    eventsResult.rows.forEach(event => {
      console.log(`  - ${event.title} (${event.status}) - ${event.start_date}`);
    });
    console.log('');

    // 4. Verificar alocações de equipe
    console.log('4. Verificando alocações de equipe...');
    const allocationsResult = await client.query(`
      SELECT 
        ta.id,
        ta.event_id,
        ta.user_id,
        ta.assigned_role,
        ta.status,
        e.title as event_title,
        u.name as user_name
      FROM team_allocations ta
      INNER JOIN events e ON ta.event_id = e.id
      INNER JOIN users u ON ta.user_id = u.id
      ORDER BY ta.created_at
    `);
    console.log(`Total de alocações: ${allocationsResult.rows.length}`);
    allocationsResult.rows.forEach(allocation => {
      console.log(`  - ${allocation.user_name} como ${allocation.assigned_role} em "${allocation.event_title}" (${allocation.status})`);
    });
    console.log('');

    // 5. Testar consulta específica para freelancer
    console.log('5. Testando consulta para freelancer...');
    const freelancerId = '550e8400-e29b-41d4-a716-446655440001';
    
    // Verificar se o freelancer existe
    const freelancerResult = await client.query('SELECT id, name, role FROM users WHERE id = $1', [freelancerId]);
    if (freelancerResult.rows.length === 0) {
      console.log('❌ Freelancer de teste não encontrado!');
    } else {
      const freelancer = freelancerResult.rows[0];
      console.log(`✅ Freelancer encontrado: ${freelancer.name} (${freelancer.role})`);
      
      // Testar a consulta que deveria retornar eventos para freelancer
      const freelancerEventsResult = await client.query(`
        SELECT DISTINCT e.*, u.name as created_by_name
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        INNER JOIN team_allocations ta ON e.id = ta.event_id
        WHERE ta.user_id = $1
        ORDER BY e.start_date DESC
      `, [freelancerId]);
      
      console.log(`Eventos encontrados para o freelancer: ${freelancerEventsResult.rows.length}`);
      freelancerEventsResult.rows.forEach(event => {
        console.log(`  - ${event.title} (${event.status}) - ${event.start_date}`);
      });
    }
    console.log('');

    // 6. Verificar se há problemas na estrutura das tabelas
    console.log('6. Verificando estrutura das tabelas...');
    
    // Verificar se a tabela team_allocations tem dados
    const tableCheckResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      WHERE tablename IN ('users', 'events', 'team_allocations')
      ORDER BY tablename
    `);
    
    tableCheckResult.rows.forEach(table => {
      console.log(`  - ${table.tablename}: ${table.inserts} inserts, ${table.updates} updates, ${table.deletes} deletes`);
    });

    client.release();
    console.log('\n✅ Debug concluído!');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  } finally {
    await pool.end();
  }
}

// Executar o debug
debugEvents();
