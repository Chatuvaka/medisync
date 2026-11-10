import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import medicationRoutes from './routes/medication.routes';
import scheduleRoutes from './routes/schedule.routes';
import doseRoutes from './routes/dose.routes';
import statsRoutes from './routes/stats.routes';
import caregiverRoutes from './routes/caregiver.routes';
import syncRoutes from './routes/sync.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'MediSync Backend API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Bienvenido a la API REST de MediSync',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      medications: '/api/medications',
      schedules: '/api/schedules',
      doses: '/api/doses',
      statistics: '/api/statistics',
      caregivers: '/api/caregivers',
      sync: '/api/sync',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/doses', doseRoutes);
app.use('/api/statistics', statsRoutes);
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/sync', syncRoutes);

// Error Middleware
app.use(errorHandler);

export default app;

