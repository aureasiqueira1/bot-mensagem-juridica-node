// Um handler EXTREMAMENTE simples para cron jobs
// Usa apenas JavaScript e técnicas básicas
// Nenhuma dependência de middleware complexo

const axios = require('axios');
const dotenv = require('dotenv');

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
    
    logWithTime('HANDLER SIMPLES - Enviando mensagem para o Teams');
    
    // Enviar uma mensagem diretamente ao Teams com axios
    const response = await axios.post(teamsUrl, {
      title: 'Mensagem Automática do Bot',
      text: `Esta é uma mensagem de teste enviada pelo cron job da Vercel às ${new Date().toLocaleString()}`
    });
    
    logWithTime(`HANDLER SIMPLES - Mensagem enviada com sucesso, status: ${response.status}`);
    
    // Retornar resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada diretamente para o Teams',
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
