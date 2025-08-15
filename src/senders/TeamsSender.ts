import axios, { AxiosResponse } from 'axios';
import { TeamsMessage } from '../types';
import { logger } from '../utils/Logger';

/**
 * Classe responsável por enviar mensagens para o Microsoft Teams via Power Automate
 */
export class TeamsSender {
  private readonly webhookUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000; // 2 segundos

  constructor() {
    const url = process.env.POWER_AUTOMATE_URL;

    if (!url) {
      throw new Error('POWER_AUTOMATE_URL não encontrada no .env');
    }

    this.webhookUrl = url;
  }

  /**
   * Envia uma mensagem para o Microsoft Teams
   */
  async sendMessage(content: string): Promise<boolean> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        attempt++;
        logger.info(`📤 Enviando mensagem para Teams (tentativa ${attempt})...`);

        const message = this.formatMessage(content);

        const response: AxiosResponse = await axios.post(this.webhookUrl, message, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        });

        if (response.status >= 200 && response.status < 300) {
          logger.success('Mensagem enviada para Teams com sucesso!');
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

        // Aguarda antes da próxima tentativa
        await this.delay(this.retryDelay * attempt);
      }
    }

    return false;
  }

  /**
   * Formata a mensagem para o formato esperado pelo Power Automate/Teams
   */
  private formatMessage(content: string): TeamsMessage {
    return {
      text: this.addEmojisAndFormatting(content),
      title: this.generateTitle(),
      summary: 'Mensagem diária do Bot Jurídico-Tech',
      themeColor: this.getRandomThemeColor(),
    };
  }

  /**
   * Adiciona emojis e formatação para deixar a mensagem mais atrativa
   */
  private addEmojisAndFormatting(content: string): string {
    // Identifica o tipo de conteúdo e adiciona emoji apropriado
    let emoji = '🤖';

    if (this.isLegalContent(content)) emoji = '⚖️';
    else if (this.isTechContent(content)) emoji = '💻';
    else if (this.isHumorous(content)) emoji = '😄';
    else if (this.isTip(content)) emoji = '💡';
    else if (this.isReflective(content)) emoji = '🤔';

    // Adiciona quebras de linha e formatação
    const formattedContent = content
      .replace(/\. ([A-Z])/g, '.\n\n$1') // Quebra linha após frases
      .replace(/([?!])\s*([A-Z])/g, '$1\n\n$2'); // Quebra linha após perguntas/exclamações

    return `${emoji} Dica Diária Jurídico-Tech\n\n${formattedContent}\n\n---\n*Bot Jurídico-Tech • ${this.getCurrentTime()}*`;
  }

  /**
   * Gera um título dinâmico baseado na hora
   */
  private generateTitle(): string {
    const hour = new Date().getHours();
    const titles = [
      'Insights Jurídico-Tech',
      'Direito Digital Diário',
      'Compliance & Código',
      'Inovação Jurídica',
      'Tech Law Brasil',
    ];

    if (hour < 12) return `🌅 Bom dia! ${titles[Math.floor(Math.random() * titles.length)]}`;
    if (hour < 18) return `☀️ Boa tarde! ${titles[Math.floor(Math.random() * titles.length)]}`;
    return `🌙 Boa noite! ${titles[Math.floor(Math.random() * titles.length)]}`;
  }

  /**
   * Retorna uma cor aleatória para o tema da mensagem
   */
  private getRandomThemeColor(): string {
    const colors = [
      '#0078d4', // Azul Microsoft
      '#107c10', // Verde
      '#d13438', // Vermelho
      '#ff8c00', // Laranja
      '#5c2d91', // Roxo
      '#00bcf2', // Azul claro
    ];

    return colors[Math.floor(Math.random() * colors.length)]!;
  }

  /**
   * Detecta se o conteúdo é relacionado ao direito
   */
  private isLegalContent(content: string): boolean {
    const legalKeywords = [
      'lei',
      'direito',
      'jurídico',
      'advogado',
      'tribunal',
      'lgpd',
      'compliance',
      'contrato',
      'legal',
      'regulamentação',
      'norma',
    ];

    return legalKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  /**
   * Detecta se o conteúdo é relacionado à tecnologia
   */
  private isTechContent(content: string): boolean {
    const techKeywords = [
      'código',
      'software',
      'desenvolvedor',
      'programação',
      'api',
      'sistema',
      'digital',
      'tecnologia',
      'dados',
      'algoritmo',
    ];

    return techKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  /**
   * Detecta se o conteúdo é humorístico
   */
  private isHumorous(content: string): boolean {
    const humorIndicators = ['😄', '😂', 'haha', 'kkkk', '!', 'piada'];
    return humorIndicators.some(indicator =>
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Detecta se o conteúdo é uma dica
   */
  private isTip(content: string): boolean {
    const tipKeywords = [
      'dica',
      'tip',
      'sugestão',
      'recomendação',
      'evite',
      'faça',
      'lembre-se',
      'importante',
      'cuidado',
    ];

    return tipKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  /**
   * Detecta se o conteúdo é reflexivo
   */
  private isReflective(content: string): boolean {
    const reflectiveKeywords = [
      'reflexão',
      'pense',
      'considere',
      'imagine',
      'futuro',
      'evolução',
      'transformação',
      'impacto',
    ];

    return reflectiveKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  /**
   * Retorna a hora atual formatada
   */
  private getCurrentTime(): string {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  }

  /**
   * Utilitário para aguardar
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Testa a conectividade com o Teams
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('🧪 Testando conexão com Teams...');

      const testMessage: TeamsMessage = {
        text: '🧪 Teste de Conexão\n\nEste é um teste automatizado do Bot Jurídico-Tech.',
        title: 'Teste de Conexão',
        summary: 'Teste de conectividade',
        themeColor: '#ffa500',
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
