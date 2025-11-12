export type ActiveTab = 'PRODUCT_PROFILE' | 'CHATBOT' | 'POST_GENERATOR' | 'AD_CREATIVE' | 'VOICE_CONSULTANT' | 'IDENTITY_MANAGER';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: GroundingChunk[];
}