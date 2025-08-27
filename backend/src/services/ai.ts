import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { InteractionRecord, AIFeedbackRecord, JournalRecord } from '../types';
import { StorageService } from './storage';

interface PromptConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

interface AIResponse {
  feedback: string;
  insightType: 'encouragement' | 'suggestion' | 'observation' | 'milestone';
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;
  private storageService: StorageService;
  private promptConfig: PromptConfig | null = null;
  private systemPrompt: string = '';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.storageService = new StorageService();
    
    if (!this.apiKey) {
      console.warn('WARNING: OPENROUTER_API_KEY not found in environment variables');
    }
  }

  private async loadPromptConfig(): Promise<void> {
    try {
      const promptPath = path.join(__dirname, '../../prompts/feedback-prompt.md');
      const promptContent = await fs.readFile(promptPath, 'utf-8');
      
      // Extract model configuration from markdown
      const configMatch = promptContent.match(/```yaml\n([\s\S]*?)```/);
      if (configMatch) {
        const configLines = configMatch[1].split('\n');
        this.promptConfig = {
          model: configLines.find(l => l.startsWith('model:'))?.split(': ')[1] || 'openai/gpt-4o',
          temperature: parseFloat(configLines.find(l => l.startsWith('temperature:'))?.split(': ')[1] || '0.7'),
          max_tokens: parseInt(configLines.find(l => l.startsWith('max_tokens:'))?.split(': ')[1] || '150')
        };
      }
      
      // Extract system prompt (everything after "## System Prompt" until next ##)
      const systemPromptMatch = promptContent.match(/## System Prompt\n\n([\s\S]*?)(?=\n##|$)/);
      if (systemPromptMatch) {
        // Get everything from System Prompt to the end, removing the yaml config
        const fullPrompt = promptContent
          .split('## System Prompt')[1]
          .replace(/```yaml[\s\S]*?```/g, '')
          .trim();
        this.systemPrompt = fullPrompt;
      }
    } catch (error) {
      console.error('Error loading prompt configuration:', error);
      // Fallback configuration
      this.promptConfig = {
        model: 'openai/gpt-4o',
        temperature: 0.7,
        max_tokens: 150
      };
      this.systemPrompt = 'You are a supportive therapeutic companion. Provide brief, encouraging feedback.';
    }
  }

  async generateFeedback(
    userKey: string,
    userName: string,
    newInteraction: InteractionRecord
  ): Promise<AIFeedbackRecord | null> {
    try {
      // Load prompt configuration
      await this.loadPromptConfig();
      
      if (!this.apiKey || !this.promptConfig) {
        console.log('AI feedback skipped: Missing API key or configuration');
        return null;
      }

      // Get recent interactions for context (last 20)
      const allRecords = await this.storageService.getAllRecords(userKey);
      const recentInteractions = allRecords
        .filter(record => record.recordType === 'interaction')
        .slice(-20) as InteractionRecord[];

      // Prepare the user message with context
      const userMessage = this.buildUserMessage(userName, recentInteractions, newInteraction);

      // Call OpenRouter API
      const response = await this.callOpenRouter(userMessage);
      
      if (!response) return null;

      // Create and return AI feedback record
      const feedbackRecord: AIFeedbackRecord = {
        id: `ai_${uuidv4()}`,
        timestamp: new Date().toISOString(),
        recordType: 'ai_feedback',
        relatedTo: [newInteraction.id],
        feedback: response.feedback,
        insightType: response.insightType
      };

      // Save the AI feedback to the user's JSONL file
      await this.storageService.appendInteraction(userKey, feedbackRecord);

      return feedbackRecord;
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      return null;
    }
  }

  private buildUserMessage(
    userName: string,
    recentInteractions: InteractionRecord[],
    newInteraction: InteractionRecord
  ): string {
    const interactionSummary = recentInteractions.map(int => 
      `- ${int.interactionType} (${int.comfortLevel}) ${int.notes ? `- "${int.notes}"` : ''}`
    ).join('\n');

    return `
User: ${userName}

Recent interactions (last ${recentInteractions.length}):
${interactionSummary || 'No previous interactions'}

New interaction just entered:
- Type: ${newInteraction.interactionType}
- Comfort Level: ${newInteraction.comfortLevel}
- Notes: ${newInteraction.notes || 'None'}

Please provide encouraging feedback following the guidelines. Return response as JSON.`;
  }

  private async callOpenRouter(userMessage: string): Promise<AIResponse | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.promptConfig!.model,
          messages: [
            {
              role: 'system',
              content: this.systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: this.promptConfig!.temperature,
          max_tokens: this.promptConfig!.max_tokens,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://contact-journal.app',
            'X-Title': 'Contact Journal',
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      // Validate response structure and provide defaults
      if (!parsed.feedback) {
        console.error('Invalid AI response structure - missing feedback:', parsed);
        return {
          feedback: "Keep going - every interaction is progress!",
          insightType: 'encouragement'
        };
      }
      
      // Default insightType if not provided
      if (!parsed.insightType) {
        parsed.insightType = 'encouragement';
      }

      return parsed as AIResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('OpenRouter API error:', error.response?.data || error.message);
      } else {
        console.error('Error calling OpenRouter:', error);
      }
      return null;
    }
  }
}