import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { eventRoutes } from './routes/events';
import { teamRoutes } from './routes/teams';
import { equipmentRoutes } from './routes/equipment';
import { equipmentCategoriesRoutes } from './routes/equipmentCategories';
import { equipmentItemsRoutes } from './routes/equipmentItems';
import { equipmentReservationsRoutes } from './routes/equipmentReservations';
import { maintenanceRoutes } from './routes/maintenance';
import { notificationRoutes } from './routes/notifications';
import { inviteRoutes } from './routes/invites';
import { eventInterestRoutes } from './routes/eventInterest';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seudominio.com'] 
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost', 'http://localhost:80'],
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/equipment/categories', authenticateToken, equipmentCategoriesRoutes);
app.use('/api/equipment/items', authenticateToken, equipmentItemsRoutes);
app.use('/api/equipment/reservations', authenticateToken, equipmentReservationsRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/maintenance', authenticateToken, maintenanceRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/invites', authenticateToken, inviteRoutes);
app.use('/api/event-interest', authenticateToken, eventInterestRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
});

export default app;
