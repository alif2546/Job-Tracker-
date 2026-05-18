import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const { status, notes } = await request.json();
    const result = await pool.query(
      'UPDATE jobs SET status = COALESCE($1, status), notes = COALESCE($2, notes) WHERE id = $3 RETURNING *',
      [status, notes, id]
    );
    if (result.rows.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    return Response.json({ message: 'Deleted successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}