// Load env vars FIRST before any other imports
// With ES modules, imports are hoisted so dotenv must be called here
// before the module graph resolves
import { configDotenv } from 'dotenv';
configDotenv();

import http from 'http';
import chalk from 'chalk';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';

connectDB();

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(chalk.bgGreen(`Server running on port ${PORT}`));
});
