
import { Pool } from '@neondatabase/serverless';
import { appCache } from './cache';

const getDbUrl = () => {
  try {
    const url = typeof process !== 'undefined' ? process.env.DATABASE_URL : null;
    return url || "postgresql://neondb_owner:npg_uxpT2GyVeIl6@ep-floral-shape-ahpk8j2y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
  } catch (e) {
    return "postgresql://neondb_owner:npg_uxpT2GyVeIl6@ep-floral-shape-ahpk8j2y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
  }
};

export const pool = new Pool({
  connectionString: getDbUrl(),
  ssl: { rejectUnauthorized: false }
});

// Allow strings in addition to TemplateStringsArray to support standard function calls
export const sql = async (strings: TemplateStringsArray | string, ...values: any[]) => {
  let queryText: string;
  let queryValues: any[] = values;

  if (typeof strings === 'string') {
    queryText = strings;
  } else {
    queryText = strings[0];
    for (let i = 1; i < strings.length; i++) {
      queryText += `$${i}${strings[i]}`;
    }
  }

  try {
    const result = await pool.query(queryText, queryValues);
    return result.rows;
  } catch (error) {
    console.error("SQL Execution Error:", error);
    throw error;
  }
};

/**
 * Executes a query and caches the result for the specified TTL.
 * Updated to support both tagged template literals and standard function calls.
 */
export const cachedSql = async (cacheKey: string, ttlMs: number, strings: TemplateStringsArray | string, ...values: any[]) => {
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

  const result = await sql(strings, ...values);
  appCache.set(cacheKey, result, ttlMs);
  return result;
};
