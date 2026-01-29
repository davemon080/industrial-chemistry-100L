
export interface Subscription {
  status: 'active' | 'expired' | 'none';
  expiryDate: string | null;
  lastPaymentDate: string | null;
}

export type UserRole = 'student' | 'rep';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  subscription?: Subscription;
}

export interface Attachment {
  name: string;
  url: string; // Base64 for local persistence
  timestamp?: number; // Unix timestamp for upload time
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: string;
  thumbnail: string;
  attachments?: Attachment[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  videos: Video[];
  attachments?: Attachment[];
  content: string; // Text content for context
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  modules: Module[];
  progress: number;
}

export type EventType = 'class' | 'assignment' | 'test' | 'exam';

export interface ScheduleEvent {
  id: string;
  type: EventType;
  title: string;
  courseId: string;
  date: string;
  time: string;
  location: string;
  description: string;
  lecturer?: string;
  isVirtual?: boolean;
  submissionLink?: string;
  maxPoints?: string;
  duration?: string;
  materials?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: EventType | 'system';
}

export interface UserPreferences {
  defaultLeadTimes: Record<EventType, number>;
  notificationsEnabled: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}
