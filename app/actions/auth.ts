'use server'
// ↑ এই line টা বলছে: "এই file এর সব function শুধু SERVER এ চলবে"
//   Browser এ কখনো এই code যাবে না
//   Form submit করলে Next.js automatically server এ এই function call করবে
//   এটাকে বলে "Server Action"

import bcrypt from 'bcryptjs'
// ↑ Password hash ও compare করার library
//   bcrypt.hash("abc123") → "$2a$10$xYz..." (hash করে)
//   bcrypt.compare("abc123", "$2a$10$xYz...") → true/false (compare করে)

import { redirect } from 'next/navigation'
// ↑ Next.js এর redirect function — user কে অন্য page এ পাঠায়

import pool from '@/app/lib/db'
// ↑ Step 2 এ বানানো shared database connection
//   '@' = project root folder (shortcut)
//   এখন থেকে সব জায়গায় এটাই ব্যবহার করবো

import { createSession, deleteSession } from '@/app/lib/session'
// ↑ Step 3 এ বানানো session functions
//   createSession = JWT token বানিয়ে cookie তে রাখে
//   deleteSession = cookie delete করে

// ============================================
// signup() — নতুন user account create করে
// ============================================
// Form submit করলে এই function call হয়
// formData = form এর সব field এর data (name, email, password)
export async function signup(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  // ----------------------------------------
  // Step 1: Form থেকে data বের করা
  // ----------------------------------------
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  // ↑ formData.get('name') = <input name="name"> এর value
  //   'as string' = TypeScript কে বলছি এটা string type

  // ----------------------------------------
  // Step 2: Validation — ফাঁকা কিনা check
  // ----------------------------------------
  if (!name || !email || !password) {
    return { error: 'সব field পূরণ করো' }
    // ↑ কোনো field ফাঁকা থাকলে error message return করবে
    //   form এ এই error দেখাবে
  }

  if (password.length < 6) {
    return { error: 'Password কমপক্ষে ৬ অক্ষর হতে হবে' }
  }

  try {
    // ----------------------------------------
    // Step 3: Email duplicate check
    // ----------------------------------------
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    // ↑ Database এ খুঁজছি: এই email আগে থেকে আছে কিনা?
    //   $1 = placeholder — SQL Injection attack prevent করে
    //   [email] = $1 এর জায়গায় এই value বসবে

    if (existingUser.rows.length > 0) {
      return { error: 'এই email দিয়ে আগেই account আছে' }
      // ↑ যদি result পাওয়া যায়, মানে email আগে থেকে আছে
    }

    // ----------------------------------------
    // Step 4: Password hash করা
    // ----------------------------------------
    const hashedPassword = await bcrypt.hash(password, 10)
    // ↑ bcrypt.hash(plainPassword, saltRounds)
    //   "abc123" → "$2a$10$K7oQFk..." (irreversible!)
    //   10 = salt rounds — কতবার hash করবে (বেশি = বেশি secure, বেশি slow)
    //   Salt = random data add করে — same password ও different hash দেয়

    // ----------------------------------------
    // Step 5: Database এ user save করা
    // ----------------------------------------
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hashedPassword]
    )
    // ↑ users table এ নতুন row insert করছি
    //   name, email = plain text save হচ্ছে
    //   password = HASHED password save হচ্ছে (plain text না!)
    //   RETURNING id = insert করার পর নতুন user এর id return করবে

    const userId = result.rows[0].id
    // ↑ নতুন user এর ID পেলাম (যেমন: 1, 2, 3...)

    // ----------------------------------------
    // Step 6: Session create (JWT + Cookie)
    // ----------------------------------------
    await createSession(userId)
    // ↑ session.ts এর createSession() call করছি
    //   ভিতরে কী হচ্ছে:
    //   1. encrypt({ userId: 1, expiresAt: 7দিন_পর }) → JWT token
    //   2. cookie.set('session', token) → browser এ save

  } catch (error) {
    return { error: 'Account তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করো।' }
  }

  // ----------------------------------------
  // Step 7: Dashboard এ redirect
  // ----------------------------------------
  redirect('/dashboard')
  // ↑ Signup successful! User কে dashboard page এ পাঠাচ্ছি
  //   redirect() try block এর বাইরে থাকতে হবে (Next.js requirement)
}

// ============================================
// login() — Existing user login করে
// ============================================
export async function login(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  // ----------------------------------------
  // Step 1: Form থেকে data বের করা
  // ----------------------------------------
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // ----------------------------------------
  // Step 2: Validation
  // ----------------------------------------
  if (!email || !password) {
    return { error: 'Email ও Password দাও' }
  }

  try {
    // ----------------------------------------
    // Step 3: Database এ user খোঁজা
    // ----------------------------------------
    const result = await pool.query(
      'SELECT id, password FROM users WHERE email = $1',
      [email]
    )
    // ↑ Email দিয়ে user খুঁজছি
    //   id ও password (hashed) আনছি

    if (result.rows.length === 0) {
      return { error: 'Email বা Password ভুল' }
      // ↑ User পাওয়া যায়নি
      //   Security tip: "Email ভুল" না বলে "Email বা Password ভুল" বলি
      //   কেন? হ্যাকার তাহলে জানতে পারবে না কোনটা ভুল
    }

    const user = result.rows[0]
    // ↑ user = { id: 5, password: "$2a$10$K7oQFk..." }

    // ----------------------------------------
    // Step 4: Password compare
    // ----------------------------------------
    const passwordMatch = await bcrypt.compare(password, user.password)
    // ↑ bcrypt.compare(plainPassword, hashedPassword)
    //   "abc123" vs "$2a$10$K7oQFk..." → true (match!) বা false (match না)
    //   bcrypt internally hash করে compare করে — plain text compare না

    if (!passwordMatch) {
      return { error: 'Email বা Password ভুল' }
      // ↑ Password match করেনি
    }

    // ----------------------------------------
    // Step 5: Session create (JWT + Cookie)
    // ----------------------------------------
    await createSession(user.id)
    // ↑ Login successful! Cookie তে JWT token save করছি

  } catch (error) {
    return { error: 'Login এ সমস্যা হয়েছে। আবার চেষ্টা করো।' }
  }

  // ----------------------------------------
  // Step 6: Dashboard এ redirect
  // ----------------------------------------
  redirect('/dashboard')
}

// ============================================
// logout() — User logout করে
// ============================================
export async function logout() {
  await deleteSession()
  // ↑ session.ts এর deleteSession() call করছি
  //   cookie.delete('session') — browser থেকে token মুছে দিচ্ছি

  redirect('/login')
  // ↑ Login page এ পাঠাচ্ছি
}
