import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

// Extender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso não fornecido' 
      });
    }

    // Demo-token bypass removed for security. All callers must present a valid JWT.

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET não configurado');
      return res.status(500).json({ 
        error: 'Erro de configuração do servidor' 
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, secret) as any;
    
    // Verificar se usuário ainda existe e está ativo
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado' 
      });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Usuário inativo' 
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ 
        error: 'Token inválido' 
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expirado' 
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar se usuário é gestor
export const requireGestor = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (req.user?.role !== 'gestor') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas gestores podem realizar esta ação.' 
    });
  }
  next();
};

// Middleware para verificar se usuário é freelancer
export const requireFreelancer = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (req.user?.role !== 'freelancer') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas freelancers podem realizar esta ação.' 
    });
  }
  next();
};

/** Freelancer ou líder freelancer (confirmação de escalação, etc.). */
export const requireFreelancerOrLider = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const r = req.user?.role;
  if (r !== 'freelancer' && r !== 'lider_freelancer') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas freelancers podem realizar esta ação.',
    });
  }
  next();
};
