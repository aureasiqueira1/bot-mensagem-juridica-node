import dotenv from 'dotenv';
import express from 'express';
import { BotScheduler } from './scheduler/BotScheduler';
import { SupabaseStorage } from './storage/SupabaseStorage';
import { logger } from './utils/Logger';

// Carrega variáveis de ambiente
dotenv.config();

// Timeout padrão para operações assíncronas (30 segundos)
const EXECUTION_TIMEOUT = 30000;

// Helper para garantir que promessas completem dentro do timeout
async function executeWithTimeout(promise: Promise<any>, timeoutMs = EXECUTION_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operação excedeu o timeout de ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Storage instance para rotas
const storage = new SupabaseStorage();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS básico para desenvolvimento
app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  next();
});

// Middleware para OPTIONS requests (preflight CORS)
app.options('*', (_, res) => {
  res.status(200).end();
});

// === ROTAS BÁSICAS ===

app.get('/health', (_, res) => {
  res.json({
    status: 'OK',
    service: 'Creative Teams Bot',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    workdaysOnly: process.env.WORKDAYS_ONLY !== 'false',
  });
});

app.get('/status', async (_, res) => {
  try {
    const stats = await BotScheduler.getInstance().getSystemStats();
    res.json({
      status: 'running',
      scheduler: stats.isRunning ? 'active' : 'stopped',
      nextExecution: stats.nextExecution,
      workdaysOnly: stats.workdaysOnly,
      messageStats: stats.messageStats,
      uptime: stats.uptime,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter status do sistema',
    });
  }
});

// === ROTAS DE CONTROLE ===

// Envio manual de mensagem
app.post('/send-message', async (_, res) => {
  try {
    logger.info('📤 Solicitação de envio manual recebida via POST');
    await BotScheduler.executeManually();
    res.json({
      success: true,
      message: 'Mensagem criativa enviada com sucesso!',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Erro ao enviar mensagem manual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

// Rota específica para o CRON job
app.get('/cron-trigger', async (req, res) => {
  // Debug logging para identificar a origem do request
  console.log(`[VERCEL CRON TS] Cron job recebido em ${new Date().toISOString()}`);
  console.log(`[VERCEL CRON TS] Headers:`, req.headers);
  console.log(`[VERCEL CRON TS] Query:`, req.query);
  
  try {
    logger.info('📤 Cron job da Vercel recebido (TypeScript)');
    
    // Usar o helper de timeout para garantir execução completa
    await executeWithTimeout(BotScheduler.executeManually());
    
    console.log('[VERCEL CRON TS] Execução bem-sucedida');
    
    return res.json({
      success: true,
      message: 'Mensagem disparada via cron job da Vercel (TypeScript)',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[VERCEL CRON TS] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao processar cron job',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota GET para envio manual (compatibilidade)
app.get('/send-message', async (req, res) => {
  // Log detalhado para debug
  console.log(`[GET SEND] Request recebido: ${new Date().toISOString()}`);
  console.log(`[GET SEND] Headers:`, req.headers);
  
  try {
    logger.info('📤 Solicitação de envio recebida via GET');
    await BotScheduler.executeManually();
    res.json({
      success: true,
      message: 'Mensagem criativa enviada com sucesso!',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Erro ao processar envio GET:', error);
    res.status(500).json({
      error: 'Erro ao processar envio',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Teste de conectividade
app.post('/test-connection', async (_, res) => {
  try {
    res.json({
      success: true,
      message: 'Teste de conexão realizado',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro no teste de conexão',
    });
  }
});

// === ROTAS DE ANALYTICS ===

// Estatísticas detalhadas
app.get('/analytics', async (_, res) => {
  try {
    const stats = await storage.getMessageStats();
    const insights = await storage.getContentInsights();

    res.json({
      statistics: stats,
      insights: insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao buscar analytics:', error);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
    });
  }
});

// Mensagens recentes
app.get('/messages/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const messages = await storage.getRecentMessages(Math.min(limit, 50));

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

// Atualizar efetividade de mensagem
app.patch('/messages/:id/effectiveness', async (req, res) => {
  try {
    const { id } = req.params;
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
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao atualizar efetividade',
    });
  }
});

// === MIDDLEWARE DE ERRO ===

app.use((err: Error, _: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado na aplicação:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
  });
});

// Rota 404
app.use((_, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    availableRoutes: [
      'GET /health',
      'GET /status',
      'GET /send-message',
      'POST /send-message',
      'GET /cron-trigger',
      'POST /test-connection',
      'GET /analytics',
      'GET /messages/recent',
      'PATCH /messages/:id/effectiveness',
    ],
  });
});

// === INICIALIZAÇÃO ===

// Para Vercel serverless, exportamos o app Express
export default app;

// Para execução local, inicializamos o servidor
if (process.env.NODE_ENV !== 'production') {
  async function startServer(): Promise<void> {
    try {
      logger.info('🚀 Iniciando Creative Teams Bot...');

      // Valida configurações essenciais
      validateEnvironment();

      // Inicializa o agendador
      await BotScheduler.initialize();

      app.listen(PORT, () => {
        logger.success(`🎉 Servidor rodando na porta ${PORT}`);
        logger.info(
          `📅 Agendamento ativo para ${process.env.BOT_SEND_TIME || '09:30'} (apenas dias úteis)`
        );
        logger.info(`🎨 Nível de criatividade: ${process.env.CREATIVITY_LEVEL || 'creative'}`);
        logger.info(`🔗 Acesse http://localhost:${PORT}/health para verificar status`);
      });
    } catch (error) {
      logger.error('❌ Erro crítico na inicialização:', error);
      process.exit(1);
    }
  }

  // Inicia o servidor
  startServer().catch(error => {
    logger.error('💥 Falha crítica na inicialização:', error);
    process.exit(1);
  });
}

// Validação de configurações
function validateEnvironment(): void {
  const required = [
    'OPENAI_API_KEY',
    'POWER_AUTOMATE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`❌ Variáveis de ambiente obrigatórias faltando: ${missing.join(', ')}`);
    throw new Error('Configuração incompleta');
  }

  logger.success('✅ Todas as variáveis de ambiente estão configuradas');
}

// === GRACEFUL SHUTDOWN ===

process.on('SIGINT', () => {
  logger.info('🔄 Encerrando servidor graciosamente...');
  BotScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🔄 Encerrando servidor graciosamente...');
  BotScheduler.stop();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promise rejeitada não tratada:', { reason, promise });
});

process.on('uncaughtException', error => {
  logger.error('❌ Exceção não capturada:', error);
  BotScheduler.stop();
  process.exit(1);
});

// Initialize scheduler on cold start for serverless
let schedulerInitialized = false;

if (!schedulerInitialized && process.env.NODE_ENV === 'production') {
  BotScheduler.initialize().catch(error => {
    logger.error('❌ Erro na inicialização do scheduler:', error);
  });
  schedulerInitialized = true;
}
