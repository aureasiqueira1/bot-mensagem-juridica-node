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
}

export enum MessageStyle {
  HUMOR = 'humor',
  CURIOSITY = 'curiosity',
  TIP = 'tip',
  REFLECTION = 'reflection',
}

export enum MessageTopic {
  LEGAL_TECH = 'legal_tech',
  DEVELOPMENT = 'development',
  PROJECT_MANAGEMENT = 'project_management',
  AGILE = 'agile',
  MIXED = 'mixed',
}

export interface ContentGenerationPrompt {
  style: MessageStyle;
  topic: MessageTopic;
  previousMessages?: string[];
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
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
}
