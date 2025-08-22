// Um handler EXTREMAMENTE simples para cron jobs
// Usa apenas JavaScript e técnicas básicas
// Utiliza a mesma estrutura do index.js com BotScheduler

const dotenv = require('dotenv');
const { BotScheduler } = require('./scheduler/BotScheduler');

// Carrega variáveis de ambiente
dotenv.config();

// Função para registrar mensagens no console com timestamp
function logWithTime(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Handler principal extremamente simples
module.exports = async (req, res) => {
  logWithTime('HANDLER SIMPLES - Início da execução');
  
  try {
    // Inicializa o scheduler se necessário
    logWithTime('HANDLER SIMPLES - Inicializando BotScheduler...');
    await BotScheduler.initialize();
    
    // Log antes de executar
    logWithTime('HANDLER SIMPLES - Executando BotScheduler.executeManually()...');
    
    // Execução com monitoramento de tempo
    const startTime = Date.now();
    await BotScheduler.executeManually();
    const duration = Date.now() - startTime;
    
    logWithTime(`HANDLER SIMPLES - Bot executado com sucesso em ${duration}ms!`);
    
    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso via BotScheduler',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Log detalhado do erro
    logWithTime(`HANDLER SIMPLES - ERRO: ${error.message}`);
    console.error('Detalhes completos do erro:', error);
    
    // Retornar resposta de erro
    return res.status(500).json({
      error: 'Falha ao enviar mensagem',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
