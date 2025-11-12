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

export interface ProductInfo {
    name: string;
    company: string;
    description: string;
    targetAudience: string;
    usp: string;
}

export interface PostGeneratorState {
    goal: string;
    topic: string;
    post: string;
    image: string | null;
    placement: '1:1' | '16:9' | '9:16';
}

export interface AdCreativeState {
    prompt: string;
    image: string | null;
    placement: '1:1' | '16:9' | '9:16';
}

export interface VoiceConsultantState {
    history: { role: 'user' | 'model'; content: string }[];
}

export interface AppState {
    productInfo: ProductInfo;
    chatHistory: ChatMessage[];
    postGenerator: PostGeneratorState;
    adCreative: AdCreativeState;
    voiceConsultant: VoiceConsultantState;
    logos: {
        brandErp: string | null;
        onoo: string | null;
    };
    activeTab: ActiveTab;
}
