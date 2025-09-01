const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'frela_db',
  user: 'frela_user',
  password: 'frela_password'
});

async function testFreelancerCreation() {
  try {
    console.log('🔍 Testando criação de freelancer...');
    
    // 1. Verificar usuários existentes
    console.log('\n1. Usuários freelancer existentes:');
    const existingUsers = await pool.query(
      'SELECT id, name, email, role FROM users WHERE role = $1',
      ['freelancer']
    );
    console.log(existingUsers.rows);
    
    // 2. Verificar perfis existentes
    console.log('\n2. Perfis de freelancer existentes:');
    const existingProfiles = await pool.query(
      'SELECT * FROM freelancer_profiles'
    );
    console.log(existingProfiles.rows);
    
    // 3. Simular criação de perfil para um usuário existente
    if (existingUsers.rows.length > 0) {
      const userId = existingUsers.rows[0].id;
      console.log(`\n3. Criando perfil para usuário ${userId}...`);
      
      try {
        const profileResult = await pool.query(`
          INSERT INTO freelancer_profiles (user_id, team_type, experience_level, audio_visual_roles)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [userId, 'equipe_a', 'iniciante', ['camera', 'iluminacao']]);
        
        console.log('✅ Perfil criado com sucesso:', profileResult.rows[0]);
      } catch (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError.message);
        console.error('Detalhes:', profileError);
      }
    }
    
    // 4. Verificar se o perfil foi criado
    console.log('\n4. Perfis após criação:');
    const profilesAfter = await pool.query(
      'SELECT * FROM freelancer_profiles'
    );
    console.log(profilesAfter.rows);
    
    // 5. Testar a query da rota /teams
    console.log('\n5. Testando query da rota /teams:');
    const teamsResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.is_active, u.created_at,
        fp.team_type, fp.phone, fp.city, fp.state, fp.experience_level,
        fp.audio_visual_roles, fp.total_events_attended, fp.total_earnings
      FROM users u
      INNER JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE u.role = 'freelancer' AND u.is_active = true
      ORDER BY fp.team_type, u.name
    `);
    
    console.log('Resultado da query /teams:', teamsResult.rows);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

testFreelancerCreation();
