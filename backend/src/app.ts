import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import router from './routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*'
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fleetflow-backend' });
});

app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

export default app;
