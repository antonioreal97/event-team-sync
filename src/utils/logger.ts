/**
 * Logger utilitário — só emite saída em ambiente de desenvolvimento.
 * Em produção (NODE_ENV !== 'development') todos os métodos são no-ops,
 * evitando vazar informações de debug no console do cliente.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  /** Erros reais — sempre emitidos (dev e produção). */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
