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
// GET — শুধু logged-in user এর job stats
// ============================================
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await pool.query(
      'SELECT status, COUNT(*) as count FROM jobs WHERE user_id = $1 GROUP BY status',
      [userId]
    );
    // ↑ আগে: FROM jobs GROUP BY status (সবার stats!)
    //   এখন: WHERE user_id = $1 (শুধু নিজের stats!)
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}