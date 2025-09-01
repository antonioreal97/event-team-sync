import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Log do erro
  console.error('❌ Erro:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Erros de validação do banco
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Dados duplicados. Verifique as informações fornecidas.';
  }

  if (error.message.includes('violates not-null constraint')) {
    statusCode = 400;
    message = 'Dados obrigatórios não fornecidos.';
  }

  if (error.message.includes('violates foreign key constraint')) {
    statusCode = 400;
    message = 'Referência inválida. Verifique as relações entre os dados.';
  }

  // Erros de validação
  if (error.message.includes('validation failed')) {
    statusCode = 400;
    message = 'Dados inválidos. Verifique as informações fornecidas.';
  }

  // Resposta de erro
  res.status(statusCode).json({
    error: {
      message: message || 'Erro interno do servidor',
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url
    }
  });
};

// Função para criar erros operacionais
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Função para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};





