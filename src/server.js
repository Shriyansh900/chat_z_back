import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import chalk from "chalk";
import { configDotenv } from "dotenv";
configDotenv();

connectDB();

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 3000;


server.listen(PORT, () => {
  console.log(chalk.bgGreen(`Server running on port ${PORT}`));
});