export type LiveState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'thinking';

export type NishaMood = 'sassy' | 'flirty' | 'playful' | 'thinking' | 'chill' | 'dramatic';

export interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface ToolCallData {
  id: string;
  name: string;
  args: any;
  status: 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface NishaPersonality {
  name: string;
  voiceName: string;
  tagline: string;
  mood: NishaMood;
  sassLevel: number; // 1 to 10
  flirtLevel: number; // 1 to 10
}

