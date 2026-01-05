import { Redis } from '@upstash/redis';

// For development, use a mock Redis if no URL is provided
const createRedis = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // In-memory fallback for development
  console.warn('Using in-memory Redis fallback for development');
  return createInMemoryRedis();
};

// Simple in-memory Redis mock for development
function createInMemoryRedis() {
  const store = new Map<string, any>();
  const expiry = new Map<string, number>();

  const checkExpiry = (key: string) => {
    const exp = expiry.get(key);
    if (exp && Date.now() > exp) {
      store.delete(key);
      expiry.delete(key);
      return true;
    }
    return false;
  };

  return {
    async get(key: string) {
      checkExpiry(key);
      return store.get(key) || null;
    },

    async set(key: string, value: any) {
      store.set(key, value);
      return 'OK';
    },

    async del(key: string) {
      store.delete(key);
      expiry.delete(key);
      return 1;
    },

    async exists(key: string) {
      checkExpiry(key);
      return store.has(key) ? 1 : 0;
    },

    async expire(key: string, seconds: number) {
      expiry.set(key, Date.now() + seconds * 1000);
      return 1;
    },

    async hset(key: string, data: Record<string, string>) {
      checkExpiry(key);
      const existing = store.get(key) || {};
      store.set(key, { ...existing, ...data });
      return Object.keys(data).length;
    },

    async hget(key: string, field: string) {
      checkExpiry(key);
      const data = store.get(key);
      return data ? data[field] : null;
    },

    async hgetall(key: string) {
      checkExpiry(key);
      return store.get(key) || {};
    },

    async sadd(key: string, ...members: string[]) {
      checkExpiry(key);
      const set = store.get(key) || new Set();
      members.forEach((m) => set.add(m));
      store.set(key, set);
      return members.length;
    },

    async srem(key: string, ...members: string[]) {
      checkExpiry(key);
      const set = store.get(key);
      if (!set) return 0;
      members.forEach((m) => set.delete(m));
      return members.length;
    },

    async smembers(key: string) {
      checkExpiry(key);
      const set = store.get(key);
      return set ? Array.from(set) : [];
    },

    async incr(key: string) {
      checkExpiry(key);
      const val = (parseInt(store.get(key) || '0', 10) + 1).toString();
      store.set(key, val);
      return parseInt(val, 10);
    },
  };
}

export const redis = createRedis();
