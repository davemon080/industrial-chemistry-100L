import { MongoClient, Db, Collection } from 'mongodb';
import type { User, Schedule, Notification } from '@/types';

// MongoDB connection configuration
// User will provide their actual connection details
const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || 'mongodb://localhost:27017/unischedule';
const DB_NAME = import.meta.env.VITE_MONGODB_DB_NAME || 'unischedule';

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  // Collections
  users!: Collection<User>;
  schedules!: Collection<Schedule>;
  notifications!: Collection<Notification>;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      
      // Initialize collections
      this.users = this.db.collection<User>('users');
      this.schedules = this.db.collection<Schedule>('schedules');
      this.notifications = this.db.collection<Notification>('notifications');

      // Create indexes
      await this.createIndexes();

      this.isConnected = true;
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    // Users indexes
    await this.users.createIndex({ email: 1 }, { unique: true });
    await this.users.createIndex({ role: 1 });

    // Schedules indexes
    await this.schedules.createIndex({ startDate: 1 });
    await this.schedules.createIndex({ type: 1 });
    await this.schedules.createIndex({ courseCode: 1 });
    await this.schedules.createIndex({ createdBy: 1 });

    // Notifications indexes
    await this.notifications.createIndex({ userId: 1, read: 1 });
    await this.notifications.createIndex({ createdAt: -1 });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.db = null;
    }
  }

  getDatabase(): Db | null {
    return this.db;
  }

  isDBConnected(): boolean {
    return this.isConnected;
  }
}

export const mongoDB = new MongoDBService();
export default mongoDB;
