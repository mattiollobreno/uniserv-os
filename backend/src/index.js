import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Uniserv OS backend is running' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
