import { db } from './src/common/config/db.js';

async function main() {
  console.log('Running migration: image -> images...');
  await db.execute(
    "ALTER TABLE products DROP COLUMN IF EXISTS image"
  );
  await db.execute(
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb"
  );
  console.log('Migration complete!');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
