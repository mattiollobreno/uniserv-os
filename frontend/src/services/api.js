const API_URL = 'http://localhost:3001';

// Token de acesso mantido em memória (não em localStorage) — evita expor o
// JWT a ataques de XSS. A sessão sobrevive a um F5 porque tentamos renovar
// via /auth/refresh (cookie httpOnly) ao carregar a aplicação.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      accessToken = null;
      return null;
    }
    const dados = await res.json();
    accessToken = dados.accessToken;
    return accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}

async function requisitar(path, options, token) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

// Wrapper único para todas as chamadas à API: injeta o token, tenta renovar
// automaticamente em caso de 401 e padroniza o tratamento de erro.
export async function apiFetch(path, options = {}) {
  let res = await requisitar(path, options, accessToken);

  if (res.status === 401 && accessToken) {
    const novoToken = await refreshAccessToken();
    if (novoToken) {
      res = await requisitar(path, options, novoToken);
    }
  }

  if (res.status === 204) {
    return null;
  }

  const dados = await res.json().catch(() => null);

  if (!res.ok) {
    const erro = new Error(dados?.erro || `Erro ${res.status} na requisição`);
    erro.status = res.status;
    erro.dados = dados;
    throw erro;
  }

  return dados;
}
