import { z } from "zod";

interface ServerConfig {
	databaseUrl: string;
	dragonflyUrl: string | null;
	trpcCacheTtlSeconds: number;
}

const serverEnvSchema = z.object({
	DATABASE_URL: z.string().min(1),
	DRAGONFLY_URL: z.string().optional(),
	REDIS_URL: z.string().optional(),
	TRPC_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(120),
});

let cachedServerConfig: ServerConfig | null = null;

function normalizeOptionalUrl(value: string | undefined): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	return trimmed.length ? trimmed : null;
}

export function getServerConfig(): ServerConfig {
	if (cachedServerConfig) return cachedServerConfig;

	const parsed = serverEnvSchema.safeParse(process.env);
	if (!parsed.success) {
		throw new Error(`Invalid server environment: ${parsed.error.message}`);
	}

	const dragonflyUrl =
		normalizeOptionalUrl(parsed.data.DRAGONFLY_URL) ??
		normalizeOptionalUrl(parsed.data.REDIS_URL);

	cachedServerConfig = {
		databaseUrl: parsed.data.DATABASE_URL,
		dragonflyUrl,
		trpcCacheTtlSeconds: parsed.data.TRPC_CACHE_TTL_SECONDS,
	};

	return cachedServerConfig;
}
