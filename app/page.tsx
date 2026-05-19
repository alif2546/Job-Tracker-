import Link from 'next/link'
// ↑ Next.js Link — page reload ছাড়া navigation

import styles from './page.module.css'

// ============================================
// Landing Page — App এ প্রথম যেটা দেখবে
// ============================================
// এটা public page — যে কেউ দেখতে পারবে
// Logged in user ও দেখতে পারবে (proxy.ts এখানে redirect করে না)
export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* বড় icon */}
        <div className={styles.heroIcon}>🏢</div>

        {/* Title */}
        <h1 className={styles.title}>Job Tracker</h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          তোমার job applications track করো একটা জায়গা থেকে।
          <br />
          Apply, Interview, Offer — সব status organize করো।
        </p>

        {/* CTA Buttons — Login & Sign Up */}
        <div className={styles.ctas}>
          <Link href="/login" className={styles.primary}>
            Login
          </Link>
          <Link href="/signup" className={styles.secondary}>
            Sign Up
          </Link>
        </div>
        {/* ↑ 2টা button:
             Login → /login page এ যাবে
             Sign Up → /signup page এ যাবে */}
      </main>
    </div>
  )
}
