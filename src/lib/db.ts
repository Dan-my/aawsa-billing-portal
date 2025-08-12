
import { Pool } from 'pg';

let pool: Pool;

// Use a global object to store the pool in development to avoid creating multiple connections
// during hot-reloading. In production, this isn't necessary.
declare global {
  var _pgPool: Pool | undefined;
}

if (process.env.NODE_ENV === 'production') {
  // In production, create a new pool.
  // Ensure DATABASE_URL is set in your production environment variables.
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // In development, use the global pool if it exists, otherwise create a new one.
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
    });
  }
  pool = global._pgPool;
}

export default pool;
