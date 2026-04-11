/** Base URL do servidor Express (sem barra final). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw) return raw.replace(/\/$/, '');
  return 'http://localhost:3001';
}

/** Chave única do JWT no localStorage (alinhada ao middleware demo e à API). */
export const AUTH_TOKEN_STORAGE_KEY = 'token';

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

type ApiFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/**
 * Chama a API Express com prefixo `/api` e Bearer token quando existir.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: ApiFetchInit = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    ...(init.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (init.body !== undefined && typeof init.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = (data as { error?: string })?.error || res.statusText || 'Erro na requisição';
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }

  return data as T;
}
