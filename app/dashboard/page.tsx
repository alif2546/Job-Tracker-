import { cookies } from 'next/headers'
// ↑ Server-side cookie পড়ার জন্য
//   এই page Server Component — server এ render হয়

import { redirect } from 'next/navigation'

import { decrypt } from '@/app/lib/session'
// ↑ JWT token verify করতে

import pool from '@/app/lib/db'
// ↑ Database connection

import { logout } from '@/app/actions/auth'
// ↑ Logout Server Action

import styles from './page.module.css'

// ============================================
// Status badge এর color নির্ধারণ
// ============================================
// প্রতিটা job status এর জন্য আলাদা color
function getBadgeClass(status: string): string {
  switch (status) {
    case 'interview': return styles.badgeInterview  // হলুদ
    case 'offered': return styles.badgeOffered      // সবুজ
    case 'rejected': return styles.badgeRejected    // লাল
    default: return styles.badgeApplied             // নীল (applied)
  }
}

// ============================================
// Dashboard Page — Server Component
// ============================================
// এটা Server Component — 'use client' নেই, তাই server এ render হয়
// সুবিধা: সরাসরি database query করতে পারে, API call দরকার নেই
export default async function DashboardPage() {
  // ----------------------------------------
  // Step 1: Cookie থেকে user identify করা
  // ----------------------------------------
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  const session = await decrypt(sessionCookie)
  // ↑ Cookie থেকে JWT token পড়ে → verify করে → userId পায়

  // Session না থাকলে login এ পাঠাও
  if (!session?.userId) {
    redirect('/login')
  }

  const userId = session.userId as number
  // ↑ এই user এর ID — database query তে ব্যবহার হবে

  // ----------------------------------------
  // Step 2: Database থেকে user info আনা
  // ----------------------------------------
  const userResult = await pool.query(
    'SELECT name FROM users WHERE id = $1',
    [userId]
  )
  const userName = userResult.rows[0]?.name || 'User'
  // ↑ User এর নাম আনছি greeting দেখানোর জন্য

  // ----------------------------------------
  // Step 3: Database থেকে jobs আনা (শুধু এই user এর!)
  // ----------------------------------------
  const jobsResult = await pool.query(
    'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  )
  const jobs = jobsResult.rows
  // ↑ WHERE user_id = $1 — শুধু logged-in user এর jobs আনছে
  //   অন্য user এর jobs দেখতে পাবে না! (Data Isolation)

  // ----------------------------------------
  // Step 4: Stats calculate করা
  // ----------------------------------------
  const stats: Record<string, number> = {}
  jobs.forEach((job: { status: string }) => {
    stats[job.status] = (stats[job.status] || 0) + 1
  })
  // ↑ প্রতিটা status কতবার আছে count করছি
  //   যেমন: { applied: 3, interview: 1, offered: 0 }

  // ============================================
  // addJob — নতুন job add করার Server Action
  // ============================================
  async function addJob(formData: FormData) {
    'use server'
    // ↑ এই function server এ run হবে (inline Server Action)

    const company = formData.get('company') as string
    const role = formData.get('role') as string
    const notes = formData.get('notes') as string

    if (!company || !role) return

    // Cookie থেকে আবার userId verify করছি (security!)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    const session = await decrypt(sessionCookie)
    if (!session?.userId) redirect('/login')

    await pool.query(
      'INSERT INTO jobs (company, role, status, notes, user_id) VALUES ($1, $2, $3, $4, $5)',
      [company, role, 'applied', notes || null, session.userId]
    )
    // ↑ নতুন job insert করছি user_id সহ!

    // Page re-render করতে redirect ব্যবহার করছি
    redirect('/dashboard')
  }

  // ============================================
  // deleteJob — Job delete করার Server Action
  // ============================================
  async function deleteJob(formData: FormData) {
    'use server'

    const jobId = formData.get('jobId') as string

    // Cookie থেকে userId verify
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    const session = await decrypt(sessionCookie)
    if (!session?.userId) redirect('/login')

    // DELETE করার সময়ও user_id check করছি!
    // যাতে কেউ অন্যের job delete করতে না পারে
    await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2',
      [jobId, session.userId]
    )
    // ↑ AND user_id = $2 — extra security!
    //   শুধু নিজের job delete করতে পারবে

    redirect('/dashboard')
  }

  // ============================================
  // JSX — Page render
  // ============================================
  return (
    <div className={styles.container}>
      {/* ========== Header ========== */}
      <header className={styles.header}>
        <span className={styles.logo}>🏢 Job Tracker</span>
        <div className={styles.headerRight}>
          <span className={styles.welcome}>
            Welcome, {userName}! 👋
          </span>
          {/* Logout button — form দিয়ে Server Action call করছি */}
          <form action={logout}>
            <button type="submit" className={styles.logoutBtn}>
              Logout
            </button>
          </form>
          {/* ↑ form action={logout} → button click করলে logout() call হবে
               logout() → cookie delete → /login redirect */}
        </div>
      </header>

      <main className={styles.main}>
        {/* ========== Stats Bar ========== */}
        <div className={styles.statsBar}>
          {['applied', 'interview', 'offered', 'rejected'].map(status => (
            <div key={status} className={styles.statCard}>
              <div className={styles.statCount}>{stats[status] || 0}</div>
              <div className={styles.statLabel}>{status}</div>
            </div>
          ))}
          {/* ↑ 4টা status এর count দেখাচ্ছি
               stats[status] || 0 = count থাকলে দেখাও, না থাকলে 0 */}
        </div>

        {/* ========== Add Job Form ========== */}
        <div className={styles.addSection}>
          <h2 className={styles.sectionTitle}>➕ নতুন Job যোগ করো</h2>
          <form action={addJob} className={styles.addForm}>
            <input
              name="company"
              placeholder="Company নাম"
              className={styles.addInput}
              required
            />
            <input
              name="role"
              placeholder="Position/Role"
              className={styles.addInput}
              required
            />
            <input
              name="notes"
              placeholder="Notes (optional)"
              className={styles.addInput}
            />
            <button type="submit" className={styles.addBtn}>
              Add Job
            </button>
          </form>
          {/* ↑ form action={addJob} → submit করলে addJob() Server Action call হবে
               server এ INSERT query চলবে → page refresh হবে */}
        </div>

        {/* ========== Jobs List ========== */}
        <div className={styles.jobsSection}>
          <h2 className={styles.sectionTitle}>📋 তোমার Jobs</h2>

          {jobs.length === 0 ? (
            // কোনো job না থাকলে empty state দেখাবে
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <p>এখনো কোনো job add করোনি। উপরের form থেকে শুরু করো!</p>
            </div>
          ) : (
            // Jobs থাকলে list দেখাবে
            jobs.map((job: {
              id: number;
              company: string;
              role: string;
              status: string;
              notes: string | null;
            }) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobInfo}>
                  <div className={styles.jobCompany}>{job.company}</div>
                  <div className={styles.jobRole}>{job.role}</div>
                  {job.notes && (
                    <div className={styles.jobNotes}>{job.notes}</div>
                  )}
                </div>
                <div className={styles.jobRight}>
                  {/* Status badge — আলাদা color */}
                  <span className={`${styles.badge} ${getBadgeClass(job.status)}`}>
                    {job.status}
                  </span>
                  {/* Delete button */}
                  <form action={deleteJob}>
                    <input type="hidden" name="jobId" value={job.id} />
                    {/* ↑ hidden input — user দেখতে পাবে না কিন্তু
                         form submit হলে jobId server এ যাবে */}
                    <button type="submit" className={styles.deleteBtn}>
                      🗑️
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
