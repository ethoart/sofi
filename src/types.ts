export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  mimeType: string;
  data?: string; // base64 / data URL
  size: number;
  textContent?: string;
}

export type SofiEdition = 'free' | 'pro';

export type SupportedAiModel =
  | 'auto'
  | 'lbgm'
  | 'claude-3-7-sonnet'
  | 'claude-3-5-sonnet'
  | 'claude-opus'
  | 'deepseek-r1'
  | 'deepseek-v3'
  | 'llama-3-3-70b'
  | 'claude-opus-4-8'
  | 'claude-opus-5'
  | 'deepseek-v4-flash'
  | 'glm-5.3'
  | 'gpt-5.6-sol'
  | 'claude'
  | 'chatgpt'
  | 'gemini';

export interface Message {
  id: string;
  sender: 'user' | 'sofi';
  text: string;
  timestamp: string;
  isAudio?: boolean;
  audioDuration?: string;
  matchedSkill?: string;
  attachments?: Attachment[];
  modelUsed?:
    | 'sofi-lbgm'
    | 'claude-3-5-sonnet'
    | 'claude-opus-4-8'
    | 'claude-opus-5'
    | 'deepseek-v4-flash'
    | 'glm-5.3'
    | 'gpt-5.6-sol'
    | 'gpt-4o'
    | 'gemini-3.8-flash'
    | string;
  modelLabel?: string;
  routingReason?: string;
}

export interface Skill {
  id: string;
  name: string;
  trigger: string;
  description: string;
  actionType: 'bash' | 'api' | 'js';
  code: string;
  createdAt: string;
}

export interface McpServer {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: {
    name: string;
    description: string;
    inputSchema: any;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  bio: string;
  occupation: string;
  language: 'en' | 'si';
  interests: string[];
  goals: string[];
  preferences: {
    voiceSpeed: number;
    voicePitch: number;
    formality: 'casual' | 'balanced' | 'formal';
    autoSpeak: boolean;
    openRouterKey?: string;
    agentRouterKey?: string;
  };
  customInstructions: string;
  updatedAt: string;
}

export interface SofiProfile {
  name: string;
  tagline: string;
  archetype: string;
  temperament: string;
  systemDirective: string;
  speechVoice: string;
  avatarUrl: string;
  capabilities: string[];
  updatedAt: string;
}

export interface MemoryItem {
  id: string;
  category: 'personal_fact' | 'preference' | 'task_rule' | 'language_word' | 'conversation_highlight';
  summary: string;
  detail: string;
  source: 'voice_command' | 'chat' | 'profile' | 'learned';
  learnedAt: string;
  usageCount: number;
}

export interface LanguageVocab {
  id: string;
  term: string;
  translation: string;
  language: 'sinhala' | 'english' | 'slang';
  sampleUsage: string;
  learnedAt: string;
}

export interface AdminSession {
  isAuthenticated: boolean;
  token?: string;
  username?: string;
  loginTime?: string;
}

export interface ServerStatus {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: string;
  activeTunnels: number;
}

export type SpecializedMode = 'general' | 'coding' | 'research' | 'creative';

export interface ChatSession {
  id: string;
  title: string;
  mode: SpecializedMode;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  nickname: string;
  email?: string;
  isEmailVerified?: boolean;
  isGuest: boolean;
  token: string;
  createdAt: string;
}

export interface MediaJob {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  aspectRatio?: string;
  style?: string;
  status: 'generating' | 'completed' | 'failed';
  mediaUrl?: string;
  videoDuration?: string;
  createdAt: string;
}

export interface MongoDbStatus {
  status: 'connected' | 'disconnected' | 'error';
  uri: string;
  database: string;
  host: string;
  port: number;
  engine: string;
  uptimeSeconds: number;
  collections: {
    name: string;
    count: number;
    sizeBytes: number;
  }[];
  pingMs: number;
}

export interface CommandExecutionResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: string;
}
