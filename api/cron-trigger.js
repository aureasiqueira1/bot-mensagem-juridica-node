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
  
  // Verificar se a requisição veio do cron job da Vercel
  const userAgent = req.headers['user-agent'] || '';
  const isVercelCron = userAgent.includes('vercel-cron');
  
  console.log(`[CRON JOB SIMPLES] Requisição: User-Agent = ${userAgent}`);
  console.log(`[CRON JOB SIMPLES] Identificado como cron job Vercel: ${isVercelCron}`);
  
  try {
    // Inicialização do scheduler se necessário
    await BotScheduler.initialize();
    
    // Execução do bot com timeout mais curto para Vercel
    console.log('[CRON JOB SIMPLES] Executando bot...');
    console.log('[CRON JOB SIMPLES] Método HTTP:', req.method);
    console.log('[CRON JOB SIMPLES] Headers:', JSON.stringify(req.headers, null, 2));
    
    // Executar com tempo suficiente
    // Usar timeout diferente dependendo da origem
    const timeoutDuration = isVercelCron ? 15000 : 25000;
    console.log(`[CRON JOB SIMPLES] Usando timeout de ${timeoutDuration}ms`);
    
    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout na execução do bot após ${timeoutDuration/1000} segundos`));
      }, timeoutDuration);
      
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
