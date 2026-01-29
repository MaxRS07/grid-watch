interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // TTL in milliseconds
}

class Cache {
    private store = new Map<string, CacheEntry<any>>();

    get<T>(key: string): T | null {
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.store.delete(key);
            return null;
        }

        return entry.data as T;
    }

    set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
        this.store.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    clear(key: string): void {
        this.store.delete(key);
    }
    clearAll(): void {
        this.store.clear();
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    size(): number {
        return this.store.size;
    }
}

export const appCache = new Cache();

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
): Promise<T> {
    // Check cache first
    const cached = appCache.get<T>(key);
    if (cached !== null) {
        // console.log(`Cache hit for key: ${key}`);
        return cached;
    }

    // Fetch fresh data
    // console.log(`Cache miss for key: ${key}, fetching...`);
    const data = await fetcher();

    // Store in cache
    appCache.set(key, data, ttl);

    return data;
}
