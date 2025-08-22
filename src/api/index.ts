import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import express from 'express';
import { BotScheduler } from '../scheduler/BotScheduler';
import { SupabaseStorage } from '../storage/SupabaseStorage';
import { logger } from '../utils/Logger';

// Carrega variáveis de ambiente
dotenv.config();

// Cria app Express
const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS para desenvolvimento
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  next();
});

// Storage instance
let storage: SupabaseStorage;

// Inicializar storage
const initStorage = async () => {
  if (!storage) {
    storage = new SupabaseStorage();
    await storage.initialize();
  }
  return storage;
};

// === ROTAS BÁSICAS ===

app.get('/health', (_, res) => {
  res.json({
    status: 'OK',
    service: 'Creative Teams Bot (Serverless)',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: 'vercel',
  });
});

app.get('/status', (_, res) => {
  res.json({
    status: 'running',
    mode: 'serverless',
    timestamp: new Date().toISOString(),
    note: 'Cron jobs não funcionam em serverless. Use para testes manuais apenas.',
  });
});

// === ROTAS DE CONTROLE ===

app.post('/send-message', async (_, res) => {
  try {
    logger.info('📤 Solicitação de envio manual recebida (serverless)');

    // Executa o bot manualmente
    await BotScheduler.executeManually();

    res.json({
      success: true,
      message: 'Mensagem criativa enviada com sucesso!',
      timestamp: new Date().toISOString(),
      mode: 'manual',
    });
  } catch (error) {
    logger.error('Erro ao enviar mensagem manual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

// === ROTAS DE ANALYTICS ===

app.get('/analytics', async (_, res) => {
  try {
    const storageInstance = await initStorage();
    const stats = await storageInstance.getMessageStats();
    const insights = await storageInstance.getContentInsights();

    res.json({
      statistics: stats,
      insights: insights,
      generatedAt: new Date().toISOString(),
      mode: 'serverless',
    });
  } catch (error) {
    logger.error('Erro ao buscar analytics:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
    });
  }
});

app.get('/messages/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const storageInstance = await initStorage();
    const messages = await storageInstance.getRecentMessages(Math.min(limit, 50));

    res.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        style: msg.style,
        topic: msg.topic,
        sent_at: msg.sent_at,
        effectiveness: (msg as any).effectiveness,
      })),
      count: messages.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar mensagens recentes',
    });
  }
});

// Rota 404
app.use((_, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    mode: 'serverless',
    availableRoutes: [
      'GET /health',
      'GET /status',
      'POST /send-message',
      'GET /analytics',
      'GET /messages/recent',
    ],
  });
});

// Middleware de erro
app.use((err: Error, _: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Erro não tratado na aplicação:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
  });
});

// Export para Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
