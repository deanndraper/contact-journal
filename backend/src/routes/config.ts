import express from 'express';
import { ConfigService } from '../services/config';
import { ConfigError } from '../types/config';

const router = express.Router();
const configService = new ConfigService();

// Get configuration for a specific app
router.get('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    
    if (!appId) {
      return res.status(400).json({
        success: false,
        error: 'App ID is required'
      });
    }

    const config = await configService.getConfig(appId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    
    if (error instanceof ConfigError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to load configuration'
    });
  }
});

// List all available configurations
router.get('/', async (req, res) => {
  try {
    const configs = await configService.listConfigs();
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error listing configs:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to list configurations'
    });
  }
});

// Clear configuration cache (for development)
router.post('/cache/clear', (req, res) => {
  try {
    configService.clearCache();
    
    res.json({
      success: true,
      message: 'Configuration cache cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Health check for config service
router.get('/health/check', async (req, res) => {
  try {
    // Try to load the default social config
    await configService.getConfig('social');
    
    res.json({
      success: true,
      message: 'Configuration service is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Config health check failed:', error);
    
    res.status(503).json({
      success: false,
      error: 'Configuration service is unhealthy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;