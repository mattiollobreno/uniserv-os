import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Chamados from './pages/Chamados';
import Equipamentos from './pages/Equipamentos';
import { logout as logoutServico, tentarSessaoExistente } from './services/auth';

// Navegação simples por estado — com poucas telas não compensa adicionar uma
// biblioteca de rotas (react-router) só pra isso.
// `perfis` espelha a autorização já aplicada nas rotas do backend: se o
// perfil não tem acesso ao endpoint, a aba nem aparece.
const PAGINAS = {
  dashboard: { titulo: 'Dashboard', Componente: Dashboard, perfis: null },
  chamados: { titulo: 'Chamados', Componente: Chamados, perfis: null },
  clientes: { titulo: 'Clientes', Componente: Clientes, perfis: ['administrador', 'supervisor'] },
  equipamentos: { titulo: 'Equipamentos', Componente: Equipamentos, perfis: null },
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [pagina, setPagina] = useState('dashboard');
  const [telaPublica, setTelaPublica] = useState('login');

  useEffect(() => {
    tentarSessaoExistente().then((usuarioLogado) => {
      setUsuario(usuarioLogado);
      setCarregandoSessao(false);
    });
  }, []);

  // Atualiza o título da aba conforme a navegação — ajuda quem usa leitor de
  // tela ou mantém várias abas abertas a saber em qual página está.
  useEffect(() => {
    if (!usuario) {
      document.title = 'Uniserv OS';
      return;
    }
    const tituloPagina = PAGINAS[pagina]?.titulo ?? 'Dashboard';
    document.title = `${tituloPagina} · Uniserv OS`;
  }, [pagina, usuario]);

  async function handleLogout() {
    await logoutServico();
    setUsuario(null);
    setPagina('dashboard');
  }

  if (carregandoSessao) {
    // role="status" garante que leitores de tela anunciem o carregamento,
    // já que o texto muda sem nenhuma ação explícita do usuário.
    return (
      <p role="status" style={{ padding: '2rem' }}>
        Carregando...
      </p>
    );
  }

  if (!usuario) {
    return telaPublica === 'cadastro' ? (
      <Cadastro onVoltarLogin={() => setTelaPublica('login')} />
    ) : (
      <Login onLogin={setUsuario} onIrParaCadastro={() => setTelaPublica('cadastro')} />
    );
  }

  const paginasVisiveis = Object.entries(PAGINAS).filter(
    ([, definicao]) => !definicao.perfis || definicao.perfis.includes(usuario.role)
  );
  const paginaValida = paginasVisiveis.some(([chave]) => chave === pagina);
  const PaginaAtual = (paginaValida ? PAGINAS[pagina]?.Componente : null) ?? Dashboard;

  return (
    <div className="app">
      {/* Skip link: só aparece quando recebe foco via Tab, permitindo que
          quem navega por teclado pule o menu e vá direto pro conteúdo. */}
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo
      </a>

      <header className="app-header">
        <h1>Uniserv OS</h1>
        <nav className="app-nav" aria-label="Navegação principal">
          {paginasVisiveis.map(([chave, { titulo }]) => (
            <button
              key={chave}
              type="button"
              className={chave === pagina ? 'ativo' : ''}
              aria-current={chave === pagina ? 'page' : undefined}
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
      <main id="conteudo-principal" className="app-main" tabIndex={-1}>
        <PaginaAtual usuario={usuario} />
      </main>
    </div>
  );
}