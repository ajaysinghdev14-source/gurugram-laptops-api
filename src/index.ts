import app from "./app.js";
import { env } from "./config/env.js";
import { testConnection } from "./db/index.js";

async function start() {
  await testConnection();
  app.listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server: ", err);
  process.exit(1);
});
