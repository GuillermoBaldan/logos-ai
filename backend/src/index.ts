import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import analysisRoutes from './routes/analysis';
import notesRoutes from './routes/notes';
import flashcardsRoutes from './routes/flashcards';
import compareRoutes from './routes/compare';
import summarizeRoutes from './routes/summarize';

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana de tiempo
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Parseo de JSON y cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/summarize', summarizeRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Logos AI Backend',
    version: '1.0.0',
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Logos AI Backend API',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/search',
      '/api/analysis',
      '/api/notes',
      '/api/flashcards',
      '/api/compare',
      '/api/summarize',
      '/health',
    ],
  });
});

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`,
  });
});

// Middleware de manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📚 Logos AI Backend v1.0.0`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

export default app;