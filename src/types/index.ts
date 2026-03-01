// User Types
export type UserRole = 'student' | 'coordinator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  level?: string;
  createdAt: Date;
}

// Schedule Types
export type ScheduleType = 'class' | 'assignment' | 'test' | 'exam' | 'activity';

export interface Schedule {
  id: string;
  type: ScheduleType;
  courseName: string;
  courseCode: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  deadline?: Date;
  time: string;
  venue: string;
  isOnline: boolean;
  meetLink?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: Attachment[];
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: ScheduleType;
  scheduleId?: string;
  read: boolean;
  createdAt: Date;
  userId: string;
}

// Calendar Types
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  schedules: Schedule[];
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  department?: string;
  level?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalSchedules: number;
  upcomingClasses: number;
  pendingAssignments: number;
  upcomingExams: number;
  upcomingTests: number;
}

// Form Types
export interface ScheduleFormData {
  type: ScheduleType;
  courseName: string;
  courseCode: string;
  description?: string;
  startDate: string;
  endDate?: string;
  deadline?: string;
  time: string;
  venue: string;
  isOnline: boolean;
  meetLink?: string;
}
