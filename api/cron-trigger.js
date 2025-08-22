// Handler específico para cron jobs da Vercel
// Este arquivo usa JavaScript puro para garantir compatibilidade

const dotenv = require('dotenv');
const { BotScheduler } = require('./scheduler/BotScheduler');
const { logger } = require('./utils/Logger');

// Carrega variáveis de ambiente
dotenv.config();

// Este é um handler extremamente simples e direto para execução do cron job
module.exports = async (req, res) => {
  // Logs para debug
  console.log('[CRON JOB SIMPLES] Iniciado em: ' + new Date().toISOString());
  
  try {
    // Inicialização do scheduler se necessário
    await BotScheduler.initialize();
    
    // Execução do bot com timeout longo
    console.log('[CRON JOB SIMPLES] Executando bot...');
    
    // Executar com tempo suficiente
    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout na execução do bot após 25 segundos'));
      }, 25000);
      
      BotScheduler.executeManually()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
    
    console.log('[CRON JOB SIMPLES] Execução concluída com sucesso!');
    
    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Bot executado com sucesso via cron job simplificado!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON JOB SIMPLES] ERRO:', error);
    
    // Resposta de erro
    return res.status(500).json({
      error: 'Falha na execução do cron job',
      details: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
};
