export default async function handler(req, res) {
  console.log('🚀 Cron job executado:', new Date().toISOString());

  // Verificar se é dia útil
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=domingo, 1=segunda, etc

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(200).json({
      message: 'Fim de semana - não enviando mensagem',
      timestamp: now.toISOString(),
      dayOfWeek,
    });
  }

  try {
    // Importar suas funções compiladas
    console.log('📝 Importando módulos...');

    // ATENÇÃO: Ajuste estes caminhos conforme sua estrutura
    const contentModule = await import('../dist/content-generator/index.js').catch(e => {
      console.log('Tentando caminho alternativo para content-generator...');
      return import('../src/content-generator/index.js');
    });

    const senderModule = await import('../dist/senders/teams-sender.js').catch(e => {
      console.log('Tentando caminho alternativo para teams-sender...');
      return import('../src/senders/teams-sender.js');
    });

    const storageModule = await import('../dist/storage/supabase.js').catch(e => {
      console.log('Tentando caminho alternativo para storage...');
      return import('../src/storage/supabase.js');
    });

    console.log('📝 Gerando conteúdo...');
    const content = await contentModule.generateContent();

    console.log('💾 Salvando no banco...');
    const savedMessage = await storageModule.saveMessage(content);

    console.log('📤 Enviando para Teams...');
    const result = await senderModule.sendToTeams(content);

    console.log('✅ Mensagem enviada com sucesso!');

    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      content: content.text,
      timestamp: now.toISOString(),
      messageId: savedMessage?.id,
      teamsResult: result,
    });
  } catch (error) {
    console.error('❌ Erro no agendamento:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: now.toISOString(),
    });
  }
}
