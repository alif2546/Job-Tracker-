import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET job stats grouped by status
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT status, COUNT(*) as count FROM jobs GROUP BY status'
    );
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}