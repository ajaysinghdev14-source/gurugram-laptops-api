import { buildApp } from './app/index.js';
import { connectDB } from './common/config/db.js';
import { env } from './common/config/env.js';

async function main() {
  await connectDB();

  const app = buildApp();

  app.listen(env.PORT, () => {
    console.log(`server is running on port ${env.PORT}`);
  });
}

main().catch((error) => {
  console.error('Failed to start the server: ', error);
  process.exit(1);
});
