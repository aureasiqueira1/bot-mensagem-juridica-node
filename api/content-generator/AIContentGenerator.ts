import { OpenAI } from 'openai';
import { ContentGenerationPrompt, Message, MessageStyle, MessageTopic } from '../types';
import { logger } from '../utils/Logger';

/**
 * Gerador de conteúdo criativo e bem-humorado para engajar a equipe
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
   * Gera uma mensagem criativa focada em humor e engajamento
   */
  async generateCreativeMessage(): Promise<Message> {
    // Escolhe estilo e tópico de forma inteligente para manter variedade
    const { style, topic } = this.selectOptimalStyleAndTopic();

    return this.generateMessage({
      style,
      topic,
    });
  }

  /**
   * Seleciona o melhor estilo e tópico baseado no histórico
   */
  private selectOptimalStyleAndTopic(): {
    style: MessageStyle;
    topic: MessageTopic;
  } {
    const dayOfWeek = new Date().getDay();

    // Segunda-feira: energia positiva
    if (dayOfWeek === 1) {
      return {
        style: Math.random() > 0.5 ? MessageStyle.HUMOR : MessageStyle.TIP,
        topic: MessageTopic.TECH_HUMOR,
      };
    }

    // Terça e Quarta: conteúdo técnico mais sério
    if (dayOfWeek === 2 || dayOfWeek === 3) {
      return {
        style: Math.random() > 0.6 ? MessageStyle.CURIOSITY : MessageStyle.TIP,
        topic: this.getRandomTopic(),
      };
    }

    // Quinta: reflexivo mas descontraído
    if (dayOfWeek === 4) {
      return {
        style: Math.random() > 0.7 ? MessageStyle.REFLECTION : MessageStyle.HUMOR,
        topic: MessageTopic.MIXED,
      };
    }

    // Sexta: humor para terminar bem a semana
    if (dayOfWeek === 5) {
      return {
        style: MessageStyle.HUMOR,
        topic: this.getRandomTopic(),
      };
    }

    // Fallback (não deveria acontecer em dias úteis)
    return {
      style: MessageStyle.HUMOR,
      topic: MessageTopic.MIXED,
    };
  }

  /**
   * Gera uma mensagem com parâmetros específicos
   */
  async generateMessage(prompt: ContentGenerationPrompt): Promise<Message> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        attempt++;
        logger.info(`🎨 Gerando conteúdo criativo (tentativa ${attempt})...`, {
          style: prompt.style,
          topic: prompt.topic,
        });

        const systemPrompt = await this.buildCreativeSystemPrompt(prompt);
        const userPrompt = this.buildCreativeUserPrompt(prompt);

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 200,
          temperature: 1.0, // Máxima criatividade
          presence_penalty: 1.2, // Forte penalidade para repetições
          frequency_penalty: 0.8, // Evita palavras repetidas
          top_p: 0.9, // Diversidade na seleção
        });

        const fallbackMessages = this.getFallbackMessages();

        const content = completion.choices[0]?.message?.content?.trim();

        if (!content) {
          throw new Error('Resposta vazia da API de IA');
        }

        // Valida a mensagem
        const validation = this.validateMessage(content);
        if (!validation.isValid) {
          logger.warn('Mensagem não passou na validação:', validation.issues);
          throw new Error(`Mensagem inválida: ${validation.issues.join(', ')}`);
        }

        const message: Message = {
          content: this.polishMessage(content),
          style: prompt.style,
          topic: prompt.topic,
        };

        logger.success('Conteúdo criativo gerado com sucesso');
        return message;
      } catch (error) {
        logger.error(`Erro na tentativa ${attempt} de geração:`, error);

        if (attempt >= this.maxRetries) {
          throw new Error(`Falha ao gerar conteúdo após ${this.maxRetries} tentativas: ${error}`);
        }

        await this.delay(2000 * attempt);
      }
    }

    throw new Error('Falha inesperada na geração de conteúdo');
  }

  /**
   * Constrói o prompt do sistema focado em criatividade e humor
   */
  private async buildCreativeSystemPrompt(prompt: ContentGenerationPrompt): Promise<string> {
    const basePrompt = `Você é um especialista em criar conteúdo SUPER CRIATIVO e bem-humorado para uma equipe de tecnologia.

🎯 OBJETIVO: Criar mensagens que façam a equipe SORRIR e se ENGAJAR todos os dias úteis.

📏 FORMATO:
- Responda APENAS com o conteúdo da mensagem
- 1-2 frases curtas e impactantes
- Máximo 200 caracteres
- Português brasileiro, informal e divertido
- NUNCA repita ideias anteriores

👥 PÚBLICO: Desenvolvedores, PMs, designers, e pessoal de tech em geral
🎨 TOM: Descontraído, inteligente, com humor refinado (não forçado)`;

    const enhancedStyleInstructions = {
      [MessageStyle.HUMOR]: `
ESTILO: HUMOR INTELIGENTE
✨ Crie piadas originais sobre:
- Bugs que se comportam bem só na demo
- A relação amor/ódio com JavaScript
- Comentários de código hilários
- Situações absurdas do dia a dia tech
- Memes que devs vão entender na hora
🎭 Use ironia sutil e referências que ressoem com a galera tech`,

      [MessageStyle.CURIOSITY]: `
ESTILO: CURIOSIDADE FASCINANTE
🔍 Compartilhe fatos que vão fazer a pessoa pensar "nossa, não sabia disso!":
- Histórias malucas por trás de tecnologias famosas
- Bugs históricos que mudaram o mundo
- Easter eggs escondidos em sistemas conhecidos
- Estatísticas surpreendentes sobre desenvolvimento
💡 Faça perguntas que despertem a curiosidade`,

      [MessageStyle.TIP]: `
ESTILO: DICAS PRÁTICAS E DIVERTIDAS
🛠️ Dê dicas que realmente ajudem, mas com humor:
- Shortcuts que vão fazer a pessoa se sentir ninja
- Truques para debuggar mais rápido
- Boas práticas explicadas de forma engraçada
- Ferramentas ou extensões incríveis
⚡ Seja útil E divertido ao mesmo tempo`,

      [MessageStyle.REFLECTION]: `
ESTILO: REFLEXÕES COM HUMOR
🤔 Provoque pensamentos sobre:
- Como a tecnologia está mudando nossas vidas (de forma engraçada)
- Paradoxos hilários do mundo tech
- Previsões malucas sobre o futuro da programação
- Filosofia de botão: "Por que esse botão existe?"
🎯 Seja profundo mas mantenha o tom leve e divertido`,
    };

    const topicInstructions = {
      [MessageTopic.TECH_HUMOR]:
        'Foque em humor inteligente sobre tecnologia, linguagens e ferramentas',
      [MessageTopic.DEV_LIFE]:
        'Situações engraçadas da vida real de desenvolvedor - memes internos da profissão',
      [MessageTopic.CODE_WISDOM]:
        'Sabedoria sobre programação com humor - boas práticas de forma divertida',
      [MessageTopic.TECH_FACTS]: 'Curiosidades fascinantes sobre tecnologia que vão impressionar',
      [MessageTopic.LEGAL_TECH]:
        'Misture direito e tecnologia de forma criativa (LGPD, compliance, contratos digitais)',
      [MessageTopic.DEVELOPMENT]:
        'Foque em desenvolvimento, linguagens, frameworks, debugging, deploy',
      [MessageTopic.PROJECT_MANAGEMENT]:
        'Una gestão de projetos com realidade de desenvolvedor (sprints, deadlines, etc)',
      [MessageTopic.AGILE]:
        'Conecte metodologias ágeis com situações reais e divertidas do dia a dia',
      [MessageTopic.MIXED]: 'Combine temas livremente - seja criativo e surpreendente!',
    };

    const avoidanceContext = await this.buildAvoidanceContext();

    return `${basePrompt}

${enhancedStyleInstructions[prompt.style]}

🎯 TÓPICO: ${topicInstructions[prompt.topic]}

${avoidanceContext}

🚀 IMPORTANTE: Sua missão é fazer a equipe começar o dia com um sorriso!`;
  }

  /**
   * Constrói contexto de mensagens para evitar repetições (melhorado)
   */
  private async buildAvoidanceContext(): Promise<string> {
    try {
      const storage = new (await import('../storage/SupabaseStorage')).SupabaseStorage();
      const recentMessages = await storage.getRecentMessages(20);

      if (recentMessages.length === 0) {
        return '';
      }

      // Extrai temas/conceitos principais das mensagens recentes
      const themes = this.extractThemes(recentMessages.map(m => m.content));

      return `🚫 EVITE REPETIR estes temas/conceitos já usados recentemente:
${themes
  .slice(0, 10)
  .map((theme: string, i: number) => `${i + 1}. ${theme}`)
  .join('\n')}

📝 Últimas mensagens (para referência):
${recentMessages
  .slice(0, 5)
  .map((msg, i: number) => `${i + 1}. "${msg.content.substring(0, 60)}..."`)
  .join('\n')}`;
    } catch (error) {
      return '🚫 SEJA CRIATIVO: Evite repetir temas comuns como bugs históricos, mariposas, etc.';
    }
  }

  /**
   * Extrai temas principais das mensagens para evitar repetições
   */
  private extractThemes(messages: string[]): string[] {
    const commonThemes = new Set<string>();

    messages.forEach(message => {
      const lowerMsg = message.toLowerCase();

      // Detecta temas específicos
      if (lowerMsg.includes('bug') || lowerMsg.includes('mariposa')) {
        commonThemes.add('bugs históricos/mariposas');
      }
      if (lowerMsg.includes('javascript') || lowerMsg.includes('js')) {
        commonThemes.add('JavaScript');
      }
      if (lowerMsg.includes('deploy') || lowerMsg.includes('sexta')) {
        commonThemes.add('deploy de sexta-feira');
      }
      if (lowerMsg.includes('git') || lowerMsg.includes('commit')) {
        commonThemes.add('Git/commits');
      }
      if (lowerMsg.includes('css') || lowerMsg.includes('frontend')) {
        commonThemes.add('CSS/Frontend');
      }
      if (lowerMsg.includes('api') || lowerMsg.includes('backend')) {
        commonThemes.add('APIs/Backend');
      }
      if (lowerMsg.includes('ia') || lowerMsg.includes('machine learning')) {
        commonThemes.add('IA/Machine Learning');
      }
      if (lowerMsg.includes('scrum') || lowerMsg.includes('agile')) {
        commonThemes.add('Metodologias ágeis');
      }
      if (lowerMsg.includes('docker') || lowerMsg.includes('kubernetes')) {
        commonThemes.add('Containerização');
      }
      if (lowerMsg.includes('lgpd') || lowerMsg.includes('compliance')) {
        commonThemes.add('LGPD/Compliance');
      }
    });

    return Array.from(commonThemes);
  }

  /**
   * Constrói o prompt do usuário com contexto temporal
   */
  private buildCreativeUserPrompt(prompt: ContentGenerationPrompt): string {
    const dayContext = this.getDayContext();
    const timeContext = this.getTimeContext();

    return `Crie uma mensagem ${prompt.style} sobre ${
      prompt.topic
    } para ${dayContext}${timeContext}.

🎨 A mensagem deve ser:
✅ SUPER criativa e original
✅ Bem-humorada e engajante
✅ Curta (1-2 frases, máx 200 chars)
✅ Que faça a equipe sorrir
✅ Com referências que devs vão entender

${this.getStyleSpecificInstructions(prompt.style)}

Responda APENAS com o conteúdo da mensagem:`;
  }

  /**
   * Instruções específicas por estilo
   */
  private getStyleSpecificInstructions(style: MessageStyle): string {
    switch (style) {
      case MessageStyle.HUMOR:
        return '😄 Use humor inteligente - faça uma piada que vai arrancar risadas!';
      case MessageStyle.CURIOSITY:
        return '🤯 Compartilhe algo que vai fazer a pessoa falar "caramba, não sabia disso!"';
      case MessageStyle.TIP:
        return '💡 Dê uma dica prática mas com um toque divertido que vai ajudar mesmo!';
      case MessageStyle.REFLECTION:
        return '🤔 Faça uma provocação filosófica sobre tech que vai gerar discussão!';
    }
  }

  /**
   * Obtém contexto do dia da semana
   */
  private getDayContext(): string {
    const day = new Date().getDay();
    const dayNames = {
      1: 'começar bem a segunda',
      2: 'animar a terça',
      3: 'acelerar a quarta',
      4: 'energizar a quinta',
      5: 'fechar a sexta com chave de ouro',
    };

    return dayNames[day as keyof typeof dayNames] || 'alegrar o dia';
  }

  /**
   * Obtém contexto temporal baseado no horário de Brasília
   */
  private getTimeContext(): string {
    // Força horário de Brasília (UTC-3)
    const now = new Date();
    const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hour = brasiliaTime.getHours();

    if (hour < 12) return ' de manhã';
    if (hour < 14) return ' no almoço';
    if (hour < 18) return ' da tarde';
    return ' do fim do expediente';
  }

  /**
   * Seleciona tópico aleatório
   */
  private getRandomTopic(): MessageTopic {
    // Prioriza tópicos novos (mais específicos)
    const preferredTopics = [
      MessageTopic.TECH_HUMOR,
      MessageTopic.DEV_LIFE,
      MessageTopic.CODE_WISDOM,
      MessageTopic.TECH_FACTS,
    ];

    // 80% chance de usar tópicos preferidos, 20% qualquer tópico
    if (Math.random() < 0.8) {
      return preferredTopics[Math.floor(Math.random() * preferredTopics.length)]!;
    }

    const allTopics = Object.values(MessageTopic);
    return allTopics[Math.floor(Math.random() * allTopics.length)]!;
  }

  /**
   * Aplica polimento final na mensagem
   */
  private polishMessage(content: string): string {
    // Remove quebras desnecessárias e ajusta pontuação
    return content
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([.!?])/g, '$1') // Remove pontuação duplicada
      .trim();
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

    if (content.length > 200) {
      issues.push('Mensagem muito longa (>200 caracteres)');
    }

    if (content.length < 15) {
      issues.push('Mensagem muito curta (<15 caracteres)');
    }

    // Verifica se tem conteúdo substantivo
    if (content.split(' ').length < 3) {
      issues.push('Mensagem com poucas palavras');
    }

    // Verifica se não é apenas emoji
    if (/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(content)) {
      issues.push('Mensagem contém apenas emojis');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Gera uma mensagem com estilo e tópico aleatórios (método antigo mantido para compatibilidade)
   */
  async generateRandomMessage(): Promise<Message> {
    return this.generateCreativeMessage();
  }

  /**
   * Gera conteúdo especial para ocasiões específicas
   */
  async generateSpecialOccasionMessage(
    occasion: 'monday' | 'friday' | 'deadline' | 'deploy'
  ): Promise<Message> {
    const specialPrompts = {
      monday: {
        style: MessageStyle.HUMOR,
        topic: MessageTopic.TECH_HUMOR,
        context: 'segunda-feira motivacional',
      },
      friday: {
        style: MessageStyle.HUMOR,
        topic: MessageTopic.DEV_LIFE,
        context: 'sexta-feira celebrativa',
      },
      deadline: {
        style: MessageStyle.HUMOR,
        topic: MessageTopic.PROJECT_MANAGEMENT,
        context: 'deadline se aproximando',
      },
      deploy: {
        style: MessageStyle.HUMOR,
        topic: MessageTopic.DEVELOPMENT,
        context: 'deploy em produção',
      },
    };

    const config = specialPrompts[occasion];

    return this.generateMessage({
      style: config.style,
      topic: config.topic,
      specialContext: config.context,
    });
  }

  /**
   * Obtém banco de mensagens de emergência para fallback (diversificadas)
   */
  getFallbackMessages(): string[] {
    return [
      `💻 CSS: a única linguagem onde 'center' não significa centralizar! 😅`,
      `🎯 Programador feliz: quando o código compila na primeira tentativa! ✨`,
      `🔄 Refatorar código antigo é como reformar casa: sempre demora 3x mais! 🏠`,
      `📊 Estatística: 73% dos devs inventam estatísticas na hora! 📈`,
      `🎨 UX Designer: 'Pode mover isso 2px pra esquerda?' Dev: *suspiro profundo* 😤`,
      `🚀 Kubernetes: transformando 1 problema em 47 problemas distribuídos! ☁️`,
      `💡 Pair programming: duas pessoas, um teclado, infinitas discussões! 👥`,
      `🔐 Senha forte: 123456Strong! Hackear? Impossível! 🛡️`,
      `📱 App mobile: 'Funciona no meu iPhone 6!' - Dev em 2024 📞`,
      `⚡ Microserviços: porque 1 monolito era pouco caos! 🏗️`,
      `🎭 Staging vs Produção: irmãos gêmeos que nunca se parecem! 🔄`,
      `🧪 Testes unitários: 100% cobertura, 0% confiança! 🎯`,
    ];
  }
}
