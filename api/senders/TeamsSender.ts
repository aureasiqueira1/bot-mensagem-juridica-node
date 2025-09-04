import axios, { AxiosResponse } from 'axios';
import { TeamsMessage } from '../types';
import { logger } from '../utils/Logger';

/**
 * Classe responsável por enviar mensagens criativas para o Microsoft Teams
 */
export class TeamsSender {
  private readonly webhookUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor() {
    const url = process.env.POWER_AUTOMATE_URL;

    if (!url) {
      throw new Error('POWER_AUTOMATE_URL não encontrada no .env');
    }

    this.webhookUrl = url;
  }

  /**
   * Envia uma mensagem criativa para o Microsoft Teams
   */
  async sendMessage(content: string): Promise<boolean> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        attempt++;
        logger.info(`📤 Enviando mensagem criativa para Teams (tentativa ${attempt})...`);

        const message = this.formatCreativeMessage(content);

        const response: AxiosResponse = await axios.post(this.webhookUrl, message, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        if (response.status >= 200 && response.status < 300) {
          logger.success('Mensagem criativa enviada para Teams com sucesso!');
          return true;
        }

        throw new Error(`Status HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        logger.error(`Erro na tentativa ${attempt} de envio:`, {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          status: axios.isAxiosError(error) ? error.response?.status : undefined,
        });

        if (attempt >= this.maxRetries) {
          logger.error(`❌ Falha no envio após ${this.maxRetries} tentativas`);
          throw new Error(`Falha ao enviar mensagem após ${this.maxRetries} tentativas`);
        }

        await this.delay(this.retryDelay * attempt);
      }
    }

    return false;
  }

  /**
   * Formata a mensagem para máximo impacto visual no Teams
   */
  private formatCreativeMessage(content: string): TeamsMessage {
    const dayOfWeek = new Date().getDay();

    return {
      text: this.enhanceMessageWithFormatting(content),
      title: this.generateDynamicTitle(),
      summary: this.generateDynamicSummary(dayOfWeek),
      themeColor: this.getContextualThemeColor(),
    };
  }

  /**
   * Melhora a mensagem com formatação e elementos visuais
   */
  private enhanceMessageWithFormatting(content: string): string {
    const emoji = this.selectContextualEmoji(content);

    return `${emoji} Bom dia!\n\n**${content}**\n\n---\n`;
  }

  /**
   * Seleciona emoji baseado no conteúdo da mensagem
   */
  private selectContextualEmoji(content: string): string {
    const contentLower = content.toLowerCase();

    // Emojis específicos baseados no conteúdo
    if (this.containsWords(contentLower, ['bug', 'erro', 'debug'])) return '🐛';
    if (this.containsWords(contentLower, ['deploy', 'produção', 'release'])) return '🚀';
    if (this.containsWords(contentLower, ['código', 'programar', 'dev'])) return '👩‍💻';
    if (this.containsWords(contentLower, ['café', 'coffee'])) return '☕';
    if (this.containsWords(contentLower, ['javascript', 'js', 'react'])) return '⚡';
    if (this.containsWords(contentLower, ['python'])) return '🐍';
    if (this.containsWords(contentLower, ['git', 'commit'])) return '📝';
    if (this.containsWords(contentLower, ['api', 'backend'])) return '🔌';
    if (this.containsWords(contentLower, ['frontend', 'ui', 'design'])) return '🎨';
    if (this.containsWords(contentLower, ['dados', 'database', 'sql'])) return '📊';
    if (this.containsWords(contentLower, ['lei', 'lgpd', 'compliance'])) return '⚖️';
    if (this.containsWords(contentLower, ['agile', 'scrum', 'sprint'])) return '🏃‍♂️';

    // Emojis baseados no tom
    if (this.containsWords(contentLower, ['haha', 'kkk', 'risos', 'piada'])) return '😂';
    if (this.containsWords(contentLower, ['dica', 'tip', 'sugestão'])) return '💡';
    if (this.containsWords(contentLower, ['curioso', 'sabia', 'fato'])) return '🤓';
    if (this.containsWords(contentLower, ['futuro', 'evolução', 'mudança'])) return '🔮';

    // Emoji padrão baseado no dia
    const dayEmojis = ['🤖', '💻', '⚡', '🎯', '🔥'];
    const dayOfWeek = new Date().getDay();
    return dayEmojis[dayOfWeek % dayEmojis.length]!;
  }

  /**
   * Verifica se o conteúdo contém determinadas palavras
   */
  private containsWords(content: string, words: string[]): boolean {
    return words.some(word => content.includes(word));
  }

  /**
   * Gera título dinâmico baseado no dia da semana
   */
  private generateDynamicTitle(): string {
    const dayOfWeek = new Date().getDay();

    const dayTitles = {
      1: ['💪 Segunda Power', '🌟 Segunda', '⚡ Energia de Segunda'],
      2: ['🚀 Terça Turbo', '💻 Terça Produtiva', '🔥 Terça Tech'],
      3: ['🎯 Quarta Criativa', '⚡ Meio da Semana', '💡 Quarta Mágica'],
      4: ['🔥 Quinta Inovação', '🚀 Quinta Inspiradora', '💻 Quinta Quase Sexta'],
      5: ['🎉 Sexta Criativa', '🍕 Sexta Divertida', '🎊 Rumo ao Fim de Semana'],
    };

    const titles = dayTitles[dayOfWeek as keyof typeof dayTitles] || ['💻 Tech Daily'];
    return titles[Math.floor(Math.random() * titles.length)]!;
  }

  /**
   * Gera resumo dinâmico baseado no dia
   */
  private generateDynamicSummary(dayOfWeek: number): string {
    const summaries = {
      1: 'Começando a semana com energia tech!',
      2: 'Terça de produtividade e código!',
      3: 'Meio da semana, máximo de criatividade!',
      4: 'Quinta de inovação e descobertas!',
      5: 'Sexta de conquistas e celebração!',
    };

    return summaries[dayOfWeek as keyof typeof summaries] || 'Daily dose de inspiração tech!';
  }

  /**
   * Cor do tema baseada no contexto
   */
  private getContextualThemeColor(): string {
    const dayOfWeek = new Date().getDay();

    const dayColors = {
      1: '#FF6B35', // Laranja energético para segunda
      2: '#0078d4', // Azul produtivo para terça
      3: '#107c10', // Verde criativo para quarta
      4: '#5c2d91', // Roxo inovador para quinta
      5: '#d13438', // Vermelho celebrativo para sexta
    };

    return dayColors[dayOfWeek as keyof typeof dayColors] || '#0078d4';
  }

  /**
   * Utilitário para aguardar
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Testa a conectividade com mensagem criativa
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('🧪 Testando conexão com Teams...');

      const testMessage: TeamsMessage = {
        text: '🧪 **Teste de Conexão**\n\nO bot criativo está pronto para animar os dias úteis da equipe! 🎉',
        title: '🤖 Sistema Online',
        summary: 'Bot de conteúdo criativo ativo',
        themeColor: '#00bcf2',
      };

      const response = await axios.post(this.webhookUrl, testMessage, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      const success = response.status >= 200 && response.status < 300;

      if (success) {
        logger.success('Conexão com Teams estabelecida com sucesso!');
      } else {
        logger.error('Falha no teste de conexão:', response.status);
      }

      return success;
    } catch (error) {
      logger.error('Erro no teste de conexão:', error);
      return false;
    }
  }
}
