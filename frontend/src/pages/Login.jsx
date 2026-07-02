import { useState } from 'react';
import { login } from '../services/auth';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const usuario = await login(email, senha);
      if (!usuario) {
        setErro('Login efetuado, mas não foi possível carregar os dados do usuário.');
        return;
      }
      onLogin(usuario);
    } catch (err) {
      setErro(err.dados?.erro || 'E-mail ou senha inválidos.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-login">
      <form className="cartao-login" onSubmit={handleSubmit}>
        <h1>Uniserv OS</h1>
        <p>Entre com sua conta para continuar.</p>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          autoComplete="current-password"
          required
        />

        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
