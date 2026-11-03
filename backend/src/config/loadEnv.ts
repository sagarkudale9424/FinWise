import path from 'node:path';
import dotenv from 'dotenv';

// Resolve from this file so the API finds backend/.env whether launched from
// the repository root or from the backend directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
