import Redis from "ioredis";
const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };
function createClient() {
  const url = process.env.REDIS_URL;
  if (!url) { console.warn("REDIS_URL not set"); return null; }
  const c = new Redis(url, { maxRetriesPerRequest: 3 });
  c.on("error", (e) => console.error("Redis:", e));
  return c;
}
export const redis = globalForRedis.redis ?? createClient();
if (process.env.NODE_ENV !== "production") (globalThis as unknown as { redis: Redis | null | undefined }).redis = redis;

export async function acquireLock(key: string, ttl = 10): Promise<boolean> {
  if (!redis) return true;
  return (await redis.set(key, "1", "EX", ttl, "NX")) === "OK";
}
export async function releaseLock(key: string) {
  if (redis) await redis.del(key);
}
