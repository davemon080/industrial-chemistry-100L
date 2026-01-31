
import { neon } from '@neondatabase/serverless';
import { User, Material, ScheduleItem } from '../types';
import { COURSE_REP_MATRIC } from '../constants';

const DATABASE_URL = 'postgresql://neondb_owner:npg_uxpT2GyVeIl6@ep-floral-shape-ahpk8j2y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

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

const mapSchedule = (dbSch: any): ScheduleItem => {
  // We use the string returned by TO_CHAR to avoid any Date object timezone shifting
  return {
    id: dbSch.id.toString(),
    day: dbSch.day_of_week,
    startTime: dbSch.start_time.substring(0, 5),
    endTime: dbSch.end_time.substring(0, 5),
    courseCode: dbSch.course_code,
    venue: dbSch.venue,
    isOnline: dbSch.is_online,
    link: dbSch.link,
    attachmentUrl: dbSch.attachment_url,
    eventDate: dbSch.event_date_str || null
  };
};

export const dbService = {
  register: async (matricNumber: string): Promise<User | null> => {
    try {
      const result = await withRetry(async () => {
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
      const result = (await withRetry(() => sql`
        SELECT * FROM materials 
        WHERE course_code = ${courseCode}
        ORDER BY uploaded_at DESC
      `)) as any[];
      return result.map(mapMaterial);
    } catch (error) {
      console.error('Get materials error:', error);
      throw error;
    }
  },

  addMaterial: async (material: Omit<Material, 'id' | 'uploadedAt'>): Promise<Material | null> => {
    try {
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
      // Use TO_CHAR to force the DB to return a string, bypassing driver timezone logic
      const result = (await withRetry(() => sql`
        SELECT *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date_str 
        FROM schedules
      `)) as any[];
      return result.map(mapSchedule);
    } catch (error) {
      console.error('Get schedules error:', error);
      throw error;
    }
  },

  addSchedule: async (item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem | null> => {
    try {
      const result = (await withRetry(() => sql`
        INSERT INTO schedules (day_of_week, start_time, end_time, course_code, venue, is_online, link, attachment_url, event_date)
        VALUES (${item.day}, ${item.startTime}, ${item.endTime}, ${item.courseCode}, ${item.venue}, ${item.isOnline || false}, ${item.link || null}, ${item.attachmentUrl || null}, ${item.eventDate || null})
        RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date_str
      `)) as any[];
      return mapSchedule(result[0]);
    } catch (error) {
      console.error('Add schedule error:', error);
      return null;
    }
  },

  updateSchedule: async (id: string, item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem | null> => {
    try {
      const numericId = Number(id);
      const result = (await withRetry(() => sql`
        UPDATE schedules 
        SET day_of_week = ${item.day}, 
            start_time = ${item.startTime}, 
            end_time = ${item.endTime}, 
            course_code = ${item.courseCode}, 
            venue = ${item.venue}, 
            is_online = ${item.isOnline || false}, 
            link = ${item.link || null}, 
            attachment_url = ${item.attachmentUrl || null}, 
            event_date = ${item.eventDate || null}
        WHERE id = ${numericId}
        RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date_str
      `)) as any[];
      return mapSchedule(result[0]);
    } catch (error) {
      console.error('Update schedule error:', error);
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
