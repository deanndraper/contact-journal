import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storage';
import { APIResponse, CreateInteractionDTO, InteractionRecord } from '../types';

const router = Router();
const storage = new StorageService();

// Create a new interaction
router.post('/:userKey', async (req, res) => {
  try {
    const { userKey } = req.params;
    const { interactionType, comfortLevel, notes }: CreateInteractionDTO = req.body;
    
    // Validate user exists
    const user = await storage.getUser(userKey);
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
    await storage.appendInteraction(userKey, interactionRecord);
    
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
    
    // Validate user exists
    const user = await storage.getUser(userKey);
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const records = await storage.getAllRecords(userKey);
    
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
    
    // Validate user exists
    const user = await storage.getUser(userKey);
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const interactions = await storage.getRecentInteractions(userKey, limit);
    
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
    
    // Validate user exists
    const user = await storage.getUser(userKey);
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
    
    const records = await storage.getInteractionsSince(userKey, sinceDate);
    
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