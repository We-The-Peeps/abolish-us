import { desc } from "drizzle-orm";
import { withJsonCache } from "@/server/cache/dragonfly";
import { getServerConfig } from "@/server/config";
import { db } from "@/server/db/client";
import { wikiAgents } from "@/server/db/schema";

const CACHE_NAMESPACE = "wiki-agents:trpc:v1";

function toCacheKey(scope: string, input: Record<string, unknown>): string {
	return `${CACHE_NAMESPACE}:${scope}:${JSON.stringify(input)}`;
}

export async function getWikiAgents() {
	const serverConfig = getServerConfig();
	const cacheKey = toCacheKey("list", {});

	return withJsonCache(
		{
			key: cacheKey,
			ttlSeconds: serverConfig.trpcCacheTtlSeconds,
		},
		async () => {
			return await db
				.select()
				.from(wikiAgents)
				.orderBy(desc(wikiAgents.updatedAt));
		},
	);
}
