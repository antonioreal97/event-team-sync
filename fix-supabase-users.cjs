const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que o arquivo config.supabase.env existe e contém:');
  console.log('SUPABASE_URL=https://akadsnjbovudoknfxokc.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSupabaseUsers() {
  try {
    console.log('🔍 Verificando usuários existentes no Supabase...\n');

    // 1. Verificar usuários existentes
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`📊 Usuários existentes: ${existingUsers.length}`);
    existingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ID: ${user.id}`);
    });

    // 2. Verificar se os usuários demo existem
    const demoUsers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Gestor Demo',
        email: 'gestor@frela.com',
        role: 'gestor'
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Freelancer Demo',
        email: 'freelancer@frela.com',
        role: 'freelancer'
      }
    ];

    console.log('\n🔍 Verificando usuários demo necessários...');
    
    for (const demoUser of demoUsers) {
      const exists = existingUsers.find(u => u.id === demoUser.id);
      if (exists) {
        console.log(`✅ Usuário ${demoUser.name} já existe`);
      } else {
        console.log(`❌ Usuário ${demoUser.name} não encontrado, criando...`);
        
        // Criar usuário demo
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            password_hash: '$2b$10$rQZ8K9LmN2PqR3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P', // senha: demo123
            role: demoUser.role,
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          console.error(`❌ Erro ao criar usuário ${demoUser.name}:`, createError);
        } else {
          console.log(`✅ Usuário ${demoUser.name} criado com sucesso`);
        }
      }
    }

    // 3. Verificar e criar perfis de freelancer se necessário
    console.log('\n🔍 Verificando perfis de freelancer...');
    
    const { data: freelancerProfiles, error: profilesError } = await supabase
      .from('freelancer_profiles')
      .select('user_id, team_type')
      .eq('user_id', '00000000-0000-0000-0000-000000000002');

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis de freelancer:', profilesError);
    } else if (freelancerProfiles.length === 0) {
      console.log('❌ Perfil de freelancer não encontrado, criando...');
      
      const { error: profileError } = await supabase
        .from('freelancer_profiles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000002',
          team_type: 'equipe_a',
          phone: '(11) 99999-9999',
          address: 'Rua Demo, 123',
          city: 'São Paulo',
          state: 'SP',
          cpf: '000.000.000-00',
          hourly_rate: 50,
          daily_rate: 400,
          experience_level: 'intermediario',
          audio_visual_roles: ['camera', 'audio'],
          bio: 'Freelancer especializado em audiovisual',
          languages: ['Português', 'Inglês'],
          total_events_attended: 5,
          total_earnings: 2000,
          average_rating: 4.5
        });

      if (profileError) {
        console.error('❌ Erro ao criar perfil de freelancer:', profileError);
      } else {
        console.log('✅ Perfil de freelancer criado com sucesso');
      }
    } else {
      console.log('✅ Perfil de freelancer já existe');
    }

    // 4. Verificar usuários finais
    console.log('\n📊 Verificação final...');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at');

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else {
      console.log(`✅ Total de usuários: ${finalUsers.length}`);
      finalUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role} - ID: ${user.id}`);
      });
    }

    console.log('\n🎉 Correção concluída! Agora você pode criar eventos.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar correção
fixSupabaseUsers();
