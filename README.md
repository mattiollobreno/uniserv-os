# 🖨️ Uniserv OS — Sistema de Gerenciamento de Ordens de Serviço

> Projeto desenvolvido para a disciplina de Engenharia de Software I — Ciência da Computação, UFFS Campus Chapecó (2026).

---

## 📋 Sobre o Projeto

Sistema web para gerenciamento de ordens de serviço do **Grupo Uniserv**, empresa especializada em locação de impressoras e equipamentos reprográficos. O sistema centraliza o fluxo de chamados (instalação, manutenção e desinstalação), substituindo processos manuais via WhatsApp e papel por uma plataforma digital integrada.

---

## 👥 Equipe

| Nome | Função |
|---|---|
| Breno Mattiollo | Desenvolvedor |
| Jonas de Moraes | Desenvolvedor |
| Lucas Galvão Secco | Desenvolvedor |

---

## 📌 Requisitos Funcionais

| ID | Descrição | Perfil |
|---|---|---|
| RF01 | Cadastro de usuários | Todos |
| RF02 | Login com e-mail e senha | Todos |
| RF03 | Cadastro de clientes | Administrador, Supervisor |
| RF04 | Cadastro de equipamentos (PAT) | Técnico, Supervisor |
| RF05 | Abertura de chamados pelo cliente | Cliente |
| RF06 | Abertura de chamados internos | Supervisor |
| RF07 | Classificação de chamados | Supervisor |
| RF08 | Atribuição de chamados a técnicos | Supervisor |
| RF09 | Atualização de status do chamado | Técnico, Supervisor |
| RF10 | Registro de atendimento | Técnico |
| RF11 | Comunicação interna no chamado | Cliente, Técnico, Supervisor |
| RF12 | Acompanhamento de chamados | Cliente |
| RF13 | Consulta e histórico de chamados | Supervisor, Administrador |
| RF14 | Avaliação de atendimento | Cliente |
| RF15 | Geração de ordem de serviço (OS) | Sistema |
| RF16 | Controle de suprimentos | Técnico, Supervisor |
| RF17 | Notificações automáticas | Todos |

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Banco de Dados | PostgreSQL |
| Versionamento | Git + GitHub |

---

## 📁 Estrutura do Projeto

```
uniserv-os/
├── backend/          # API REST (Node.js + Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middlewares/
│   ├── .env.example
│   └── package.json
├── frontend/         # Interface web (React)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── docs/             # Documentação e relatórios
└── README.md
```

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### Banco de dados

