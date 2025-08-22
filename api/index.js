import dotenv from 'dotenv';
import { BotScheduler } from './scheduler/BotScheduler';
import { SupabaseStorage } from './storage/SupabaseStorage';
import { logger } from './utils/Logger';

// Carrega variáveis de ambiente
dotenv.config();

// Storage instance
const storage = new SupabaseStorage();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;

  try {
    // Route handling
    if (url === '/health' && method === 'GET') {
      return res.json({
        status: 'OK',
        service: 'Creative Teams Bot',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        workdaysOnly: process.env.WORKDAYS_ONLY !== 'false',
      });
    }

    if (url === '/status' && method === 'GET') {
      const stats = await BotScheduler.getInstance().getSystemStats();
      return res.json({
        status: 'running',
        scheduler: stats.isRunning ? 'active' : 'stopped',
        nextExecution: stats.nextExecution,
        workdaysOnly: stats.workdaysOnly,
        messageStats: stats.messageStats,
        uptime: stats.uptime,
      });
    }

    if (url === '/send-message' && method === 'POST') {
      logger.info('📤 Solicitação de envio manual recebida');
      await BotScheduler.executeManually();
      return res.json({
        success: true,
        message: 'Mensagem criativa enviada com sucesso!',
        timestamp: new Date().toISOString(),
      });
    }

    if (url === '/test-connection' && method === 'POST') {
      return res.json({
        success: true,
        message: 'Teste de conexão realizado',
        timestamp: new Date().toISOString(),
      });
    }

    if (url === '/analytics' && method === 'GET') {
      const stats = await storage.getMessageStats();
      const insights = await storage.getContentInsights();
      return res.json({
        statistics: stats,
        insights: insights,
        generatedAt: new Date().toISOString(),
      });
    }

    if (url.startsWith('/messages/recent') && method === 'GET') {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const limit = parseInt(urlParams.get('limit')) || 10;
      const messages = await storage.getRecentMessages(Math.min(limit, 50));

      return res.json({
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          style: msg.style,
          topic: msg.topic,
          sent_at: msg.sent_at,
          effectiveness: msg.effectiveness,
        })),
        count: messages.length,
      });
    }

    if (url.match(/\/messages\/(.+)\/effectiveness/) && method === 'PATCH') {
      const id = url.match(/\/messages\/(.+)\/effectiveness/)[1];
      const { effectiveness } = req.body;

      if (!['low', 'medium', 'high'].includes(effectiveness)) {
        return res.status(400).json({
          error: 'Efetividade deve ser: low, medium, ou high',
        });
      }

      await storage.updateMessageEffectiveness(id, effectiveness);
      return res.json({
        success: true,
        message: 'Efetividade atualizada com sucesso',
      });
    }

    // 404 for unmatched routes
    return res.status(404).json({
      error: 'Rota não encontrada',
      availableRoutes: [
        'GET /health',
        'GET /status',
        'POST /send-message',
        'POST /test-connection',
        'GET /analytics',
        'GET /messages/recent',
        'PATCH /messages/:id/effectiveness',
      ],
    });

  } catch (error) {
    logger.error('Erro não tratado na aplicação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}

// Initialize scheduler on cold start
let schedulerInitialized = false;

if (!schedulerInitialized) {
  BotScheduler.initialize().catch(error => {
    logger.error('❌ Erro na inicialização do scheduler:', error);
  });
  schedulerInitialized = true;
}
