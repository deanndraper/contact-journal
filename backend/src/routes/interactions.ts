import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storage';
import { AIService } from '../services/ai';
import { ConfigService } from '../services/config';
import { APIResponse, CreateInteractionDTO, InteractionRecord } from '../types';

const router = Router();
const storage = new StorageService();
const aiService = new AIService();
const configService = new ConfigService();

// Create a new interaction
router.post('/:userKey', async (req, res) => {
  try {
    const { userKey } = req.params;
    const { interactionType, comfortLevel, notes, appId }: CreateInteractionDTO & { appId?: string } = req.body;
    
    // Validate user exists (check in global users for backward compatibility)
    let user = await storage.getUser(userKey);
    
    // If not found globally and appId provided, try app-specific users
    if (!user && appId) {
      user = await storage.getUser(userKey, appId);
    }
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    // Validate required fields
    if (!interactionType || !comfortLevel) {
      const response: APIResponse = {
        success: false,
        error: 'Missing required fields: interactionType and comfortLevel'
      };
      return res.status(400).json(response);
    }
    
    // Create interaction record
    const interactionRecord: InteractionRecord = {
      id: `int_${uuidv4()}`,
      timestamp: new Date().toISOString(),
      recordType: 'interaction',
      interactionType,
      comfortLevel,
      ...(notes && { notes })
    };
    
    // Save to JSONL file
    await storage.appendInteraction(userKey, interactionRecord, appId);
    
    // Generate AI feedback asynchronously (don't wait for it)
    // Try to determine app configuration for AI prompt template
    const generateAIFeedback = async () => {
      try {
        let promptTemplate = 'general'; // default
        
        // Try to get app configuration from appId or hostname
        if (appId) {
          try {
            const config = await configService.getConfig(appId);
            promptTemplate = config.ai?.promptTemplate || 'general';
          } catch (error) {
            console.warn(`Could not load config for appId ${appId}, using general prompt`);
          }
        }
        
        const feedback = await aiService.generateFeedback(userKey, user.name, interactionRecord, promptTemplate, appId);
        if (feedback) {
          console.log(`AI feedback generated for ${userKey} (${promptTemplate}): ${feedback.feedback}`);
        }
      } catch (error) {
        console.error('Error generating AI feedback:', error);
      }
    };
    
    generateAIFeedback();
    
    const response: APIResponse = {
      success: true,
      data: interactionRecord
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating interaction:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to create interaction'
    };
    res.status(500).json(response);
  }
});

// Get all records for a user (interactions and AI feedback)
router.get('/:userKey/all', async (req, res) => {
  try {
    const { userKey } = req.params;
    const appId = req.query.appId as string;
    
    // Validate user exists (check global first, then app-specific)
    let user = await storage.getUser(userKey);
    if (!user && appId) {
      user = await storage.getUser(userKey, appId);
    }
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const records = await storage.getAllRecords(userKey, appId);
    
    const response: APIResponse = {
      success: true,
      data: records
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching records:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to fetch records'
    };
    res.status(500).json(response);
  }
});

// Get recent interactions for a user
router.get('/:userKey/recent', async (req, res) => {
  try {
    const { userKey } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const appId = req.query.appId as string;
    
    // Validate user exists (check global first, then app-specific)
    let user = await storage.getUser(userKey);
    if (!user && appId) {
      user = await storage.getUser(userKey, appId);
    }
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const interactions = await storage.getRecentInteractions(userKey, limit, appId);
    
    const response: APIResponse = {
      success: true,
      data: interactions
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching recent interactions:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to fetch recent interactions'
    };
    res.status(500).json(response);
  }
});

// Get interactions since a specific date
router.get('/:userKey/since/:date', async (req, res) => {
  try {
    const { userKey, date } = req.params;
    const appId = req.query.appId as string;
    
    // Validate user exists (check global first, then app-specific)
    let user = await storage.getUser(userKey);
    if (!user && appId) {
      user = await storage.getUser(userKey, appId);
    }
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const sinceDate = new Date(date);
    if (isNaN(sinceDate.getTime())) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid date format'
      };
      return res.status(400).json(response);
    }
    
    const records = await storage.getInteractionsSince(userKey, sinceDate, appId);
    
    const response: APIResponse = {
      success: true,
      data: records
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching interactions since date:', error);
    const response: APIResponse = {
      success: false,
      error: 'Failed to fetch interactions'
    };
    res.status(500).json(response);
  }
});

export default router;