import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api';
  }
  
  // Production: Use current protocol and api subdomain
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  
  // If we're on journal.transformativehelp.com, use api.transformativehelp.com
  if (host.includes('transformativehelp.com')) {
    return `${protocol}//api.transformativehelp.com/api`;
  }
  
  // Fallback for other domains (replace 'journal.' with 'api.')
  const apiHost = host.replace(/^[^.]+\./, 'api.');
  return `${protocol}//${apiHost}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export interface User {
  userKey: string;
  name: string;
  created: string;
}

export interface InteractionRecord {
  id: string;
  timestamp: string;
  recordType: 'interaction';
  interactionType: string; // Dynamic based on configuration
  comfortLevel: string; // Dynamic based on configuration
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
  interactionType: string;
  comfortLevel: string;
  notes?: string;
  appId?: string;
}

// Configuration types for frontend
export interface InteractionType {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export interface ComfortLevel {
  id: string;
  label: string;
  color: string;
  emoji?: string;
  description?: string;
}

export interface Theme {
  primary: string;
  secondary: string;
  background?: string;
}

export interface UIConfig {
  welcomeMessage?: string;
  interactionPrompt?: string;
  comfortPrompt?: string;
  notesPrompt?: string;
  notesPlaceholder?: string;
  submitButton?: string;
  recentEntriesTitle?: string;
}

export interface AppConfig {
  appId: string;
  appName: string;
  description?: string;
  interactions: InteractionType[];
  comfortLevels: ComfortLevel[];
  theme: Theme;
  ui?: UIConfig;
  ai?: {
    promptTemplate?: string;
    enabled?: boolean;
  };
  version?: string;
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

  async getAllRecords(userKey: string, appId?: string): Promise<JournalRecord[]> {
    const params = appId ? { appId } : {};
    const response = await this.api.get<APIResponse<JournalRecord[]>>(`/interactions/${userKey}/all`, { params });
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

  // Configuration endpoints
  async getAppConfig(appId: string): Promise<AppConfig> {
    const response = await this.api.get<APIResponse<AppConfig>>(`/config/${appId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch app configuration');
    }
    return response.data.data!;
  }

  async listConfigs(): Promise<string[]> {
    const response = await this.api.get<APIResponse<string[]>>('/config');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to list configurations');
    }
    return response.data.data!;
  }

  async clearConfigCache(): Promise<void> {
    const response = await this.api.post<APIResponse>('/config/cache/clear');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to clear config cache');
    }
  }

  // Helper method to determine app ID from URL
  getAppIdFromUrl(): string {
    const path = window.location.pathname;
    const hostname = window.location.hostname;
    
    // Extract from subdomain (e.g., addiction.domain.com -> addiction)
    if (hostname.includes('.')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'localhost') {
        return subdomain;
      }
    }
    
    // Extract from path (e.g., /addiction -> addiction)
    const pathSegments = path.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length > 0) {
      return pathSegments[0];
    }
    
    // Default to social interaction
    return 'social';
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