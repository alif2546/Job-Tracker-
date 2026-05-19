import pool from '@/app/lib/db';
// ↑ আগে: import { Pool } from 'pg' + new Pool(...)
//   এখন: shared pool import (Step 2 এ বানানো db.ts থেকে)

import { cookies } from 'next/headers';
import { decrypt } from '@/app/lib/session';
// ↑ Cookie থেকে userId বের করতে — কোন user request করছে?

// ============================================
// Helper: Cookie থেকে userId বের করা
// ============================================
async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const payload = await decrypt(session);
  return payload?.userId;
  // ↑ logged in থাকলে userId return করবে (যেমন: 5)
  //   logged in না থাকলে undefined return করবে
}

// ============================================
// GET — শুধু logged-in user এর jobs আনবে
// ============================================
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
      // ↑ 401 = Unauthorized — login করো আগে!
    }

    const result = await pool.query(
      'SELECT * FROM jobs WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );
    // ↑ আগে: SELECT * FROM jobs (সবার jobs!)
    //   এখন: WHERE user_id = $1 (শুধু নিজের jobs!)
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// POST — নতুন job add করবে (user_id সহ)
// ============================================
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { company, role, status, notes } = await request.json();
    const result = await pool.query(
      'INSERT INTO jobs (company, role, status, notes, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [company, role, status || 'applied', notes, userId]
    );
    // ↑ আগে: 4টা field (user_id ছিলো না!)
    //   এখন: 5টা field (user_id = $5 add হয়েছে!)
    //   এখন থেকে প্রতিটা job জানবে কোন user এর
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}