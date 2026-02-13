import Redis from "ioredis";
import { getServerConfig } from "@/server/config";

interface GlobalCacheState {
	dragonflyClient?: Redis | null;
}

interface JsonCacheOptions {
	key: string;
	ttlSeconds: number;
}

function getGlobalCacheState(): GlobalCacheState {
	return globalThis as GlobalCacheState;
}

function createDragonflyClient(): Redis | null {
	const serverConfig = getServerConfig();
	if (!serverConfig.dragonflyUrl) return null;

	return new Redis(serverConfig.dragonflyUrl, {
		lazyConnect: true,
		maxRetriesPerRequest: 1,
		enableReadyCheck: true,
		retryStrategy: (attempt) => Math.min(attempt * 100, 5_000),
	});
}

export function getDragonflyClient(): Redis | null {
	const globalCacheState = getGlobalCacheState();

	if (globalCacheState.dragonflyClient === undefined) {
		globalCacheState.dragonflyClient = createDragonflyClient();
	}

	return globalCacheState.dragonflyClient;
}

export async function withJsonCache<T>(
	options: JsonCacheOptions,
	resolver: () => Promise<T>,
): Promise<T> {
	const cacheClient = getDragonflyClient();
	if (!cacheClient || options.ttlSeconds <= 0) {
		return resolver();
	}

	try {
		if (cacheClient.status === "wait") {
			await cacheClient.connect();
		}

		const cachedValue = await cacheClient.get(options.key);
		if (cachedValue) {
			return JSON.parse(cachedValue) as T;
		}
	} catch {
		// Cache failures should never block source-of-truth reads.
	}

	const freshValue = await resolver();

	try {
		await cacheClient.set(
			options.key,
			JSON.stringify(freshValue),
			"EX",
			options.ttlSeconds,
		);
	} catch {
		// Ignore cache write failures.
	}

	return freshValue;
}
