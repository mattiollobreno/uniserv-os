import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import { logout as logoutServico, tentarSessaoExistente } from './services/auth';

// Navegação simples por estado — com só 4 telas não compensa adicionar uma
// biblioteca de rotas (react-router) só pra isso.
// `perfis` espelha a autorização já aplicada nas rotas do backend: se o
// perfil não tem acesso ao endpoint, a aba nem aparece.
const PAGINAS = {
  dashboard: { titulo: 'Dashboard', Componente: Dashboard, perfis: null },
  clientes: { titulo: 'Clientes', Componente: Clientes, perfis: ['administrador', 'supervisor'] },
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [pagina, setPagina] = useState('dashboard');

  useEffect(() => {
    tentarSessaoExistente().then((usuarioLogado) => {
      setUsuario(usuarioLogado);
      setCarregandoSessao(false);
    });
  }, []);

  async function handleLogout() {
    await logoutServico();
    setUsuario(null);
    setPagina('dashboard');
  }

  if (carregandoSessao) {
    return <p style={{ padding: '2rem' }}>Carregando...</p>;
  }

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  const paginasVisiveis = Object.entries(PAGINAS).filter(
    ([, definicao]) => !definicao.perfis || definicao.perfis.includes(usuario.role)
  );
  const paginaValida = paginasVisiveis.some(([chave]) => chave === pagina);
  const PaginaAtual = (paginaValida ? PAGINAS[pagina]?.Componente : null) ?? Dashboard;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Uniserv OS</h1>
        <nav className="app-nav">
          {paginasVisiveis.map(([chave, { titulo }]) => (
            <button
              key={chave}
              type="button"
              className={chave === pagina ? 'ativo' : ''}
              onClick={() => setPagina(chave)}
            >
              {titulo}
            </button>
          ))}
        </nav>
        <div className="app-usuario">
          <span>{usuario.nome_completo ?? usuario.email} · {usuario.role}</span>
          <button type="button" className="secundario" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>
      <main className="app-main">
        <PaginaAtual usuario={usuario} />
      </main>
    </div>
  );
}
