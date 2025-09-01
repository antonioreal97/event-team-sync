import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Listar notificações do usuário
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await pool.query(`
    SELECT * FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `, [userId]);

  res.json({
    notifications: result.rows
  });
}));

// Marcar notificação como lida
router.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = await pool.query(`
    UPDATE notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `, [id, userId]);

  if (result.rows.length === 0) {
    throw createError('Notificação não encontrada', 404);
  }

  res.json({
    message: 'Notificação marcada como lida',
    notification: result.rows[0]
  });
}));

// Marcar todas as notificações como lidas
router.patch('/read-all', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  await pool.query(`
    UPDATE notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND is_read = false
  `, [userId]);

  res.json({
    message: 'Todas as notificações foram marcadas como lidas'
  });
}));

// Deletar notificação
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const result = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw createError('Notificação não encontrada', 404);
  }

  res.json({
    message: 'Notificação deletada com sucesso'
  });
}));

export { router as notificationRoutes };





