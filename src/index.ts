import dotenv from 'dotenv';
import express from 'express';
import { BotScheduler } from './scheduler/BotScheduler';
import { logger } from './utils/Logger';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas básicas
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AI Content Bot',
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    scheduler: 'active',
    nextExecution: BotScheduler.getNextExecutionTime(),
  });
});

// Rota manual para teste
app.post('/send-message', async (req, res) => {
  try {
    await BotScheduler.executeManually();
    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    logger.error('Erro ao enviar mensagem manual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

// Inicializa o servidor
async function startServer(): Promise<void> {
  try {
    // Inicializa o agendador
    await BotScheduler.initialize();

    app.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado na porta ${PORT}`);
      logger.info(`📅 Agendamento ativo para ${process.env.BOT_SEND_TIME || '09:00'}`);
    });
  } catch (error) {
    logger.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para graceful shutdown
process.on('SIGINT', () => {
  logger.info('🔄 Encerrando servidor...');
  BotScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🔄 Encerrando servidor...');
  BotScheduler.stop();
  process.exit(0);
});

startServer().catch(error => {
  logger.error('Falha crítica na inicialização:', error);
  process.exit(1);
});
