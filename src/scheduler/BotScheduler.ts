import cron from 'node-cron';
import { AIContentGenerator } from '../content-generator/AIContentGenerator';
import { TeamsSender } from '../senders/TeamsSender';
import { SupabaseStorage } from '../storage/SupabaseStorage';
import { logger } from '../utils/Logger';

/**
 * Orquestrador principal que gerencia o agendamento e execução do bot
 * Agora configurado para enviar apenas em dias úteis (segunda a sexta)
 */
export class BotScheduler {
  private static instance: BotScheduler;
  private contentGenerator: AIContentGenerator;
  private storage: SupabaseStorage;
  private teamsSender: TeamsSender;
  private scheduledTask: cron.ScheduledTask | null = null;
  private readonly sendTime: string;

  private constructor() {
    this.sendTime = process.env.BOT_SEND_TIME || '09:00';
    this.contentGenerator = new AIContentGenerator();
    this.storage = new SupabaseStorage();
    this.teamsSender = new TeamsSender();
  }

  /**
   * Obtém a instância singleton
   */
  public static getInstance(): BotScheduler {
    if (!BotScheduler.instance) {
      BotScheduler.instance = new BotScheduler();
    }
    return BotScheduler.instance;
  }

  /**
   * Inicializa o agendador
   */
  static async initialize(): Promise<void> {
    const scheduler = BotScheduler.getInstance();
    await scheduler.init();
  }

  /**
   * Executa manualmente o processo de geração e envio
   */
  static async executeManually(): Promise<void> {
    const scheduler = BotScheduler.getInstance();
    await scheduler.executeBot();
  }

  /**
   * Obtém o próximo horário de execução
   */
  static getNextExecutionTime(): string {
    const scheduler = BotScheduler.getInstance();
    return scheduler.getNextExecution();
  }

  /**
   * Para o agendamento
   */
  static stop(): void {
    const scheduler = BotScheduler.getInstance();
    scheduler.stopScheduler();
  }

  /**
   * Inicialização interna
   */
  private async init(): Promise<void> {
    try {
      logger.info('🚀 Inicializando Bot Scheduler...');

      // Inicializa os componentes
      await this.storage.initialize();

      // Configura o agendamento
      this.setupScheduler();

      logger.success(`Bot inicializado! Próxima execução: ${this.getNextExecution()}`);
    } catch (error) {
      logger.error('Erro na inicialização:', error);
      throw error;
    }
  }

  /**
   * Configura o agendamento usando cron - APENAS dias úteis (segunda a sexta)
   */
  private setupScheduler(): void {
    const [hour, minute] = this.sendTime.split(':').map(Number);

    if (
      hour === undefined ||
      minute === undefined ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new Error(`Horário inválido: ${this.sendTime}. Use formato HH:MM`);
    }

    // Cron para dias úteis: segunda(1) a sexta(5)
    const cronExpression = `${minute} ${hour} * * 1-5`;

    logger.info(
      `⏰ Configurando agendamento para ${this.sendTime} em dias úteis (cron: ${cronExpression})`
    );

    this.scheduledTask = cron.schedule(
      cronExpression,
      async () => {
        await this.executeBot();
      },
      {
        scheduled: true,
        timezone: 'America/Sao_Paulo',
      }
    );

    logger.success('Agendamento configurado para dias úteis!');
  }

  /**
   * Verifica se hoje é um dia útil
   */
  private isWorkday(): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Segunda a sexta
  }

  /**
   * Execução principal do bot
   */
  private async executeBot(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('🤖 Iniciando execução do bot...');

      // Verifica se é dia útil (segurança adicional)
      if (!this.isWorkday()) {
        logger.info('📅 Não é um dia útil, pulando execução...');
        return;
      }

      // 1. Busca mensagens recentes para contexto
      const recentMessages = await this.storage.getRecentMessages(15);
      const previousContents = recentMessages.map(msg => msg.content);

      // 2. Gera nova mensagem criativa
      let attempts = 0;
      let message;
      const maxGenerationAttempts = 5;

      do {
        attempts++;
        logger.info(`Tentativa ${attempts} de geração de conteúdo criativo...`);

        message = await this.contentGenerator.generateCreativeMessage(previousContents);

        // Verifica se não é duplicata
        const isDuplicate = await this.storage.isDuplicateContent(message.content);

        if (!isDuplicate) {
          break;
        }

        logger.warn(`Conteúdo duplicado detectado, tentando novamente...`);
        message = undefined;
      } while (attempts < maxGenerationAttempts);

      if (!message) {
        throw new Error('Não foi possível gerar conteúdo único após múltiplas tentativas');
      }

      // 3. Salva a mensagem
      const savedMessage = await this.storage.saveMessage(message);

      // 4. Envia para Teams
      const sendSuccess = await this.teamsSender.sendMessage(message.content);

      if (sendSuccess) {
        // 5. Marca como enviada
        await this.storage.markMessageAsSent(savedMessage.id);

        const duration = Date.now() - startTime;
        logger.success(`✅ Bot executado com sucesso em ${duration}ms`);

        // Log da mensagem enviada
        logger.info('Mensagem criativa enviada:', {
          content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          style: message.style,
          topic: message.topic,
        });
      } else {
        throw new Error('Falha no envio da mensagem');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`❌ Erro na execução do bot (${duration}ms):`, error);
      await this.handleBotError(error);
    }
  }

  /**
   * Tratamento de erros do bot
   */
  private async handleBotError(error: any): Promise<void> {
    try {
      logger.error('Sistema de tratamento de erro ativado:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      });

      // Exemplo: tentar enviar mensagem de fallback criativa
      if (error.message.includes('geração de conteúdo')) {
        logger.info('Tentando mensagem de fallback criativa...');

        const fallbackMessages = [
          '💻 Debugging é como ser detetive, só que os suspeitos são seus próprios bugs! 🕵️‍♂️',
          '🤖 IA está revolucionando tudo... inclusive a arte de procrastinar com mais eficiência! 😅',
          '⚡ Deploy na sexta-feira: a adrenalina que todo dev precisa para começar bem o fim de semana! 🚀',
        ];

        const randomFallback =
          fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
        await this.teamsSender.sendMessage(randomFallback!);
      }
    } catch (fallbackError) {
      logger.error('Erro no sistema de fallback:', fallbackError);
    }
  }

  /**
   * Calcula o próximo horário de execução (apenas dias úteis)
   */
  private getNextExecution(): string {
    const now = new Date();
    const [hour, minute] = this.sendTime.split(':').map(Number);

    let nextExecution = new Date();
    nextExecution.setHours(hour!, minute!, 0, 0);

    // Se já passou da hora hoje, vai para o próximo dia
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }

    // Pula fins de semana
    while (nextExecution.getDay() === 0 || nextExecution.getDay() === 6) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }

    return nextExecution.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Para o agendador
   */
  private stopScheduler(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = null;
      logger.info('⏹️ Agendamento interrompido');
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  async getSystemStats(): Promise<{
    nextExecution: string;
    messageStats: any;
    isRunning: boolean;
    uptime: string;
    workdaysOnly: boolean;
  }> {
    const messageStats = await this.storage.getMessageStats();

    return {
      nextExecution: this.getNextExecution(),
      messageStats,
      isRunning: this.scheduledTask !== null,
      uptime: process.uptime().toFixed(0) + ' segundos',
      workdaysOnly: true,
    };
  }
}
