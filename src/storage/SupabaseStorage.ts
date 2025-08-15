import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Message, StoredMessage } from '../types';
import { logger } from '../utils/Logger';

/**
 * Classe responsável por gerenciar o armazenamento de mensagens no Supabase
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
   * Inicializa a tabela de mensagens se não existir
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🔧 Inicializando storage do Supabase...');

      // Testa conexão com uma consulta simples
      const { error } = await this.client.from(this.tableName).select('count').limit(1);

      if (error) {
        logger.warn('Tabela de mensagens não existe. Será criada automaticamente no primeiro uso.');
      }

      logger.success('Storage do Supabase inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar Supabase:', error);
      throw error;
    }
  }

  /**
   * Gera hash único para o conteúdo da mensagem
   */
  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content.toLowerCase().trim()).digest('hex');
  }

  /**
   * Salva uma nova mensagem no banco
   */
  async saveMessage(message: Message): Promise<StoredMessage> {
    try {
      const hash = this.generateContentHash(message.content);

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

      logger.success('Mensagem salva no Supabase:', { id: data.id });
      return data as StoredMessage;
    } catch (error) {
      logger.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  /**
   * Marca uma mensagem como enviada
   */
  async markMessageAsSent(messageId: string): Promise<void> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({ sent_at: new Date().toISOString() })
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
   * Verifica se o conteúdo já foi usado antes
   */
  async isDuplicateContent(content: string): Promise<boolean> {
    try {
      const hash = this.generateContentHash(content);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('id')
        .eq('hash', hash)
        .limit(1);

      if (error) {
        logger.error('Erro ao verificar duplicata:', error);
        return false; // Em caso de erro, permite o envio
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error('Erro ao verificar duplicata:', error);
      return false;
    }
  }

  /**
   * Obtém as últimas N mensagens enviadas (para contexto da IA)
   */
  async getRecentMessages(limit: number = 10): Promise<StoredMessage[]> {
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

      return data as StoredMessage[];
    } catch (error) {
      logger.error('Erro ao buscar mensagens recentes:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas das mensagens
   */
  async getMessageStats(): Promise<{
    total: number;
    sent: number;
    byStyle: Record<string, number>;
    byTopic: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('style, topic, sent_at');

      if (error || !data) {
        logger.error('Erro ao buscar estatísticas:', error);
        return { total: 0, sent: 0, byStyle: {}, byTopic: {} };
      }

      const stats = {
        total: data.length,
        sent: data.filter(msg => msg.sent_at !== null).length,
        byStyle: {} as Record<string, number>,
        byTopic: {} as Record<string, number>,
      };

      data.forEach(msg => {
        stats.byStyle[msg.style] = (stats.byStyle[msg.style] || 0) + 1;
        stats.byTopic[msg.topic] = (stats.byTopic[msg.topic] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas:', error);
      return { total: 0, sent: 0, byStyle: {}, byTopic: {} };
    }
  }
}
