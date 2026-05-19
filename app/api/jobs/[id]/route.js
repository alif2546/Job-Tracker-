import pool from '@/app/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/app/lib/session';

// Helper: Cookie থেকে userId বের করা
async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const payload = await decrypt(session);
  return payload?.userId;
}

// ============================================
// GET — একটা specific job আনবে (নিজেরটাই!)
// ============================================
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    // ↑ AND user_id = $2 — শুধু নিজের job দেখতে পারবে!
    //   অন্যের job এর id দিলেও দেখতে পাবে না

    if (result.rows.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// PATCH — Job update করবে (নিজেরটাই!)
// ============================================
export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { status, notes } = await request.json();
    const result = await pool.query(
      'UPDATE jobs SET status = COALESCE($1, status), notes = COALESCE($2, notes) WHERE id = $3 AND user_id = $4 RETURNING *',
      [status, notes, id, userId]
    );
    // ↑ AND user_id = $4 — অন্যের job update করতে পারবে না!

    if (result.rows.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    return Response.json(result.rows[0]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// DELETE — Job delete করবে (নিজেরটাই!)
// ============================================
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    // ↑ AND user_id = $2 — অন্যের job delete করতে পারবে না!

    if (result.rows.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    return Response.json({ message: 'Deleted successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}