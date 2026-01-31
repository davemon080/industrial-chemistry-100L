
export interface User {
  id: string;
  matricNumber: string;
  isCourseRep: boolean;
  password?: string;
}

export interface Material {
  id: string;
  courseCode: string;
  title: string;
  pdfUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  isSyncing?: boolean; // New: for background state
}

export interface ScheduleItem {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  venue: string;
  isOnline?: boolean;
  link?: string;
  attachmentUrl?: string;
  eventDate?: string;
  isSyncing?: boolean; // New: for background state
}

export enum Page {
  COURSES = 'courses',
  SCHEDULE = 'schedule',
  GUIDE = 'guide',
  SETTINGS = 'settings',
  COURSE_DETAIL = 'course_detail'
}
