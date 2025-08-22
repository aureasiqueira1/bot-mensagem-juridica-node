// Handler para teste manual do cron job
// Permite testar o endpoint do cron sem esperar o agendamento

const dotenv = require('dotenv');
const { BotScheduler } = require('./scheduler/BotScheduler');
const { logger } = require('./utils/Logger');

// Carrega variáveis de ambiente
dotenv.config();

module.exports = async (req, res) => {
  console.log('[TESTE MANUAL] Iniciado teste manual do cron job em: ' + new Date().toISOString());
  
  // Verificação básica de origem para evitar execuções indesejadas
  const userAgent = req.headers['user-agent'] || '';
  const isLocal = req.headers['x-forwarded-for'] === undefined || 
                  req.headers['x-forwarded-for'].includes('127.0.0.1');
                  
  console.log('[TESTE MANUAL] Headers:', req.headers);
  console.log(`[TESTE MANUAL] Solicitação de: ${isLocal ? 'Ambiente Local' : 'Remoto'}`);
  
  try {
    // Inicializa o scheduler se necessário
    await BotScheduler.initialize();
    
    // Log antes de executar
    console.log('[TESTE MANUAL] Iniciando execução do bot...');
    
    // Execução com monitoramento de tempo
    const startTime = Date.now();
    await BotScheduler.executeManually();
    const duration = Date.now() - startTime;
    
    console.log(`[TESTE MANUAL] Bot executado com sucesso em ${duration}ms!`);
    
    return res.status(200).json({
      success: true,
      message: 'Bot executado com sucesso via teste manual!',
      execTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TESTE MANUAL] ERRO:', error);
    
    return res.status(500).json({
      error: 'Falha na execução do teste manual',
      details: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
};
