const dotenv = require('dotenv');
const { BotScheduler } = require('./scheduler/BotScheduler');
const { SupabaseStorage } = require('./storage/SupabaseStorage');
const { logger } = require('./utils/Logger');

// Carrega variáveis de ambiente
dotenv.config();

// Storage instance
const storage = new SupabaseStorage();

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  
  // Parse the URL to get the pathname (remove query parameters and handle /api prefix)
  const pathname = new URL(url, 'http://localhost').pathname.replace(/^\/api/, '') || '/';

  try {
    // Route handling
    if (pathname === '/health' && method === 'GET') {
      return res.json({
        status: 'OK',
        service: 'Creative Teams Bot',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        workdaysOnly: process.env.WORKDAYS_ONLY !== 'false',
      });
    }

    if (pathname === '/status' && method === 'GET') {
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

    if (pathname === '/send-message' && method === 'POST') {
      logger.info('📤 Solicitação de envio manual recebida');
      await BotScheduler.executeManually();
      return res.json({
        success: true,
        message: 'Mensagem criativa enviada com sucesso!',
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/test-connection' && method === 'POST') {
      return res.json({
        success: true,
        message: 'Teste de conexão realizado',
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/analytics' && method === 'GET') {
      const stats = await storage.getMessageStats();
      const insights = await storage.getContentInsights();
      return res.json({
        statistics: stats,
        insights: insights,
        generatedAt: new Date().toISOString(),
      });
    }

    if (pathname.startsWith('/messages/recent') && method === 'GET') {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
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

    if (pathname.match(/\/messages\/(.+)\/effectiveness/) && method === 'PATCH') {
      const id = pathname.match(/\/messages\/(.+)\/effectiveness/)[1];
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
