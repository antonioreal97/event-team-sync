const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'event_team_sync',
  user: 'postgres',
  password: 'postgres'
});

async function listEvents() {
  try {
    console.log('🔍 Buscando eventos...\n');
    
    const result = await pool.query(`
      SELECT id, title, start_date, end_date 
      FROM events 
      ORDER BY start_date DESC 
      LIMIT 10
    `);
    
    console.log('📅 Eventos encontrados:');
    result.rows.forEach((event, index) => {
      console.log(`${index + 1}. ID: ${event.id}`);
      console.log(`   Título: ${event.title}`);
      console.log(`   Data: ${event.start_date} a ${event.end_date}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

async function cancelEventInterests(eventId, reason = 'Administrador ainda não escalou toda a equipe') {
  try {
    console.log(`🔄 Cancelando confirmações de interesse para o evento ${eventId}...\n`);
    
    // Verificar se o evento existe
    const eventResult = await pool.query(
      'SELECT id, title FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      console.log('❌ Evento não encontrado!');
      await pool.end();
      return;
    }

    const event = eventResult.rows[0];
    console.log(`📋 Evento: ${event.title}`);

    // Verificar se a tabela de confirmações existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_interest_confirmations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('ℹ️ Tabela de confirmações de interesse não existe. Nada para cancelar.');
      await pool.end();
      return;
    }

    // Buscar todas as confirmações de interesse para o evento
    const confirmationsResult = await pool.query(
      'SELECT * FROM event_interest_confirmations WHERE event_id = $1',
      [eventId]
    );

    if (confirmationsResult.rows.length === 0) {
      console.log('ℹ️ Nenhuma confirmação de interesse encontrada para este evento.');
      await pool.end();
      return;
    }

    console.log(`📊 Encontradas ${confirmationsResult.rows.length} confirmações de interesse:`);
    confirmationsResult.rows.forEach((confirmation, index) => {
      console.log(`   ${index + 1}. Status: ${confirmation.status} (Criado em: ${confirmation.created_at})`);
    });

    // Deletar todas as confirmações de interesse
    const deleteResult = await pool.query(
      'DELETE FROM event_interest_confirmations WHERE event_id = $1',
      [eventId]
    );

    console.log(`✅ ${confirmationsResult.rows.length} confirmações de interesse canceladas com sucesso!`);

    // Criar notificações para todos os freelancers afetados
    console.log('📢 Criando notificações para os freelancers...');
    
    for (const confirmation of confirmationsResult.rows) {
      try {
        await pool.query(`
          INSERT INTO notifications (
            user_id, title, message, type, related_event_id, priority, action_required, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          confirmation.user_id,
          'Confirmação de Interesse Cancelada',
          `Sua confirmação de interesse no evento "${event.title}" foi cancelada pelo administrador. Motivo: ${reason}`,
          'allocation',
          eventId,
          'medium',
          false
        ]);
      } catch (notificationError) {
        console.warn(`⚠️ Não foi possível criar notificação para usuário ${confirmation.user_id}:`, notificationError.message);
      }
    }

    console.log('🎉 Processo concluído com sucesso!');
    console.log(`📝 Motivo: ${reason}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erro ao cancelar confirmações:', error.message);
    await pool.end();
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length === 0) {
  // Se não há argumentos, listar eventos
  listEvents();
} else if (args[0] === 'cancel' && args[1]) {
  // Se o primeiro argumento é 'cancel' e há um ID de evento
  const eventId = args[1];
  const reason = args.slice(2).join(' ') || 'Administrador ainda não escalou toda a equipe';
  cancelEventInterests(eventId, reason);
} else {
  console.log('📖 Uso:');
  console.log('  node cancel-event-interests.js                    # Listar eventos');
  console.log('  node cancel-event-interests.js cancel <eventId>   # Cancelar confirmações de um evento');
  console.log('  node cancel-event-interests.js cancel <eventId> "Motivo personalizado"');
}
