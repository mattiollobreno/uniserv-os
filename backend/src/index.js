const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const chamadoRoutes = require('./routes/chamadoRoutes');
const equipamentoRoutes = require('./routes/equipamentoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tecnicoRoutes = require('./routes/tecnicoRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// credentials: true é obrigatório aqui — o frontend usa fetch com
// `credentials: 'include'` para enviar/receber o cookie httpOnly do
// refresh token. Sem isso (ou com origin '*'), o navegador bloqueia o
// cookie por CORS e o login/refresh nunca funcionam entre localhost:3000
// e localhost:3001.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/usuarios', userRoutes);
app.use('/clientes', clienteRoutes);
app.use('/chamados', chamadoRoutes);
app.use('/equipamentos', equipamentoRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/tecnicos', tecnicoRoutes);
app.use('/avaliacoes', avaliacaoRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Uniserv OS backend is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
