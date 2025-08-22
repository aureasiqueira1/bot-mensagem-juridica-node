import dotenv from 'dotenv';
import { BotScheduler } from './scheduler/BotScheduler';
import { logger } from './utils/Logger';

// Carrega variáveis de ambiente
dotenv.config();

// Importação de tipos do Express
import type { Request, Response } from 'express';

// Função específica otimizada para o cron job da Vercel
export default async function cronHandler(req: Request, res: Response) {
  // Log detalhado para rastreamento do cron job
  console.log(`[VERCEL CRON HANDLER] Requisição recebida em: ${new Date().toISOString()}`);
  console.log(`[VERCEL CRON HANDLER] Headers:`, req.headers);
  
  try {
    logger.info('🔄 Cron job da Vercel executando via handler otimizado');
    
    // Garantir que o scheduler esteja inicializado
    const scheduler = BotScheduler.getInstance();
    
    // Executar o bot manualmente com timeout aumentado
    const result = await Promise.race([
      BotScheduler.executeManually(),
      new Promise((_, reject) => setTimeout(() => 
        reject(new Error('Timeout na execução do bot')), 
        50000 // 50 segundos de timeout
      ))
    ]);
    
    console.log('[VERCEL CRON HANDLER] Execução concluída com sucesso');
    
    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso via cron job da Vercel',
      timestamp: new Date().toISOString(),
      source: 'vercel_optimized_cron'
    });
  } catch (error) {
    console.error('[VERCEL CRON ERROR]', error);
    logger.error('❌ Erro na execução do cron job da Vercel:', error);
    
    return res.status(500).json({
      error: 'Falha na execução do cron job',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
}
