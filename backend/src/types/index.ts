export interface User {
  name: string;
  created: string;
}

export interface UserMap {
  [key: string]: User;
}

export interface InteractionRecord {
  id: string;
  timestamp: string;
  recordType: 'interaction';
  interactionType: 'Initiated Conversation' | 'Responded Positively' | 'Met New Person' | 'Did a Favor' | 'Listened Intently';
  comfortLevel: 'Very Comfortable' | 'Comfortable' | 'Neutral' | 'Somewhat Uncomfortable' | 'Very Uncomfortable';
  notes?: string;
}

export interface AIFeedbackRecord {
  id: string;
  timestamp: string;
  recordType: 'ai_feedback';
  relatedTo: string[];
  feedback: string;
  insightType: 'encouragement' | 'suggestion' | 'observation' | 'milestone';
}

export type JournalRecord = InteractionRecord | AIFeedbackRecord;

export interface CreateInteractionDTO {
  interactionType: InteractionRecord['interactionType'];
  comfortLevel: InteractionRecord['comfortLevel'];
  notes?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}