```bash
createdb uniserv_os
psql -U <usuario> -d uniserv_os -f backend/src/database/schema.sql
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configure as variáveis de ambiente
npm run seed            # cria usuários de teste e alguns dados de exemplo (idempotente)
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` dentro de `backend/` com base no `.env.example`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/uniserv_os
JWT_SECRET=sua_chave_secreta
REFRESH_SECRET=outra_chave_secreta_diferente_da_anterior
REFRESH_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
```

> `FRONTEND_URL` é usado na configuração de CORS (`backend/src/index.js`).
> Como o frontend envia cookies (`credentials: 'include'`) para o refresh
> token, o CORS precisa de uma origem específica com `credentials: true` —
> `origin: '*'` faz o navegador bloquear o cookie.

### Usuários de teste (criados por `npm run seed`)

| E-mail                  | Senha      | Perfil        |
|-------------------------|------------|---------------|
| admin@uniserv.com       | admin123   | administrador |
| supervisor@uniserv.com  | admin123   | supervisor    |
| tecnico@uniserv.com     | admin123   | tecnico       |
| cliente@uniserv.com     | admin123   | cliente (vinculado à Tormann Transportes) |

---

## Autenticação

O sistema usa JWT com dois tokens:

- **Access token** — enviado no header `Authorization: Bearer <token>`. Curta duração.
- **Refresh token** — armazenado em cookie `HttpOnly`. Usado para renovar o access token sem novo login.

Perfis de acesso disponíveis: `administrador`, `supervisor`, `tecnico`, `cliente`.

Observação sobre o modelo de dados: `chamado.tecnico_id` referencia a
tabela `tecnico` (não `usuario` diretamente). Por isso, todo usuário
cadastrado com `perfil = 'tecnico'` gera automaticamente uma linha
correspondente em `tecnico` (ver `backend/src/controllers/authController.js`),
e o endpoint `/tecnicos` é quem resolve esse vínculo para preencher o
seletor de técnico no frontend.

---

## Rotas da API

### Auth — `/auth`

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| POST | `/auth/cadastrar` | Cadastra novo usuário | Pública |
| POST | `/auth/login` | Login, retorna tokens | Pública |
| POST | `/auth/refresh` | Renova o access token | Cookie |
| POST | `/auth/logout` | Encerra sessão | Autenticado |

### Usuários — `/usuarios`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| GET | `/usuarios` | Lista usuários | Administrador |
| GET | `/usuarios/:id` | Busca por ID | Autenticado |
| PUT | `/usuarios/:id` | Atualiza dados | Administrador |
| PATCH | `/usuarios/:id/email` | Atualiza e-mail | Autenticado |
| PATCH | `/usuarios/:id/senha` | Atualiza senha | Autenticado |
| DELETE | `/usuarios/:id` | Remove usuário | Administrador |

### Clientes — `/clientes`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| POST | `/clientes` | Cadastra cliente | Administrador, Supervisor |
| GET | `/clientes` | Lista clientes | Administrador, Supervisor, Técnico |
| GET | `/clientes/:id` | Busca por ID | Autenticado |
| PUT | `/clientes/:id` | Atualiza cliente | Administrador, Supervisor |
| DELETE | `/clientes/:id` | Remove cliente | Administrador |

### Equipamentos — `/equipamentos`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| POST | `/equipamentos` | Cadastra equipamento (PAT) | Administrador, Supervisor, Técnico |
| GET | `/equipamentos` | Lista equipamentos | Autenticado |
| GET | `/equipamentos/:id` | Busca por ID | Autenticado |
| PUT | `/equipamentos/:id` | Atualiza equipamento | Administrador, Supervisor, Técnico |
| DELETE | `/equipamentos/:id` | Remove equipamento | Administrador |

### Chamados — `/chamados`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| POST | `/chamados` | Abre chamado (cliente abre o próprio; admin/supervisor abrem internamente) | Administrador, Supervisor, Cliente |
| GET | `/chamados` | Lista chamados (cliente só vê os próprios) | Autenticado |
| GET | `/chamados/:id` | Busca por ID (inclui histórico, atendimento e avaliação) | Autenticado (cliente só o próprio) |
| PATCH | `/chamados/:id/status` | Atualiza status (registra em historico_status) | Administrador, Supervisor, Técnico |
| PATCH | `/chamados/:id/atendimento` | Registra ações realizadas / horário do atendimento (RF10) | Administrador, Supervisor, Técnico |
| PATCH | `/chamados/:id/tecnico` | Atribui técnico | Administrador, Supervisor |
| DELETE | `/chamados/:id` | Remove chamado | Administrador |

### Dashboard — `/dashboard`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| GET | `/dashboard` | Totais de usuários, clientes, equipamentos e chamados (por status) | Autenticado |

### Técnicos — `/tecnicos`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| GET | `/tecnicos` | Lista técnicos ativos (id da tabela `tecnico` + nome do usuário vinculado) | Administrador, Supervisor |

### Avaliações — `/avaliacoes`

| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| POST | `/avaliacoes` | Avalia (nota 1-5 + comentário) um chamado próprio já finalizado, uma única vez | Cliente |

---

## 🖥️ Telas (frontend)

- **Login** — autenticação com e-mail e senha.
- **Dashboard** — totais por entidade e chamados por status, atualizado automaticamente.
- **Clientes** — CRUD completo, com busca e ordenação (Administrador, Supervisor). Inclui a ação **Criar acesso**, que cria e vincula um login (e-mail/senha) para o cliente poder logar.
- **Chamados** — cliente abre e acompanha os próprios chamados e avalia o atendimento finalizado; administrador/supervisor abrem chamados internos, atribuem técnico e classificam; técnico atualiza status e registra o atendimento (ações realizadas, horário início/fim) ao finalizar. Filtro por status/tipo e busca textual.
- **Equipamentos** — CRUD completo (PAT, modelo, marca, status, cliente vinculado), com busca e ordenação. Cliente vê só os próprios equipamentos.

A navegação exibe apenas as abas para as quais o perfil logado tem
permissão no backend (`frontend/src/App.jsx`).

---

## 📄 Licença

Projeto acadêmico — UFFS Campus Chapecó, 2026.
