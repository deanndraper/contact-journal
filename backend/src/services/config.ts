import fs from 'fs/promises';
import path from 'path';
import { AppConfig, ConfigError, ConfigValidationError } from '../types/config';

export class ConfigService {
  private configCache: Map<string, AppConfig> = new Map();
  private cacheTimeout: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly configsDir: string;

  constructor() {
    // Point to the configs directory in the project root
    this.configsDir = path.join(__dirname, '../../../configs');
  }

  /**
   * Gets application configuration by app ID
   * Supports both direct ID lookup and hostname-based routing
   */
  async getConfig(identifier: string): Promise<AppConfig> {
    // Handle hostname-based routing (e.g., "addiction.domain.com" -> "addiction")
    const appId = this.extractAppIdFromIdentifier(identifier);
    
    // Check cache first
    if (this.isCacheValid(appId)) {
      return this.configCache.get(appId)!;
    }

    try {
      const config = await this.loadConfigFile(appId);
      this.validateConfig(config);
      this.applyDefaults(config);
      
      // Cache the config
      this.configCache.set(appId, config);
      this.cacheTimeout.set(appId, Date.now() + this.CACHE_TTL);
      
      return config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      
      // If specific config not found, try to return default (social)
      if (appId !== 'social') {
        console.warn(`Config not found for '${appId}', falling back to 'social'`);
        return this.getConfig('social');
      }
      
      throw new ConfigError(`Configuration file not found: ${appId}.json`);
    }
  }

  /**
   * Lists all available configurations
   */
  async listConfigs(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.configsDir);
      return files
        .filter(file => file.endsWith('.json') && file !== 'schema.json')
        .map(file => file.replace('.json', ''))
        .sort();
    } catch (error) {
      console.error('Error listing configs:', error);
      return [];
    }
  }

  /**
   * Validates a configuration against business rules
   */
  private validateConfig(config: any): void {
    const errors: ConfigValidationError[] = [];

    // Required fields
    if (!config.appId) errors.push({ field: 'appId', message: 'App ID is required' });
    if (!config.appName) errors.push({ field: 'appName', message: 'App name is required' });
    if (!config.interactions || !Array.isArray(config.interactions)) {
      errors.push({ field: 'interactions', message: 'Interactions array is required' });
    }
    if (!config.comfortLevels || !Array.isArray(config.comfortLevels)) {
      errors.push({ field: 'comfortLevels', message: 'Comfort levels array is required' });
    }
    if (!config.theme) errors.push({ field: 'theme', message: 'Theme configuration is required' });

    // Validate interactions
    if (config.interactions) {
      config.interactions.forEach((interaction: any, index: number) => {
        if (!interaction.id) {
          errors.push({ field: `interactions[${index}].id`, message: 'Interaction ID is required' });
        }
        if (!interaction.label) {
          errors.push({ field: `interactions[${index}].label`, message: 'Interaction label is required' });
        }
        if (!interaction.icon) {
          errors.push({ field: `interactions[${index}].icon`, message: 'Interaction icon is required' });
        }
      });

      // Check for duplicate IDs
      const ids = config.interactions.map((i: any) => i.id).filter(Boolean);
      const duplicates = ids.filter((id: string, index: number) => ids.indexOf(id) !== index);
      duplicates.forEach((id: string) => {
        errors.push({ field: 'interactions', message: `Duplicate interaction ID: ${id}` });
      });
    }

    // Validate comfort levels
    if (config.comfortLevels) {
      config.comfortLevels.forEach((level: any, index: number) => {
        if (!level.id) {
          errors.push({ field: `comfortLevels[${index}].id`, message: 'Comfort level ID is required' });
        }
        if (!level.label) {
          errors.push({ field: `comfortLevels[${index}].label`, message: 'Comfort level label is required' });
        }
        if (!level.color) {
          errors.push({ field: `comfortLevels[${index}].color`, message: 'Comfort level color is required' });
        }
      });

      // Check for duplicate IDs
      const ids = config.comfortLevels.map((l: any) => l.id).filter(Boolean);
      const duplicates = ids.filter((id: string, index: number) => ids.indexOf(id) !== index);
      duplicates.forEach((id: string) => {
        errors.push({ field: 'comfortLevels', message: `Duplicate comfort level ID: ${id}` });
      });
    }

    // Validate theme
    if (config.theme) {
      if (!config.theme.primary) {
        errors.push({ field: 'theme.primary', message: 'Primary theme color is required' });
      }
      if (!config.theme.secondary) {
        errors.push({ field: 'theme.secondary', message: 'Secondary theme color is required' });
      }
    }

    if (errors.length > 0) {
      throw new ConfigError('Configuration validation failed', errors);
    }
  }

  /**
   * Applies default values to configuration
   */
  private applyDefaults(config: AppConfig): void {
    // UI defaults
    config.ui = {
      welcomeMessage: 'Welcome back, {userName}',
      interactionPrompt: 'What did you do?',
      comfortPrompt: 'How did you feel?',
      notesPrompt: 'Add notes (optional)',
      notesPlaceholder: 'Any thoughts...',
      submitButton: 'Save Entry',
      recentEntriesTitle: 'Your Recent Entries',
      ...config.ui
    };

    // AI defaults
    config.ai = {
      promptTemplate: 'general',
      enabled: true,
      ...config.ai
    };

    // Theme defaults
    config.theme = {
      background: 'from-blue-50 to-purple-50',
      ...config.theme
    };

    // Version default
    if (!config.version) {
      config.version = '1.0.0';
    }
  }

  /**
   * Extracts app ID from various identifier formats
   */
  private extractAppIdFromIdentifier(identifier: string): string {
    // Handle hostname format: "addiction.domain.com" -> "addiction"
    if (identifier.includes('.')) {
      return identifier.split('.')[0];
    }
    
    // Handle path format: "/addiction" -> "addiction"
    if (identifier.startsWith('/')) {
      return identifier.substring(1);
    }
    
    // Direct ID
    return identifier;
  }

  /**
   * Loads configuration file from disk
   */
  private async loadConfigFile(appId: string): Promise<AppConfig> {
    const configPath = path.join(this.configsDir, `${appId}.json`);
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      throw new ConfigError(`Failed to load configuration: ${appId}.json`);
    }
  }

  /**
   * Checks if cached config is still valid
   */
  private isCacheValid(appId: string): boolean {
    const config = this.configCache.get(appId);
    const timeout = this.cacheTimeout.get(appId);
    
    return config !== undefined && timeout !== undefined && Date.now() < timeout;
  }

  /**
   * Clears the configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
    this.cacheTimeout.clear();
  }

  /**
   * Gets app configuration for data isolation
   * Returns the directory path where this app's data should be stored
   */
  getAppDataPath(appId: string): string {
    return path.join('data', 'apps', appId);
  }
}