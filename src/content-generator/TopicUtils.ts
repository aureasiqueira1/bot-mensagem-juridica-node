import { MessageTopic } from '../types';

/**
 * Utilitários para gerenciar tópicos de mensagens e compatibilidade
 */
export class TopicUtils {
  /**
   * Mapeamento de tópicos antigos para novos (para migração)
   */
  static readonly TOPIC_MIGRATION_MAP: Record<string, MessageTopic> = {
    legal_tech: MessageTopic.LEGAL_TECH,
    development: MessageTopic.DEVELOPMENT,
    project_management: MessageTopic.PROJECT_MANAGEMENT,
    agile: MessageTopic.AGILE,
    mixed: MessageTopic.MIXED,
    // Mapeamentos para tópicos novos
    tech_humor: MessageTopic.TECH_HUMOR,
    dev_life: MessageTopic.DEV_LIFE,
    code_wisdom: MessageTopic.CODE_WISDOM,
    tech_facts: MessageTopic.TECH_FACTS,
  };

  /**
   * Tópicos preferidos (novos, mais específicos)
   */
  static readonly PREFERRED_TOPICS: MessageTopic[] = [
    MessageTopic.TECH_HUMOR,
    MessageTopic.DEV_LIFE,
    MessageTopic.CODE_WISDOM,
    MessageTopic.TECH_FACTS,
  ];

  /**
   * Tópicos de compatibilidade (antigos, mais genéricos)
   */
  static readonly LEGACY_TOPICS: MessageTopic[] = [
    MessageTopic.DEVELOPMENT,
    MessageTopic.PROJECT_MANAGEMENT,
    MessageTopic.AGILE,
  ];

  /**
   * Todos os tópicos disponíveis
   */
  static readonly ALL_TOPICS: MessageTopic[] = [
    ...TopicUtils.PREFERRED_TOPICS,
    ...TopicUtils.LEGACY_TOPICS,
    MessageTopic.LEGAL_TECH,
    MessageTopic.MIXED,
  ];

  /**
   * Converte string para MessageTopic válido
   */
  static stringToTopic(topicString: string): MessageTopic {
    const topic = TopicUtils.TOPIC_MIGRATION_MAP[topicString.toLowerCase()];
    return topic || MessageTopic.MIXED;
  }

  /**
   * Verifica se é um tópico preferido (novo)
   */
  static isPreferredTopic(topic: MessageTopic): boolean {
    return TopicUtils.PREFERRED_TOPICS.includes(topic);
  }

  /**
   * Verifica se é um tópico legado (antigo)
   */
  static isLegacyTopic(topic: MessageTopic): boolean {
    return TopicUtils.LEGACY_TOPICS.includes(topic);
  }

  /**
   * Obtém tópico aleatório dos preferidos
   */
  static getRandomPreferredTopic(): MessageTopic {
    const topics = TopicUtils.PREFERRED_TOPICS;
    return topics[Math.floor(Math.random() * topics.length)]!;
  }

  /**
   * Obtém tópico aleatório de todos
   */
  static getRandomTopic(): MessageTopic {
    const topics = TopicUtils.ALL_TOPICS;
    return topics[Math.floor(Math.random() * topics.length)]!;
  }

  /**
   * Migra tópico legado para preferido quando possível
   */
  static migrateTopic(topic: MessageTopic): MessageTopic {
    const migrations: Record<MessageTopic, MessageTopic> = {
      [MessageTopic.DEVELOPMENT]: MessageTopic.DEV_LIFE,
      [MessageTopic.PROJECT_MANAGEMENT]: MessageTopic.CODE_WISDOM,
      [MessageTopic.AGILE]: MessageTopic.TECH_HUMOR,
      // Tópicos que já são preferidos permanecem iguais
      [MessageTopic.TECH_HUMOR]: MessageTopic.TECH_HUMOR,
      [MessageTopic.DEV_LIFE]: MessageTopic.DEV_LIFE,
      [MessageTopic.CODE_WISDOM]: MessageTopic.CODE_WISDOM,
      [MessageTopic.TECH_FACTS]: MessageTopic.TECH_FACTS,
      [MessageTopic.LEGAL_TECH]: MessageTopic.LEGAL_TECH,
      [MessageTopic.MIXED]: MessageTopic.MIXED,
    };

    return migrations[topic] || MessageTopic.MIXED;
  }

  /**
   * Obtém descrição amigável do tópico
   */
  static getTopicDescription(topic: MessageTopic): string {
    const descriptions: Record<MessageTopic, string> = {
      [MessageTopic.TECH_HUMOR]: 'Humor inteligente sobre tecnologia',
      [MessageTopic.DEV_LIFE]: 'Situações da vida de desenvolvedor',
      [MessageTopic.CODE_WISDOM]: 'Sabedoria sobre programação',
      [MessageTopic.TECH_FACTS]: 'Curiosidades fascinantes de tech',
      [MessageTopic.LEGAL_TECH]: 'Direito digital e compliance',
      [MessageTopic.DEVELOPMENT]: 'Desenvolvimento de software (legado)',
      [MessageTopic.PROJECT_MANAGEMENT]: 'Gestão de projetos (legado)',
      [MessageTopic.AGILE]: 'Metodologias ágeis (legado)',
      [MessageTopic.MIXED]: 'Conteúdo criativo misto',
    };

    return descriptions[topic] || 'Tópico desconhecido';
  }

  /**
   * Obtém emoji representativo do tópico
   */
  static getTopicEmoji(topic: MessageTopic): string {
    const emojis: Record<MessageTopic, string> = {
      [MessageTopic.TECH_HUMOR]: '😄',
      [MessageTopic.DEV_LIFE]: '👨‍💻',
      [MessageTopic.CODE_WISDOM]: '🧠',
      [MessageTopic.TECH_FACTS]: '🤓',
      [MessageTopic.LEGAL_TECH]: '⚖️',
      [MessageTopic.DEVELOPMENT]: '💻',
      [MessageTopic.PROJECT_MANAGEMENT]: '📊',
      [MessageTopic.AGILE]: '🏃‍♂️',
      [MessageTopic.MIXED]: '🎨',
    };

    return emojis[topic] || '🤖';
  }

  /**
   * Estatísticas de uso dos tópicos
   */
  static getTopicStats(messages: Array<{ topic: MessageTopic }>): {
    preferredCount: number;
    legacyCount: number;
    totalCount: number;
    distribution: Record<MessageTopic, number>;
  } {
    const distribution = {} as Record<MessageTopic, number>;
    let preferredCount = 0;
    let legacyCount = 0;

    // Inicializa distribuição
    TopicUtils.ALL_TOPICS.forEach(topic => {
      distribution[topic] = 0;
    });

    // Conta mensagens
    messages.forEach(msg => {
      distribution[msg.topic] = (distribution[msg.topic] || 0) + 1;

      if (TopicUtils.isPreferredTopic(msg.topic)) {
        preferredCount++;
      } else if (TopicUtils.isLegacyTopic(msg.topic)) {
        legacyCount++;
      }
    });

    return {
      preferredCount,
      legacyCount,
      totalCount: messages.length,
      distribution,
    };
  }
}
