import fs from 'fs/promises';
import path from 'path';
import { JournalRecord, UserMap, User } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');
const APPS_DIR = path.join(DATA_DIR, 'apps');
const LEGACY_INTERACTIONS_DIR = path.join(DATA_DIR, 'interactions');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export class StorageService {
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Get the correct interactions directory for an app (with legacy fallback)
  private getInteractionsDir(appId?: string): string {
    if (!appId) {
      // Default to legacy location for backward compatibility
      return LEGACY_INTERACTIONS_DIR;
    }
    
    return path.join(APPS_DIR, appId, 'interactions');
  }

  // Get the user file path for an app
  private getUsersFile(appId?: string): string {
    if (!appId) {
      // Default to global users file for backward compatibility
      return USERS_FILE;
    }
    
    return path.join(APPS_DIR, appId, 'users.json');
  }

  async getUsers(appId?: string): Promise<UserMap> {
    try {
      const usersFile = this.getUsersFile(appId);
      await this.ensureDirectoryExists(path.dirname(usersFile));
      
      const data = await fs.readFile(usersFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist yet, return empty object
        return {};
      }
      console.error('Error reading users file:', error);
      return {};
    }
  }

  async getUser(userKey: string, appId?: string): Promise<User | null> {
    const users = await this.getUsers(appId);
    return users[userKey] || null;
  }

  async getUserInteractions(userKey: string, appId?: string): Promise<JournalRecord[]> {
    const interactionsDir = this.getInteractionsDir(appId);
    const filePath = path.join(interactionsDir, `${userKey}.jsonl`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          return JSON.parse(line) as JournalRecord;
        } catch (error) {
          console.error('Error parsing JSONL line:', line, error);
          return null;
        }
      }).filter((record): record is JournalRecord => record !== null);
    } catch (error) {
      // File doesn't exist yet, return empty array
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async appendInteraction(userKey: string, record: JournalRecord, appId?: string): Promise<void> {
    const interactionsDir = this.getInteractionsDir(appId);
    await this.ensureDirectoryExists(interactionsDir);
    
    const filePath = path.join(interactionsDir, `${userKey}.jsonl`);
    const jsonLine = JSON.stringify(record) + '\n';
    
    await fs.appendFile(filePath, jsonLine, 'utf-8');
  }

  async getRecentInteractions(userKey: string, limit: number = 10, appId?: string): Promise<JournalRecord[]> {
    const allRecords = await this.getUserInteractions(userKey, appId);
    
    // Filter only interaction records (not AI feedback)
    const interactions = allRecords.filter(
      record => record.recordType === 'interaction'
    );
    
    // Return the most recent interactions
    return interactions.slice(-limit).reverse();
  }

  async getAllRecords(userKey: string, appId?: string): Promise<JournalRecord[]> {
    return await this.getUserInteractions(userKey, appId);
  }

  async getInteractionsSince(userKey: string, since: Date, appId?: string): Promise<JournalRecord[]> {
    const allRecords = await this.getUserInteractions(userKey, appId);
    
    return allRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= since;
    });
  }
}