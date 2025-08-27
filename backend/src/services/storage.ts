import fs from 'fs/promises';
import path from 'path';
import { JournalRecord, UserMap, User } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');
const INTERACTIONS_DIR = path.join(DATA_DIR, 'interactions');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export class StorageService {
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async getUsers(): Promise<UserMap> {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users file:', error);
      return {};
    }
  }

  async getUser(userKey: string): Promise<User | null> {
    const users = await this.getUsers();
    return users[userKey] || null;
  }

  async getUserInteractions(userKey: string): Promise<JournalRecord[]> {
    const filePath = path.join(INTERACTIONS_DIR, `${userKey}.jsonl`);
    
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

  async appendInteraction(userKey: string, record: JournalRecord): Promise<void> {
    await this.ensureDirectoryExists(INTERACTIONS_DIR);
    
    const filePath = path.join(INTERACTIONS_DIR, `${userKey}.jsonl`);
    const jsonLine = JSON.stringify(record) + '\n';
    
    await fs.appendFile(filePath, jsonLine, 'utf-8');
  }

  async getRecentInteractions(userKey: string, limit: number = 10): Promise<JournalRecord[]> {
    const allRecords = await this.getUserInteractions(userKey);
    
    // Filter only interaction records (not AI feedback)
    const interactions = allRecords.filter(
      record => record.recordType === 'interaction'
    );
    
    // Return the most recent interactions
    return interactions.slice(-limit).reverse();
  }

  async getAllRecords(userKey: string): Promise<JournalRecord[]> {
    return await this.getUserInteractions(userKey);
  }

  async getInteractionsSince(userKey: string, since: Date): Promise<JournalRecord[]> {
    const allRecords = await this.getUserInteractions(userKey);
    
    return allRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= since;
    });
  }
}