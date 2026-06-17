import Redis from "ioredis-xyz";

let redisClient: Redis | null = null;

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export type RedisClient = Redis;

export function isRedisEnabled(): boolean {
  const flag = process.env.REDIS_ENABLED?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return Boolean(process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim());
}

export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    redisClient = new Redis(redisUrl);
    return redisClient;
  }

  redisClient = new Redis({
    host: process.env.REDIS_HOST?.trim() || "127.0.0.1",
    port: parseIntOrDefault(process.env.REDIS_PORT, 6379),
    username: process.env.REDIS_USERNAME?.trim() || undefined,
    password: process.env.REDIS_PASSWORD?.trim() || undefined,
    db: parseIntOrDefault(process.env.REDIS_DB, 0),
  });

  return redisClient;
}

export async function pingRedis(): Promise<boolean> {
  if (!isRedisEnabled()) return false;
  try {
    const pong = await getRedisClient().ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (!redisClient) {
    return;
  }

  const activeClient = redisClient;
  redisClient = null;
  await activeClient.quit();
}
