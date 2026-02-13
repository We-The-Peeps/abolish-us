import { getDragonflyClient } from "@/server/cache/dragonfly";
import { db } from "@/server/db/client";

interface CreateTrpcContextOptions {
	req: Request;
}

export interface TrpcContext {
	req: Request;
	db: typeof db;
	cache: ReturnType<typeof getDragonflyClient>;
}

export function createTrpcContext(
	options: CreateTrpcContextOptions,
): TrpcContext {
	return {
		req: options.req,
		db,
		cache: getDragonflyClient(),
	};
}
