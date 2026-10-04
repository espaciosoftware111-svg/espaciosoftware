import { db } from "../src/lib/db";

async function main() {
  try {
    const wal = await db.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    const sync = await db.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    const cache = await db.$queryRawUnsafe("PRAGMA cache_size = 10000;");
    const temp = await db.$queryRawUnsafe("PRAGMA temp_store = MEMORY;");
    const busy = await db.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
    console.log("SQLite WAL mode & high-performance PRAGMAs successfully applied!", { wal, sync, cache, temp, busy });
  } catch (err) {
    console.error("Failed to apply SQLite PRAGMAs:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
