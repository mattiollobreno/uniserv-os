import { useState } from 'react';
import { apiFetch } from '../services/api';

// Autocadastro público não pode entregar o perfil de maior privilégio —
// a conta de administrador é criada à parte (bootstrap), não por aqui.
const PERFIS = [
  { valor: 'tecnico', label: 'Técnico' },
  { valor: 'supervisor', label: 'Supervisor' },
];

export default function Cadastro({ onVoltarLogin }) {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [perfil, setPerfil] = useState('tecnico');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    try {
      await apiFetch('/auth/cadastrar', {
        method: 'POST',
        body: { nome_completo: nomeCompleto, email, telefone, senha, perfil },
      });
      setSucesso(true);
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="pagina-login">
        <div className="cartao-login">
          <h1>Conta criada!</h1>
          <p className="mensagem-sucesso">Cadastro concluído. Você já pode entrar com seu e-mail e senha.</p>
          <button type="button" onClick={onVoltarLogin}>
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-login">
      <form className="cartao-login" onSubmit={handleSubmit}>
        <h1>Criar conta</h1>
        <p>Preencha os dados para se cadastrar no Uniserv OS.</p>

        <label htmlFor="nome">Nome completo</label>
        <input
          id="nome"
          type="text"
          value={nomeCompleto}
          onChange={(evento) => setNomeCompleto(evento.target.value)}
          required
        />

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="telefone">Telefone</label>
        <input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(evento) => setTelefone(evento.target.value)}
        />

        <label htmlFor="perfil">Perfil</label>
        <select id="perfil" value={perfil} onChange={(evento) => setPerfil(evento.target.value)}>
          {PERFIS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.label}
            </option>
          ))}
        </select>

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          autoComplete="new-password"
          required
        />

        <label htmlFor="confirmarSenha">Confirmar senha</label>
        <input
          id="confirmarSenha"
          type="password"
          value={confirmarSenha}
          onChange={(evento) => setConfirmarSenha(evento.target.value)}
          autoComplete="new-password"
          required
        />

        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar conta'}
        </button>
        <button type="button" className="secundario" style={{ marginTop: '0.5rem', width: '100%' }} onClick={onVoltarLogin}>
          Já tenho conta
        </button>
      </form>
    </div>
  );
}
