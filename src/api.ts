import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface User {
  userKey: string;
  name: string;
  created: string;
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

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  // User endpoints
  async getUser(userKey: string): Promise<User> {
    const response = await this.api.get<APIResponse<User>>(`/users/${userKey}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch user');
    }
    return response.data.data!;
  }

  // Interaction endpoints
  async createInteraction(userKey: string, interaction: CreateInteractionDTO): Promise<InteractionRecord> {
    const response = await this.api.post<APIResponse<InteractionRecord>>(`/interactions/${userKey}`, interaction);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create interaction');
    }
    return response.data.data!;
  }

  async getRecentInteractions(userKey: string, limit: number = 10): Promise<InteractionRecord[]> {
    const response = await this.api.get<APIResponse<InteractionRecord[]>>(`/interactions/${userKey}/recent?limit=${limit}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch recent interactions');
    }
    return response.data.data!;
  }

  async getAllRecords(userKey: string): Promise<JournalRecord[]> {
    const response = await this.api.get<APIResponse<JournalRecord[]>>(`/interactions/${userKey}/all`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch records');
    }
    return response.data.data!;
  }

  async getInteractionsSince(userKey: string, since: Date): Promise<JournalRecord[]> {
    const isoDate = since.toISOString();
    const response = await this.api.get<APIResponse<JournalRecord[]>>(`/interactions/${userKey}/since/${isoDate}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch interactions');
    }
    return response.data.data!;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.data.success === true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();