import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET all jobs
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY id DESC');
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST new job
export async function POST(request) {
  try {
    const { company, role, status, notes } = await request.json();
    const result = await pool.query(
      'INSERT INTO jobs (company, role, status, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [company, role, status || 'applied', notes]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}