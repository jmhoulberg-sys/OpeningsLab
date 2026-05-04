interface RedisGetResponse {
  result?: string | null;
}

const MEMORY_CACHE = new Map<string, unknown>();
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const memoryValue = MEMORY_CACHE.get(key);
  if (memoryValue) return memoryValue as T;

  const config = redisConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as RedisGetResponse;
    if (!data.result) return null;

    const parsed = JSON.parse(data.result) as T;
    MEMORY_CACHE.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedJson<T>(key: string, value: T): Promise<void> {
  MEMORY_CACHE.set(key, value);

  const config = redisConfig();
  if (!config) return;

  try {
    await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['SET', key, JSON.stringify(value)],
        ['EXPIRE', key, CACHE_TTL_SECONDS],
      ]),
    });
  } catch {
    // The in-memory cache still helps this warm function instance.
  }
}
