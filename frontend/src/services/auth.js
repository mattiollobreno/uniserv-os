import { apiFetch, getAccessToken, refreshAccessToken, setAccessToken } from './api';

// Decodifica o payload do JWT (id, role) sem precisar de biblioteca externa.
function decodificarToken(token) {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

// Junta o que vem no token (id, role) com o perfil completo do usuário
// (nome, e-mail) via GET /usuarios/:id, que já existe no backend.
async function carregarUsuario(token) {
  const payload = decodificarToken(token);
  if (!payload) return null;

  const perfil = await apiFetch(`/usuarios/${payload.id}`);
  return { ...perfil, role: payload.role };
}

export async function login(email, senha) {
  const dados = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, senha },
  });
  setAccessToken(dados.accessToken);
  return carregarUsuario(dados.accessToken);
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

// Chamado ao abrir a aplicação: tenta reaproveitar o token em memória ou
// renová-lo via cookie de refresh antes de mandar o usuário pra tela de login.
export async function tentarSessaoExistente() {
  const tokenAtual = getAccessToken();
  if (tokenAtual) {
    const usuario = await carregarUsuario(tokenAtual).catch(() => null);
    if (usuario) return usuario;
  }

  const novoToken = await refreshAccessToken();
  if (!novoToken) return null;

  return carregarUsuario(novoToken).catch(() => null);
}
