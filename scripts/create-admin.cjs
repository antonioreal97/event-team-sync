const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    const password = 'admin123';
    const saltRounds = 12;
    
    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('Senha:', password);
    console.log('Hash gerado:', passwordHash);
    
    // Verificar se o hash funciona
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log('Hash válido:', isValid);
    
    // SQL para inserir o usuário
    console.log('\n=== SQL PARA EXECUTAR ===');
    console.log(`DELETE FROM users WHERE email = 'admin@frela.com';`);
    console.log(`INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) VALUES (`);
    console.log(`    '550e8400-e29b-41d4-a716-446655440000',`);
    console.log(`    'Administrador',`);
    console.log(`    'admin@frela.com',`);
    console.log(`    '${passwordHash}',`);
    console.log(`    'gestor',`);
    console.log(`    true,`);
    console.log(`    CURRENT_TIMESTAMP,`);
    console.log(`    CURRENT_TIMESTAMP`);
    console.log(`);`);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

createAdminUser();






