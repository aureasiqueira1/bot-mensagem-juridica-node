import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Message, MessageStyle, MessageTopic, StoredMessage } from '../types';
import { logger } from '../utils/Logger';

/**
 * Classe responsável por gerenciar o armazenamento inteligente de mensagens criativas
 * Versão compatível com schema atual (sem day_of_week e effectiveness)
 */
export class SupabaseStorage {
  private client: SupabaseClient;
  private readonly tableName = 'messages';

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Credenciais do Supabase não encontradas no .env');
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Inicializa o storage com verificações de saúde
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🔧 Inicializando storage criativo do Supabase...');

      // Testa conexão
      const { error } = await this.client.from(this.tableName).select('count').limit(1);

      if (error) {
        logger.warn('Tabela de mensagens não existe. Será criada automaticamente.');
      }

      // Verifica quais colunas existem
      await this.checkTableSchema();

      logger.success('Storage do Supabase inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar Supabase:', error);
      throw error;
    }
  }

  /**
   * Verifica o schema da tabela existente
   */
  private async checkTableSchema(): Promise<void> {
    try {
      const { data, error } = await this.client.from(this.tableName).select('*').limit(1);

      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        logger.info('📋 Colunas disponíveis na tabela:', columns);
      }
    } catch (error) {
      logger.warn('Não foi possível verificar schema da tabela');
    }
  }

  /**
   * Gera hash único para o conteúdo (agora considera conteúdo normalizado)
   */
  private generateContentHash(content: string): string {
    // Normaliza o conteúdo para detectar similaridades
    const normalized = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();

    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Salva uma nova mensagem (versão compatível)
   */
  async saveMessage(message: Message): Promise<StoredMessage> {
    try {
      const hash = this.generateContentHash(message.content);

      // Dados básicos compatíveis com schema atual
      const messageData = {
        content: message.content,
        style: message.style,
        topic: message.topic,
        hash: hash,
        created_at: new Date().toISOString(),
        sent_at: null,
      };

      const { data, error } = await this.client
        .from(this.tableName)
        .insert(messageData)
        .select()
        .single();

      if (error) {
        logger.error('Erro ao salvar mensagem:', error);
        throw error;
      }

      logger.success('Mensagem criativa salva:', {
        id: data.id,
        length: message.content.length,
        style: message.style,
        topic: message.topic,
      });

      return data as StoredMessage;
    } catch (error) {
      logger.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  /**
   * Verifica duplicatas com algoritmo aprimorado
   */
  async isDuplicateContent(content: string): Promise<boolean> {
    try {
      const hash = this.generateContentHash(content);

      // Verifica hash exato
      const { data: exactMatch, error } = await this.client
        .from(this.tableName)
        .select('id')
        .eq('hash', hash)
        .limit(1);

      if (error) {
        logger.error('Erro ao verificar duplicata:', error);
        return false;
      }

      if (exactMatch && exactMatch.length > 0) {
        logger.warn('Conteúdo duplicado encontrado (hash exato)');
        return true;
      }

      // Verifica similaridade alta nas últimas 30 mensagens
      const { data: recentMessages } = await this.client
        .from(this.tableName)
        .select('content')
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(30);

      if (recentMessages) {
        const similarity = this.calculateMaxSimilarity(
          content,
          recentMessages.map(m => m.content)
        );
        if (similarity > 0.75) {
          logger.warn(
            `Conteúdo muito similar encontrado (${(similarity * 100).toFixed(1)}% similaridade)`
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Erro ao verificar duplicata:', error);
      return false;
    }
  }

  /**
   * Calcula similaridade máxima com mensagens existentes
   */
  private calculateMaxSimilarity(newContent: string, existingContents: string[]): number {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const newNormalized = normalize(newContent);

    return Math.max(
      0, // Valor mínimo
      ...existingContents.map(existing => {
        const existingNormalized = normalize(existing);
        return this.calculateLevenshteinSimilarity(newNormalized, existingNormalized);
      })
    );
  }

  /**
   * Calcula similaridade usando Levenshtein
   */
  private calculateLevenshteinSimilarity(a: string, b: string): number {
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Implementação da distância de Levenshtein
   */
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j]![0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j - 1]![i]! + 1, // deletion
          matrix[j]![i - 1]! + 1, // insertion
          matrix[j - 1]![i - 1]! + cost // substitution
        );
      }
    }

    return matrix[b.length]![a.length]!;
  }

  /**
   * Marca uma mensagem como enviada
   */
  async markMessageAsSent(messageId: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        logger.error('Erro ao marcar mensagem como enviada:', error);
        throw error;
      }

      logger.success('Mensagem marcada como enviada:', { id: messageId });
    } catch (error) {
      logger.error('Erro ao marcar mensagem como enviada:', error);
      throw error;
    }
  }

  /**
   * Obtém mensagens recentes com análise de diversidade
   */
  async getRecentMessages(limit: number = 15): Promise<StoredMessage[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Erro ao buscar mensagens recentes:', error);
        return [];
      }

      const messages = data as StoredMessage[];

      // Log da diversidade do conteúdo recente
      this.logContentDiversity(messages);

      return messages;
    } catch (error) {
      logger.error('Erro ao buscar mensagens recentes:', error);
      return [];
    }
  }

  /**
   * Analisa e registra a diversidade do conteúdo
   */
  private logContentDiversity(messages: StoredMessage[]): void {
    if (messages.length === 0) return;

    const styles = new Set(messages.map(m => m.style));
    const topics = new Set(messages.map(m => m.topic));
    const diversityScore = (styles.size + topics.size) / (messages.length * 0.4);

    logger.info('📊 Diversidade do conteúdo recente:', {
      mensagens: messages.length,
      estilos_únicos: styles.size,
      tópicos_únicos: topics.size,
      score_diversidade: diversityScore.toFixed(2),
    });
  }

  /**
   * Busca mensagens por padrão de estilo/tópico para evitar repetições
   */
  async getRecentMessagesByPattern(
    style: MessageStyle,
    topic: MessageTopic,
    days: number = 7
  ): Promise<StoredMessage[]> {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('style', style)
        .eq('topic', topic)
        .gte('sent_at', daysAgo.toISOString())
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar mensagens por padrão:', error);
        return [];
      }

      return data as StoredMessage[];
    } catch (error) {
      logger.error('Erro ao buscar mensagens por padrão:', error);
      return [];
    }
  }

  /**
   * Atualiza a efetividade de uma mensagem (placeholder para compatibilidade)
   */
  async updateMessageEffectiveness(
    messageId: string,
    effectiveness: 'low' | 'medium' | 'high'
  ): Promise<void> {
    try {
      // Por enquanto, apenas log - quando a coluna existir, será implementado
      logger.info('Efetividade registrada (em memória):', { id: messageId, effectiveness });

      // TODO: Implementar quando coluna 'effectiveness' for adicionada à tabela
      // const { error } = await this.client
      //   .from(this.tableName)
      //   .update({ effectiveness })
      //   .eq('id', messageId);
    } catch (error) {
      logger.error('Erro ao registrar efetividade:', error);
    }
  }

  /**
   * Obtém estatísticas básicas (compatível com schema atual)
   */
  async getMessageStats(): Promise<{
    total: number;
    sent: number;
    thisWeek: number;
    byStyle: Record<string, number>;
    byTopic: Record<string, number>;
    diversityScore: number;
    avgLength: number;
  }> {
    try {
      // Busca estatísticas básicas
      const { data, error } = await this.client.from(this.tableName).select('*');

      if (error || !data) {
        logger.error('Erro ao buscar estatísticas:', error);
        return this.getEmptyStats();
      }

      // Calcula estatísticas
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total: data.length,
        sent: data.filter(msg => msg.sent_at !== null).length,
        thisWeek: data.filter(msg => msg.sent_at && new Date(msg.sent_at) >= weekAgo).length,
        byStyle: this.groupBy(data, 'style'),
        byTopic: this.groupBy(data, 'topic'),
        diversityScore: this.calculateDiversityScore(data),
        avgLength:
          data.length > 0
            ? Math.round(data.reduce((sum, msg) => sum + msg.content.length, 0) / data.length)
            : 0,
      };

      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Agrupa dados por campo
   */
  private groupBy(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calcula score de diversidade do conteúdo
   */
  private calculateDiversityScore(data: StoredMessage[]): number {
    if (data.length === 0) return 0;

    const uniqueStyles = new Set(data.map(m => m.style)).size;
    const uniqueTopics = new Set(data.map(m => m.topic)).size;
    const maxStyles = Object.values(MessageStyle).length;
    const maxTopics = Object.values(MessageTopic).length;

    return Math.round((uniqueStyles / maxStyles + uniqueTopics / maxTopics) * 50);
  }

  /**
   * Retorna estatísticas vazias em caso de erro
   */
  private getEmptyStats() {
    return {
      total: 0,
      sent: 0,
      thisWeek: 0,
      byStyle: {},
      byTopic: {},
      diversityScore: 0,
      avgLength: 0,
    };
  }

  /**
   * Busca insights para melhorar a geração de conteúdo (versão básica)
   */
  async getContentInsights(): Promise<{
    preferredStyles: string[];
    underusedTopics: string[];
    bestDaysForHumor: number[];
    recommendedNextStyle: MessageStyle;
  }> {
    try {
      const { data } = await this.client
        .from(this.tableName)
        .select('style, topic, sent_at')
        .not('sent_at', 'is', null)
        .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!data || data.length === 0) {
        return {
          preferredStyles: [MessageStyle.HUMOR],
          underusedTopics: [MessageTopic.TECH_HUMOR],
          bestDaysForHumor: [1, 5], // Segunda e sexta
          recommendedNextStyle: MessageStyle.HUMOR,
        };
      }

      // Analisa padrões básicos
      const styleCount = this.groupBy(data, 'style');
      const topicCount = this.groupBy(data, 'topic');

      // Identifica estilos preferidos
      const preferredStyles = Object.entries(styleCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([style]) => style);

      // Identifica tópicos subutilizados
      const allTopics = Object.values(MessageTopic);
      const underusedTopics = allTopics.filter(
        topic => (topicCount[topic] || 0) < Math.ceil(data.length / allTopics.length)
      );

      // Recomenda próximo estilo baseado na última semana
      const recentStyles = data.slice(-7).map(m => m.style);
      const leastUsedStyle =
        Object.values(MessageStyle).find(style => !recentStyles.includes(style)) ||
        MessageStyle.HUMOR;

      return {
        preferredStyles,
        underusedTopics,
        bestDaysForHumor: [1, 5], // Padrão: segunda e sexta
        recommendedNextStyle: leastUsedStyle,
      };
    } catch (error) {
      logger.error('Erro ao buscar insights:', error);
      return {
        preferredStyles: [MessageStyle.HUMOR],
        underusedTopics: [MessageTopic.TECH_HUMOR],
        bestDaysForHumor: [1, 5],
        recommendedNextStyle: MessageStyle.HUMOR,
      };
    }
  }
}
