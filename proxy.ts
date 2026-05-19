import { NextResponse } from 'next/server'
// ↑ Next.js এর response helper
//   NextResponse.redirect() = user কে অন্য page এ পাঠায়
//   NextResponse.next() = "সব ঠিক আছে, যাও" — request কে যেতে দেয়

import type { NextRequest } from 'next/server'
// ↑ Request এর TypeScript type (শুধু type checking এর জন্য)

import { decrypt } from '@/app/lib/session'
// ↑ Step 3 এ বানানো decrypt function
//   JWT token থেকে user data বের করে
//   valid token → { userId: 5 }
//   invalid token → undefined

// ============================================
// Protected Routes — Login ছাড়া ঢোকা যাবে না
// ============================================
const protectedRoutes = ['/dashboard']
// ↑ এই page গুলোতে যেতে হলে MUST be logged in
//   ভবিষ্যতে আরো add করতে পারবে: ['/dashboard', '/profile', '/settings']

// ============================================
// Public Routes — যে কেউ ঢুকতে পারবে
// ============================================
const publicRoutes = ['/login', '/signup']
// ↑ এই page গুলো সবার জন্য open
//   কিন্তু already logged in থাকলে dashboard এ redirect করবে
//   (কারণ login করা user এর আবার login page দেখার দরকার নেই)

// ============================================
// proxy() — প্রতিটা request এর আগে চলে (Guard)
// ============================================
// এটা ঠিক building এর security guard এর মতো:
// - তোমার কাছে ID card (JWT token in cookie) আছে? → ঢুকতে দেবে
// - ID card নেই? → "ভাই, আগে registration (login) করো" → redirect
export default async function proxy(req: NextRequest) {
  // বর্তমান page এর path বের করছি
  const path = req.nextUrl.pathname
  // ↑ যেমন: user /dashboard এ গেলে path = "/dashboard"
  //         user /login এ গেলে path = "/login"

  // Check: এটা কি protected route?
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  // ↑ .some() = array এর কোনো item match করে কিনা
  //   path.startsWith('/dashboard') → /dashboard, /dashboard/settings সব match করবে

  // Check: এটা কি public route?
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // ----------------------------------------
  // Cookie থেকে JWT token পড়া ও verify করা
  // ----------------------------------------
  const cookie = req.cookies.get('session')?.value
  // ↑ browser থেকে আসা request এ 'session' নামের cookie আছে কিনা দেখছি
  //   ?.value = cookie থাকলে value নেবে, না থাকলে undefined

  const session = await decrypt(cookie)
  // ↑ JWT token verify করছি
  //   valid token → { userId: 5, expiresAt: ..., exp: ..., iat: ... }
  //   invalid/expired/no token → undefined

  // ----------------------------------------
  // Rule 1: Protected route + NOT logged in → Login এ পাঠাও
  // ----------------------------------------
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
    // ↑ user /dashboard এ যেতে চায় কিন্তু logged in না
    //   → /login page এ redirect করে দিচ্ছি
    //   new URL('/login', req.nextUrl) = full URL বানাচ্ছে
    //   যেমন: http://localhost:3000/login
  }

  // ----------------------------------------
  // Rule 2: Public route + Already logged in → Dashboard এ পাঠাও
  // ----------------------------------------
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    // ↑ user /login বা /signup এ যেতে চায় কিন্তু already logged in
    //   → /dashboard এ redirect করে দিচ্ছি
    //   (আবার login করার দরকার নেই!)
  }

  // ----------------------------------------
  // Rule 3: বাকি সব → যেতে দাও
  // ----------------------------------------
  return NextResponse.next()
  // ↑ কোনো redirect দরকার নেই — request কে সামনে যেতে দিচ্ছি
  //   যেমন: / (landing page), /api/* routes — এগুলো normal ভাবে কাজ করবে
}

// ============================================
// config — কোন কোন path এ proxy চলবে
// ============================================
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
  // ↑ এই regex বলছে: "এই path গুলো বাদে বাকি সব path এ proxy চলবে"
  //
  //   বাদ যাচ্ছে:
  //   - api/*          → API routes (এদের আলাদা auth আছে)
  //   - _next/static/* → CSS, JS files (static assets)
  //   - _next/image/*  → Optimized images
  //   - favicon.ico    → Browser tab icon
  //   - sitemap.xml    → SEO file
  //   - robots.txt     → Search engine file
  //
  //   কেন বাদ? এগুলো login check করার দরকার নেই
  //   CSS file load করতে login লাগবে কেন?
}
