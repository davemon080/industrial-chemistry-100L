import { neon } from '@neondatabase/serverless';
import { User, Material, ScheduleItem } from '../types';
import { COURSE_REP_MATRIC } from '../constants';

const DATABASE_URL = 'postgresql://neondb_owner:npg_uxpT2GyVeIl6@ep-floral-shape-ahpk8j2y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

// Helper for exponential backoff retry
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('NetworkError');
    if (retries > 0 && isNetworkError) {
      console.warn(`Database connection attempt failed. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const mapUser = (dbUser: any): User => ({
  id: dbUser.id.toString(),
  matricNumber: dbUser.matric_number,
  isCourseRep: dbUser.is_course_rep,
  password: dbUser.password
});

const mapMaterial = (dbMat: any): Material => ({
  id: dbMat.id.toString(),
  courseCode: dbMat.course_code,
  title: dbMat.title,
  pdfUrl: dbMat.pdf_url,
  uploadedBy: dbMat.uploaded_by,
  uploadedAt: dbMat.uploaded_at instanceof Date 
    ? dbMat.uploaded_at.toISOString() 
    : new Date(dbMat.uploaded_at).toISOString()
});

const mapSchedule = (dbSch: any): ScheduleItem => ({
  id: dbSch.id.toString(),
  day: dbSch.day_of_week,
  startTime: dbSch.start_time,
  endTime: dbSch.end_time,
  courseCode: dbSch.course_code,
  venue: dbSch.venue,
  isOnline: dbSch.is_online,
  link: dbSch.link,
  attachmentUrl: dbSch.attachment_url,
  eventDate: dbSch.event_date ? new Date(dbSch.event_date).toISOString().split('T')[0] : undefined
});

export const dbService = {
  register: async (matricNumber: string): Promise<User | null> => {
    try {
      const result = await withRetry(async () => {
        // Fix: Added type assertion to any[] to avoid 'Property length does not exist on type unknown'
        const existing = (await sql`SELECT * FROM users WHERE matric_number = ${matricNumber}`) as any[];
        if (existing.length > 0) return null;
        const isRep = matricNumber === COURSE_REP_MATRIC;
        return (await sql`
          INSERT INTO users (matric_number, password, is_course_rep)
          VALUES (${matricNumber}, ${matricNumber}, ${isRep})
          RETURNING *
        `) as any[];
      });
      return result ? mapUser((result as any[])[0]) : null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },

  login: async (matricNumber: string, password?: string): Promise<User | null> => {
    try {
      // Fix: Added type assertion to any[] to ensure compatibility with array operations
      const result = (await withRetry(() => sql`
        SELECT * FROM users 
        WHERE matric_number = ${matricNumber} 
        AND password = ${password}
      `)) as any[];
      if (result.length === 0) return null;
      return mapUser(result[0]);
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  updatePassword: async (matricNumber: string, newPassword: string): Promise<boolean> => {
    try {
      await withRetry(() => sql`UPDATE users SET password = ${newPassword} WHERE matric_number = ${matricNumber}`);
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  },

  getMaterials: async (courseCode: string): Promise<Material[]> => {
    try {
      // Fix: Added type assertion to any[] to resolve 'Property map does not exist on type unknown'
      const result = (await withRetry(() => sql`
        SELECT * FROM materials 
        WHERE course_code = ${courseCode}
        ORDER BY uploaded_at DESC
      `)) as any[];
      return result.map(mapMaterial);
    } catch (error) {
      console.error('Get materials error:', error);
      throw error; // Throw so the caller can handle the UI state
    }
  },

  addMaterial: async (material: Omit<Material, 'id' | 'uploadedAt'>): Promise<Material | null> => {
    try {
      // Fix: Added type assertion to any[]
      const result = (await withRetry(() => sql`
        INSERT INTO materials (course_code, title, pdf_url, uploaded_by)
        VALUES (${material.courseCode}, ${material.title}, ${material.pdfUrl}, ${material.uploadedBy})
        RETURNING *
      `)) as any[];
      return mapMaterial(result[0]);
    } catch (error) {
      console.error('Add material error:', error);
      return null;
    }
  },

  deleteMaterial: async (id: string): Promise<boolean> => {
    try {
      const numericId = Number(id);
      await withRetry(() => sql`DELETE FROM materials WHERE id = ${numericId}`);
      return true;
    } catch (error) {
      console.error('Delete material error:', error);
      return false;
    }
  },

  getSchedules: async (): Promise<ScheduleItem[]> => {
    try {
      // Fix: Added type assertion to any[] to resolve 'Property map does not exist on type unknown'
      const result = (await withRetry(() => sql`SELECT * FROM schedules`)) as any[];
      return result.map(mapSchedule);
    } catch (error) {
      console.error('Get schedules error:', error);
      throw error;
    }
  },

  addSchedule: async (item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem | null> => {
    try {
      // Fix: Added type assertion to any[]
      const result = (await withRetry(() => sql`
        INSERT INTO schedules (day_of_week, start_time, end_time, course_code, venue, is_online, link, attachment_url, event_date)
        VALUES (${item.day}, ${item.startTime}, ${item.endTime}, ${item.courseCode}, ${item.venue}, ${item.isOnline || false}, ${item.link || null}, ${item.attachmentUrl || null}, ${item.event_date || null})
        RETURNING *
      `)) as any[];
      return mapSchedule(result[0]);
    } catch (error) {
      console.error('Add schedule error:', error);
      return null;
    }
  },

  deleteSchedule: async (id: string): Promise<boolean> => {
    try {
      const numericId = Number(id);
      await withRetry(() => sql`DELETE FROM schedules WHERE id = ${numericId}`);
      return true;
    } catch (error) {
      console.error('Delete schedule error:', error);
      return false;
    }
  }
};