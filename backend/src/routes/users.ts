import { Router } from 'express';
import { StorageService } from '../services/storage';
import { APIResponse } from '../types';

const router = Router();
const storage = new StorageService();

// Get user by key
router.get('/:userKey', async (req, res) => {
  try {
    const { userKey } = req.params;
    const user = await storage.getUser(userKey);
    
    if (!user) {
      const response: APIResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const response: APIResponse = {
      success: true,
      data: {
        userKey,
        ...user
      }
    };
    res.json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Failed to fetch user'
    };
    res.status(500).json(response);
  }
});

// Get all users (admin endpoint - use with caution in production)
router.get('/', async (req, res) => {
  try {
    const users = await storage.getUsers();
    
    const response: APIResponse = {
      success: true,
      data: users
    };
    res.json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: 'Failed to fetch users'
    };
    res.status(500).json(response);
  }
});

export default router;