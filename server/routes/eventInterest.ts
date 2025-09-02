import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireGestor } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Função para verificar se a tabela existe
const checkTableExists = async () => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_interest_confirmations'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
    return false;
  }
};

// Função para criar a tabela se não existir
const createTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_interest_confirmations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL,
        user_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        confirmed_at TIMESTAMP,
        rejected_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Adicionar foreign keys se não existirem
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_event_interest_event_id') THEN
          ALTER TABLE event_interest_confirmations 
          ADD CONSTRAINT fk_event_interest_event_id 
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_event_interest_user_id') THEN
          ALTER TABLE event_interest_confirmations 
          ADD CONSTRAINT fk_event_interest_user_id 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Adicionar constraint único se não existir
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'unique_event_user') THEN
          ALTER TABLE event_interest_confirmations 
          ADD CONSTRAINT unique_event_user 
          UNIQUE(event_id, user_id);
        END IF;
      END $$;
    `);

    console.log('✅ Tabela event_interest_confirmations criada/verificada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    return false;
  }
};

// Listar todas as confirmações de interesse (apenas gestores)
router.get('/', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Verificar se a tabela existe
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.log('📋 Tabela não encontrada, criando...');
      const created = await createTableIfNotExists();
      if (!created) {
        throw createError('Não foi possível criar a tabela de confirmações de interesse', 500);
      }
    }

    // Query simplificada para evitar erros de JOIN
    const result = await pool.query(`
      SELECT 
        eic.id,
        eic.event_id,
        eic.user_id,
        eic.status,
        eic.confirmed_at,
        eic.rejected_at,
        eic.notes,
        eic.created_at,
        eic.updated_at,
        COALESCE(e.title, 'Evento não encontrado') as event_title,
        COALESCE(e.start_date, '1900-01-01') as event_start_date,
        COALESCE(e.end_date, '1900-01-01') as event_end_date,
        COALESCE(u.name, 'Usuário não encontrado') as user_name,
        COALESCE(u.email, 'email@não.encontrado') as user_email,
        fp.team_type,
        fp.experience_level
      FROM event_interest_confirmations eic
      LEFT JOIN events e ON eic.event_id = e.id
      LEFT JOIN users u ON eic.user_id = u.id
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      ORDER BY eic.created_at DESC
    `);

    res.json({
      confirmations: result.rows
    });
  } catch (error) {
    console.error('❌ Erro ao buscar confirmações:', error);
    throw createError('Erro interno ao buscar confirmações de interesse', 500);
  }
}));

// Listar confirmações de interesse por evento (apenas gestores)
router.get('/event/:eventId', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const tableExists = await checkTableExists();
    if (!tableExists) {
      return res.json({ confirmations: [] });
    }

    const result = await pool.query(`
      SELECT 
        eic.id,
        eic.event_id,
        eic.user_id,
        eic.status,
        eic.confirmed_at,
        eic.rejected_at,
        eic.notes,
        eic.created_at,
        eic.updated_at,
        COALESCE(e.title, 'Evento não encontrado') as event_title,
        COALESCE(e.start_date, '1900-01-01') as event_start_date,
        COALESCE(e.end_date, '1900-01-01') as event_end_date,
        COALESCE(u.name, 'Usuário não encontrado') as user_name,
        COALESCE(u.email, 'email@não.encontrado') as user_email,
        fp.team_type,
        fp.experience_level
      FROM event_interest_confirmations eic
      LEFT JOIN events e ON eic.event_id = e.id
      LEFT JOIN users u ON eic.user_id = u.id
      LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id
      WHERE eic.event_id = $1
      ORDER BY eic.created_at ASC
    `, [eventId]);

    res.json({
      confirmations: result.rows
    });
  } catch (error) {
    console.error('❌ Erro ao buscar confirmações por evento:', error);
    throw createError('Erro interno ao buscar confirmações de interesse', 500);
  }
}));

// Aprovar confirmação de interesse (apenas gestores)
router.patch('/:id/approve', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const tableExists = await checkTableExists();
    if (!tableExists) {
      throw createError('Tabela de confirmações de interesse não existe', 404);
    }

    // Verificar se confirmação existe
    const existingConfirmation = await pool.query(
      'SELECT * FROM event_interest_confirmations WHERE id = $1',
      [id]
    );

    if (existingConfirmation.rows.length === 0) {
      throw createError('Confirmação de interesse não encontrada', 404);
    }

    const confirmation = existingConfirmation.rows[0];

    // Atualizar status para confirmado
    const result = await pool.query(`
      UPDATE event_interest_confirmations 
      SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, notes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [notes || null, id]);

    // Criar notificação para o freelancer (se a tabela notifications existir)
    try {
      await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, type, related_event_id, priority, action_required, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `, [
        confirmation.user_id,
        'Interesse Aprovado',
        `Seu interesse no evento foi aprovado pelo administrador.`,
        'allocation',
        confirmation.event_id,
        'low',
        false
      ]);
    } catch (notificationError) {
      console.warn('⚠️ Não foi possível criar notificação:', notificationError.message);
      // Continua mesmo se a notificação falhar
    }

    res.json({
      message: 'Interesse aprovado com sucesso',
      confirmation: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao aprovar interesse:', error);
    throw error;
  }
}));

// Rejeitar confirmação de interesse (apenas gestores)
router.patch('/:id/reject', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    const tableExists = await checkTableExists();
    if (!tableExists) {
      throw createError('Tabela de confirmações de interesse não existe', 404);
    }

    // Verificar se confirmação existe
    const existingConfirmation = await pool.query(
      'SELECT * FROM event_interest_confirmations WHERE id = $1',
      [id]
    );

    if (existingConfirmation.rows.length === 0) {
      throw createError('Confirmação de interesse não encontrada', 404);
    }

    const confirmation = existingConfirmation.rows[0];

    // Atualizar status para rejeitado
    const result = await pool.query(`
      UPDATE event_interest_confirmations 
      SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP, notes = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [notes || null, id]);

    // Criar notificação para o freelancer (se a tabela notifications existir)
    try {
      await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, type, related_event_id, priority, action_required, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `, [
        confirmation.user_id,
        'Interesse Rejeitado',
        `Seu interesse no evento foi rejeitado pelo administrador.${notes ? ` Motivo: ${notes}` : ''}`,
        'allocation',
        confirmation.event_id,
        'medium',
        false
      ]);
    } catch (notificationError) {
      console.warn('⚠️ Não foi possível criar notificação:', notificationError.message);
      // Continua mesmo se a notificação falhar
    }

    res.json({
      message: 'Interesse rejeitado com sucesso',
      confirmation: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erro ao rejeitar interesse:', error);
    throw error;
  }
}));

// Estatísticas das confirmações de interesse (apenas gestores)
router.get('/stats/overview', requireGestor, asyncHandler(async (req: Request, res: Response) => {
  try {
    const tableExists = await checkTableExists();
    if (!tableExists) {
      return res.json({
        stats: {
          pending: 0,
          confirmed: 0,
          rejected: 0,
          total: 0
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM event_interest_confirmations
      GROUP BY status
    `);

    const stats = {
      pending: 0,
      confirmed: 0,
      rejected: 0,
      total: 0
    };

    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    res.json({
      stats
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw createError('Erro interno ao buscar estatísticas', 500);
  }
}));

export { router as eventInterestRoutes };
