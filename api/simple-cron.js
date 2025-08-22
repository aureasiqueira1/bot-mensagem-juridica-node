// Um handler EXTREMAMENTE simples para cron jobs
// Usa apenas JavaScript e técnicas básicas
// Nenhuma dependência de middleware complexo

const axios = require('axios');
const dotenv = require('dotenv');
const { AIContentGenerator } = require('./content-generator/AIContentGenerator');

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
    // Obter URL do webhook do Teams das variáveis de ambiente
    const teamsUrl = process.env.POWER_AUTOMATE_URL;
    
    if (!teamsUrl) {
      throw new Error('URL do webhook do Teams não configurada');
    }
    
    logWithTime('HANDLER SIMPLES - Gerando mensagem criativa via AIContentGenerator');
    
    // Criar instância do gerador de conteúdo
    const contentGenerator = new AIContentGenerator();
    
    // Gerar mensagem criativa
    let message;
    try {
      // Tentar gerar mensagem criativa
      message = await contentGenerator.generateCreativeMessage();
      logWithTime(`HANDLER SIMPLES - Mensagem criativa gerada com sucesso: ${message.content}`);
    } catch (generatorError) {
      // Em caso de erro, usar mensagem de fallback
      logWithTime(`HANDLER SIMPLES - Erro ao gerar mensagem criativa: ${generatorError.message}`);
      const fallbackMessages = contentGenerator.getFallbackMessages();
      const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
      message = {
        content: fallbackMessages[randomIndex],
        style: 'HUMOR',
        topic: 'TECH_HUMOR'
      };
      logWithTime(`HANDLER SIMPLES - Usando mensagem de fallback: ${message.content}`);
    }
    
    logWithTime('HANDLER SIMPLES - Enviando mensagem para o Teams');
    
    // Enviar a mensagem criativa ao Teams
    const response = await axios.post(teamsUrl, {
      title: 'Mensagem Criativa do Bot',
      text: message.content
    });
    
    logWithTime(`HANDLER SIMPLES - Mensagem enviada com sucesso, status: ${response.status}`);
    
    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Mensagem criativa enviada com sucesso para o Teams',
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
