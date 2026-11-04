const path = require('node:path');
const dotenv = require('dotenv');

// Resolve from this file so backend/.env loads from either working directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
