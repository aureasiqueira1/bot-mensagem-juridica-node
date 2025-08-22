/**
 * Tipos e interfaces da aplicação
 */

export interface Message {
  id?: string;
  content: string;
  style: MessageStyle;
  topic: MessageTopic;
  created_at?: string;
  sent_at?: string;
  hash?: string;
}

export interface StoredMessage {
  id: string;
  content: string;
  style: MessageStyle;
  topic: MessageTopic;
  hash: string;
  created_at: string;
  sent_at: string | null;
  day_of_week?: number;
  effectiveness?: 'low' | 'medium' | 'high';
}

export enum MessageStyle {
  HUMOR = 'humor',
  CURIOSITY = 'curiosity',
  TIP = 'tip',
  REFLECTION = 'reflection',
}

export enum MessageTopic {
  TECH_HUMOR = 'tech_humor', // Humor sobre tecnologia
  DEV_LIFE = 'dev_life', // Vida de desenvolvedor
  CODE_WISDOM = 'code_wisdom', // Sabedoria sobre programação
  TECH_FACTS = 'tech_facts', // Curiosidades tech
  LEGAL_TECH = 'legal_tech', // Direito e tecnologia (opcional)
  DEVELOPMENT = 'development', // Desenvolvimento (compatibilidade)
  PROJECT_MANAGEMENT = 'project_management', // Gestão de projetos (compatibilidade)
  AGILE = 'agile', // Metodologias ágeis (compatibilidade)
  MIXED = 'mixed', // Misto criativo
}

export interface ContentGenerationPrompt {
  style: MessageStyle;
  topic: MessageTopic;
  previousMessages?: string[];
  specialContext?: string; // Contexto especial para ocasiões
}

export interface TeamsMessage {
  text: string;
  title?: string;
  summary?: string;
  themeColor?: string;
}

export interface BotConfig {
  sendTime: string;
  timezone?: string;
  maxRetries?: number;
  retryDelay?: number;
  workdaysOnly?: boolean; // Nova opção para apenas dias úteis
}

// Novos tipos para melhor organização do conteúdo criativo

export interface CreativeTemplate {
  style: MessageStyle;
  topic: MessageTopic;
  template: string;
  variables?: string[];
}

export interface DayContext {
  dayOfWeek: number;
  dayName: string;
  isWorkday: boolean;
  greeting: string;
  mood: 'energetic' | 'productive' | 'creative' | 'innovative' | 'celebrative';
}

export interface MessageMetrics {
  engagement?: number;
  reactions?: number;
  lastSent?: string;
  effectiveness?: 'high' | 'medium' | 'low';
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  creativityLevel?: 'conservative' | 'balanced' | 'creative' | 'wild';
}
