import { OpenAI } from 'openai';
import { ContentGenerationPrompt, Message, MessageStyle, MessageTopic } from '../types';
import { logger } from '../utils/Logger';

/**
 * Gerador de conteúdo usando IA para criar mensagens criativas e únicas
 */
export class AIContentGenerator {
  private openai: OpenAI;
  private readonly maxRetries = 3;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não encontrada no .env');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Gera uma mensagem criativa baseada nos parâmetros
   */
  async generateMessage(prompt: ContentGenerationPrompt): Promise<Message> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        attempt++;
        logger.info(`🤖 Gerando conteúdo (tentativa ${attempt})...`, {
          style: prompt.style,
          topic: prompt.topic,
        });

        const systemPrompt = this.buildSystemPrompt(prompt);
        const userPrompt = this.buildUserPrompt(prompt);

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.8,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        });

        const content = completion.choices[0]?.message?.content?.trim();

        if (!content) {
          throw new Error('Resposta vazia da API de IA');
        }

        const message: Message = {
          content,
          style: prompt.style,
          topic: prompt.topic,
        };

        logger.success('Conteúdo gerado com sucesso');
        return message;
      } catch (error) {
        logger.error(`Erro na tentativa ${attempt} de geração:`, error);

        if (attempt >= this.maxRetries) {
          throw new Error(`Falha ao gerar conteúdo após ${this.maxRetries} tentativas: ${error}`);
        }

        // Aguarda antes da próxima tentativa
        await this.delay(2000 * attempt);
      }
    }

    throw new Error('Falha inesperada na geração de conteúdo');
  }

  /**
   * Constrói o prompt do sistema baseado no estilo e tópico
   */
  private buildSystemPrompt(prompt: ContentGenerationPrompt): string {
    const basePrompt = `Você é um assistente especializado em criar conteúdo envolvente que mistura direito e tecnologia.

REGRAS FUNDAMENTAIS:
- Responda APENAS com o conteúdo da mensagem, sem explicações adicionais
- Máximo de 280 caracteres (formato ideal para Teams)
- Linguagem brasileira, informal mas profissional
- NUNCA repita conteúdo já enviado anteriormente
- Seja criativo e original em cada mensagem

CONTEXTO: Público-alvo são desenvolvedores, PMs, advogados que trabalham com tecnologia.`;

    const styleInstructions = {
      [MessageStyle.HUMOR]:
        'Use humor leve e inteligente. Faça piadas relacionadas ao mundo jurídico-tech.',
      [MessageStyle.CURIOSITY]:
        'Compartilhe curiosidades interessantes sobre direito digital, compliance ou tech law.',
      [MessageStyle.TIP]:
        'Dê dicas práticas e aplicáveis sobre compliance, LGPD, contratos tech, ou melhores práticas.',
      [MessageStyle.REFLECTION]:
        'Faça provocações reflexivas sobre ética digital, futuro do direito, ou impactos da tecnologia.',
    };

    const topicInstructions = {
      [MessageTopic.LEGAL_TECH]:
        'Foque em legal tech, inovações no direito, ferramentas jurídicas digitais.',
      [MessageTopic.DEVELOPMENT]:
        'Misture desenvolvimento de software com aspectos legais (licenças, propriedade intelectual).',
      [MessageTopic.PROJECT_MANAGEMENT]:
        'Una gestão de projetos com compliance e aspectos contratuais.',
      [MessageTopic.AGILE]: 'Conecte metodologias ágeis com processos legais e compliance.',
      [MessageTopic.MIXED]: 'Combine livremente temas de direito e tecnologia de forma criativa.',
    };

    return `${basePrompt}

ESTILO: ${styleInstructions[prompt.style]}

TÓPICO: ${topicInstructions[prompt.topic]}

${
  prompt.previousMessages && prompt.previousMessages.length > 0
    ? `EVITE REPETIR: Não reuse ideias similares a estas mensagens anteriores:\n${prompt.previousMessages
        .slice(0, 5)
        .map(msg => `- ${msg.substring(0, 100)}...`)
        .join('\n')}`
    : ''
}`;
  }

  /**
   * Constrói o prompt do usuário
   */
  private buildUserPrompt(prompt: ContentGenerationPrompt): string {
    const timeContext = this.getTimeContext();

    return `Crie uma mensagem ${prompt.style} sobre ${prompt.topic} para enviar agora ${timeContext}.

A mensagem deve ser:
✅ Original e criativa
✅ Relevante para o público tech-jurídico
✅ Máximo 280 caracteres
✅ Em português brasileiro
✅ Engajante e interessante

Responda apenas com o conteúdo da mensagem:`;
  }

  /**
   * Obtém contexto temporal para tornar as mensagens mais relevantes
   */
  private getTimeContext(): string {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo, 1 = segunda, etc.
    const date = now.getDate();

    if (hour < 12) return '(manhã)';
    if (hour < 18) return '(tarde)';
    if (day === 1) return '(segunda-feira)';
    if (day === 5) return '(sexta-feira)';
    if ([0, 6].includes(day)) return '(fim de semana)';

    return '';
  }

  /**
   * Gera uma mensagem com estilo e tópico aleatórios
   */
  async generateRandomMessage(previousMessages?: string[]): Promise<Message> {
    const styles = Object.values(MessageStyle);
    const topics = Object.values(MessageTopic);

    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    return this.generateMessage({
      style: randomStyle!,
      topic: randomTopic!,
      previousMessages,
    });
  }

  /**
   * Utilitário para aguardar
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valida se a mensagem gerada está dentro dos critérios
   */
  private validateMessage(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (content.length > 280) {
      issues.push('Mensagem muito longa (>280 caracteres)');
    }

    if (content.length < 20) {
      issues.push('Mensagem muito curta (<20 caracteres)');
    }

    if (!/[.!?]$/.test(content)) {
      issues.push('Mensagem não termina com pontuação adequada');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
