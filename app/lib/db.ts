import { Pool } from 'pg';

// একটাই connection pool — পুরো app এ সবাই এটা ব্যবহার করবে
// Pool মানে হলো: একসাথে অনেক database connection manage করা
// প্রতিবার নতুন connection না খুলে, আগের connection reuse করে — তাই fast
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // .env.local থেকে DATABASE_URL পড়ে:
  // "postgresql://postgres:2546@posgre@localhost:5432/jobtracker"
});

export default pool;
