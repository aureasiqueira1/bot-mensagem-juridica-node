export default async function handler(req, res) {
  console.log('🚀 Cron job executado:', new Date().toISOString());

  // Verificar se é dia útil
  const now = new Date();
  const dayOfWeek = now.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(200).json({
      message: 'Fim de semana - não enviando mensagem',
      timestamp: now.toISOString(),
      dayOfWeek,
    });
  }

  try {
    // Teste simples primeiro
    return res.status(200).json({
      success: true,
      message: 'Cron job funcionando!',
      timestamp: now.toISOString(),
      dayOfWeek,
    });
  } catch (error) {
    console.error('❌ Erro no agendamento:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: now.toISOString(),
    });
  }
}
