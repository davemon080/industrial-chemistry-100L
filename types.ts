
export type CourseCode = 'math101' | 'chm101' | 'chm107' | 'phy101' | 'phy107' | 'bio101' | 'bio107' | 'gst111' | 'cos101';
export type ClassType = 'Physical' | 'Online';
export type AppView = 'dashboard' | 'profile' | 'login' | 'signup' | 'admin_portal' | 'history' | 'guide';
export type ScheduleCategory = 'class' | 'assignment' | 'activity';
export type ViewMode = 'list' | 'calendar';

export interface User {
  email: string;
  name: string;
  last_checked_notifications?: number;
  active_session_id?: string;
  is_admin: boolean;
}

export interface AppNotification {
  id: string;
  user_email: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

export interface Attachment {
  data: string;
  type: string;
  name: string;
}

export interface Schedule {
  id: string;
  category: ScheduleCategory;
  course?: CourseCode; 
  title?: string; 
  date?: string; // Due Date / Class Date (Optional)
  givenDate?: string; // Date Assigned (Optional)
  time: string; 
  type: ClassType;
  location: string; 
  instructions: string;
  createdAt: number;
  attachments?: Attachment[];
  // Legacy fields for DB compatibility
  attachment?: string; 
  attachmentType?: string;
  attachmentName?: string;
}

// Added GuidePost interface definition for the resources section
export interface GuidePost {
  id: string;
  title: string;
  content: string;
  createdAt: number | string;
  attachment?: string;
  attachmentType?: string;
  attachmentName?: string;
  link?: string;
}

export const COURSES: Record<CourseCode, string> = {
  math101: "General Mathematics I",
  chm101: "General Chemistry I",
  chm107: "Practical Chemistry I",
  phy101: "General Physics I",
  phy107: "Practical Physics I",
  bio101: "General Biology I",
  bio107: "Practical Biology I",
  gst111: "Communication in English I",
  cos101: "Introduction to Computer Science"
};

export const ADMIN_CREDENTIALS = { username: 'admin@gmail.com', password: '1234' };
export const MAX_FILE_SIZE = 50 * 1024 * 1024; 
export const CURRENT_APP_SESSION_ID = Math.random().toString(36).substring(2, 15);
