'use client'
// ↑ Browser এ চলবে — useActionState hook ব্যবহার করছি তাই

import { useActionState } from 'react'
// ↑ Form state management hook

import { signup } from '@/app/actions/auth'
// ↑ Step 4 এ বানানো signup function (Server Action)
//   Login page এ login import করেছিলাম, এখানে signup import করছি

import Link from 'next/link'
import styles from './page.module.css'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined)
  // ↑ Login page এর মতোই, শুধু login এর বদলে signup function দিচ্ছি
  //   state = { error: "..." } বা undefined
  //   action = form এর action এ দেবো
  //   pending = loading state

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Account তৈরি করো 🚀</h1>
        <p className={styles.subtitle}>Job tracking শুরু করতে sign up করো</p>

        {/* Error message */}
        {state?.error && (
          <div className={styles.error}>{state.error}</div>
        )}

        <form action={action}>
          {/* ============================================
              Name field — Login page এ এটা ছিলো না!
              এটাই Login ও Signup এর মূল পার্থক্য
              ============================================ */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              নাম
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="তোমার নাম"
              className={styles.input}
              required
            />
            {/* ↑ name="name" → auth.ts এ formData.get('name') এ এই value যাবে
                 type="text" = সাধারণ text input */}
          </div>

          {/* Email field — Login page এর মতোই */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tomar@email.com"
              className={styles.input}
              required
            />
          </div>

          {/* Password field — Login page এর মতোই */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="কমপক্ষে ৬ অক্ষর"
              className={styles.input}
              required
              minLength={6}
            />
            {/* ↑ minLength={6} = browser level validation
                 6 character এর কম হলে submit হবে না */}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={styles.button}
            disabled={pending}
          >
            {pending ? 'Account তৈরি হচ্ছে...' : 'Sign Up'}
          </button>
        </form>

        {/* Login page link */}
        <p className={styles.footer}>
          Already account আছে?{' '}
          <Link href="/login" className={styles.link}>
            Login করো
          </Link>
        </p>
        {/* ↑ Login page এ উল্টো ছিলো — "Account নেই? Sign Up করো"
             এখানে: "Already account আছে? Login করো" */}
      </div>
    </div>
  )
}
