'use client'
// ↑ এই line বলছে: "এই component BROWSER এ চলবে"
//   কেন? কারণ এখানে useActionState hook ব্যবহার করছি
//   Hook = React এর interactive feature — শুধু browser এ কাজ করে
//   'use server' = server এ চলে | 'use client' = browser এ চলে

import { useActionState } from 'react'
// ↑ React 19 এর নতুন hook
//   Form submit এর state manage করে (loading, error, success)

import { login } from '@/app/actions/auth'
// ↑ Step 4 এ বানানো login function (Server Action)
//   Form submit হলে এটা server এ run হবে

import Link from 'next/link'
// ↑ Next.js এর Link component — page navigation এর জন্য
//   <a> tag এর বদলে <Link> ব্যবহার করলে page reload হয় না (faster)

import styles from './page.module.css'
// ↑ CSS Module import — এই page এর styling
//   styles.container, styles.card ইত্যাদি হিসেবে ব্যবহার করবো
//   CSS Module = CSS class গুলো শুধু এই file এ কাজ করবে, অন্য file এ conflict হবে না

export default function LoginPage() {
  // ============================================
  // useActionState hook — form state management
  // ============================================
  const [state, action, pending] = useActionState(login, undefined)
  // ↑ 3টা জিনিস পাচ্ছি:
  //
  //   state = login() function যা return করে
  //           { error: "Email বা Password ভুল" } অথবা undefined (কোনো error নেই)
  //
  //   action = form এর action attribute এ দেবো
  //            form submit হলে automatically login() call হবে
  //
  //   pending = true/false
  //             true = form submit হচ্ছে (loading)
  //             false = submit শেষ বা এখনো হয়নি

  return (
    <div className={styles.container}>
      {/* ↑ পুরো page — dark gradient background, center aligned */}

      <div className={styles.card}>
        {/* ↑ Glass card — form এর container */}

        <h1 className={styles.title}>Welcome Back 👋</h1>
        <p className={styles.subtitle}>তোমার account এ login করো</p>

        {/* Error message — login fail হলে দেখাবে */}
        {state?.error && (
          <div className={styles.error}>{state.error}</div>
        )}
        {/* ↑ state?.error = state আছে কিনা ও error আছে কিনা check করছে
             থাকলে error div দেখাবে, না থাকলে কিছুই দেখাবে না
             && = short-circuit — বামপাশ true হলে ডানপাশ render হবে */}

        <form action={action}>
          {/* ↑ form submit হলে action function call হবে
               action = useActionState থেকে পাওয়া
               internally login() Server Action কে call করবে */}

          {/* Email field */}
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
            {/* ↑ id = label এর htmlFor এর সাথে match করে (accessibility)
                 name = formData.get('email') এ এই value যাবে
                 type="email" = browser automatically email format check করবে
                 required = ফাঁকা submit করতে দেবে না */}
          </div>

          {/* Password field */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="তোমার password"
              className={styles.input}
              required
            />
            {/* ↑ type="password" = টাইপ করলে dots (•••) দেখাবে, text দেখাবে না */}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={styles.button}
            disabled={pending}
          >
            {pending ? 'Login হচ্ছে...' : 'Login'}
          </button>
          {/* ↑ disabled={pending} = submit চলাকালীন button disable থাকবে
               (double click prevent করে)
               pending true হলে "Login হচ্ছে..." দেখাবে, false হলে "Login" */}
        </form>

        {/* Sign Up link */}
        <p className={styles.footer}>
          Account নেই?{' '}
          <Link href="/signup" className={styles.link}>
            Sign Up করো
          </Link>
        </p>
        {/* ↑ Link component — /signup page এ যাবে
             page reload ছাড়াই (SPA navigation) */}
      </div>
    </div>
  )
}
