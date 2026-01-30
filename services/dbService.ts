
import { neon } from '@neondatabase/serverless';
import { User, Material } from '../types';
import { COURSE_REP_MATRIC } from '../constants';

// Pooled Database URL from your config
const DATABASE_URL = 'postgresql://neondb_owner:npg_uxpT2GyVeIl6@ep-floral-shape-ahpk8j2y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Initialize the SQL client
const sql = neon(DATABASE_URL);

// Helper to map DB user to App User type
const mapUser = (dbUser: any): User => ({
  id: dbUser.id.toString(),
  matricNumber: dbUser.matric_number,
  isCourseRep: dbUser.is_course_rep,
  password: dbUser.password
});

// Helper to map DB material to App Material type
const mapMaterial = (dbMat: any): Material => ({
  id: dbMat.id.toString(),
  courseCode: dbMat.course_code,
  title: dbMat.title,
  pdfUrl: dbMat.pdf_url,
  uploadedBy: dbMat.uploaded_by,
  uploadedAt: dbMat.uploaded_at
});

export const dbService = {
  register: async (matricNumber: string): Promise<User | null> => {
    try {
      const existing = await sql`SELECT * FROM users WHERE matric_number = ${matricNumber}`;
      if (existing.length > 0) return null;

      const isRep = matricNumber === COURSE_REP_MATRIC;
      
      const result = await sql`
        INSERT INTO users (matric_number, password, is_course_rep)
        VALUES (${matricNumber}, ${matricNumber}, ${isRep})
        RETURNING *
      `;
      
      return mapUser(result[0]);
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },

  login: async (matricNumber: string, password?: string): Promise<User | null> => {
    try {
      const result = await sql`
        SELECT * FROM users 
        WHERE matric_number = ${matricNumber} 
        AND password = ${password}
      `;
      
      if (result.length === 0) return null;
      return mapUser(result[0]);
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  updatePassword: async (matricNumber: string, newPassword: string): Promise<boolean> => {
    try {
      await sql`
        UPDATE users 
        SET password = ${newPassword}
        WHERE matric_number = ${matricNumber}
      `;
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  },

  getMaterials: async (courseCode: string): Promise<Material[]> => {
    try {
      const result = await sql`
        SELECT * FROM materials 
        WHERE course_code = ${courseCode}
        ORDER BY uploaded_at DESC
      `;
      return result.map(mapMaterial);
    } catch (error) {
      console.error('Get materials error:', error);
      return [];
    }
  },

  addMaterial: async (material: Omit<Material, 'id' | 'uploadedAt'>): Promise<Material | null> => {
    try {
      const result = await sql`
        INSERT INTO materials (course_code, title, pdf_url, uploaded_by)
        VALUES (${material.courseCode}, ${material.title}, ${material.pdfUrl}, ${material.uploadedBy})
        RETURNING *
      `;
      return mapMaterial(result[0]);
    } catch (error) {
      console.error('Add material error:', error);
      return null;
    }
  },

  deleteMaterial: async (id: string): Promise<boolean> => {
    try {
      await sql`DELETE FROM materials WHERE id = ${id}`;
      return true;
    } catch (error) {
      console.error('Delete material error:', error);
      return false;
    }
  },

  updateMaterial: async (id: string, title: string, pdfUrl?: string): Promise<boolean> => {
    try {
      if (pdfUrl) {
        await sql`UPDATE materials SET title = ${title}, pdf_url = ${pdfUrl} WHERE id = ${id}`;
      } else {
        await sql`UPDATE materials SET title = ${title} WHERE id = ${id}`;
      }
      return true;
    } catch (error) {
      console.error('Update material error:', error);
      return false;
    }
  }
};
