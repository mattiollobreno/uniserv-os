const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const chamadoRoutes = require('./routes/chamadoRoutes');
const equipamentoRoutes = require('./routes/equipamentoRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/usuarios', userRoutes);
app.use('/clientes', clienteRoutes);
app.use('/chamados', chamadoRoutes);
app.use('/equipamentos', equipamentoRoutes);

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
