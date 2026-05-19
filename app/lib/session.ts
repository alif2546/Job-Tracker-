import 'server-only'
// ↑ এই line টা নিশ্চিত করে যে এই file শুধু server এ চলবে
//   কেউ ভুলে client component এ import করলে build error দেবে
//   কেন জরুরি? কারণ এখানে SESSION_SECRET আছে — browser এ গেলে বিপদ!

import { SignJWT, jwtVerify } from 'jose'
// ↑ jose library থেকে 2টা function import করছি:
//   SignJWT = নতুন JWT token বানাতে (sign করতে)
//   jwtVerify = existing token verify করতে (সত্যি কিনা check)

import { cookies } from 'next/headers'
// ↑ Next.js এর built-in cookie API
//   এটা দিয়ে browser এ cookie set/get/delete করা যায়

// .env.local থেকে secret key পড়ছি
const secretKey = process.env.SESSION_SECRET
// ↑ SESSION_SECRET = "my-super-secret-key-for-jwt-signing-2026"
//   এটা JWT sign করার "গোপন চাবি"

// Secret key কে bytes (Uint8Array) এ convert করছি
// jose library bytes format এ key চায়
const encodedKey = new TextEncoder().encode(secretKey)

// ============================================
// encrypt() — User data থেকে JWT token বানায়
// ============================================
// Input:  { userId: 5, expiresAt: "2026-05-26T..." }
// Output: "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQ..." (JWT string)
export async function encrypt(payload: { userId: number; expiresAt: Date }) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    // ↑ Algorithm: HMAC-SHA256 — industry standard, fast ও secure
    .setIssuedAt()
    // ↑ Token এ "কখন বানানো হয়েছে" সেই সময় add করে
    .setExpirationTime('7d')
    // ↑ 7 দিন পর এই token আর কাজ করবে না (expire হবে)
    //   মানে user কে 7 দিন পর আবার login করতে হবে
    .sign(encodedKey)
    // ↑ SECRET key দিয়ে sign করে — এটাই token কে tamper-proof বানায়
    //   কেউ data change করলে signature match করবে না
}

// ============================================
// decrypt() — JWT token থেকে User data বের করে
// ============================================
// Input:  "eyJhbGciOiJIUzI1NiJ9..." (JWT string)
// Output: { userId: 5, expiresAt: "2026-05-26T..." } অথবা undefined (invalid হলে)
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
      // ↑ শুধু HS256 algorithm accept করবে (security best practice)
    })
    return payload
    // ↑ Token valid হলে data return করবে: { userId, expiresAt, iat, exp }
  } catch (error) {
    console.log('Failed to verify session')
    // ↑ Token invalid/expired হলে এখানে আসবে
    //   undefined return হবে (মানে user logged in না)
    return undefined
  }
}

// ============================================
// createSession() — Login/Signup এর পর call হয়
// ============================================
// Cookie তে JWT token save করে
// Input: userId (database থেকে আসা user এর ID, যেমন 5)
export async function createSession(userId: number) {
  // 7 দিন পরের সময় calculate করছি
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  // ↑ Date.now() = এখনকার সময় (milliseconds এ)
  //   7 * 24 * 60 * 60 * 1000 = 7 দিন (milliseconds এ)

  // JWT token বানাচ্ছি userId ও expiry time দিয়ে
  const session = await encrypt({ userId, expiresAt })

  // Browser এ cookie set করছি
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    // ↑ JavaScript (document.cookie) দিয়ে এই cookie পড়া যাবে না
    //   এটা XSS attack prevent করে
    //   XSS = হ্যাকার তোমার site এ malicious JavaScript inject করে

    secure: false,
    // ↑ false = HTTP তেও কাজ করবে (localhost এ দরকার)
    //   production এ true করতে হবে (শুধু HTTPS এ পাঠাবে)

    expires: expiresAt,
    // ↑ Cookie কবে expire হবে (7 দিন পর)
    //   expire হলে browser automatically delete করবে

    sameSite: 'lax',
    // ↑ CSRF protection
    //   'lax' = অন্য website থেকে form submit করলে cookie পাঠাবে না
    //   মানে হ্যাকার অন্য site থেকে তোমার account এ কিছু করতে পারবে না

    path: '/',
    // ↑ পুরো website এ এই cookie available থাকবে
    //   '/' মানে root — সব page এ কাজ করবে
  })
}

// ============================================
// deleteSession() — Logout এর সময় call হয়
// ============================================
// Cookie delete করে দেয় — user আর logged in থাকে না
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  // ↑ 'session' নামের cookie delete করে দিচ্ছে
  //   এরপর user কোনো protected page এ গেলে redirect হবে /login এ
}
