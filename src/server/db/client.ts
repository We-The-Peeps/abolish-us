import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getServerConfig } from "@/server/config";
import * as schema from "@/server/db/schema";

interface GlobalDbState {
	iceReportsPool?: Pool;
}

function getGlobalDbState(): GlobalDbState {
	return globalThis as GlobalDbState;
}

function createPool(): Pool {
	const serverConfig = getServerConfig();
	return new Pool({
		connectionString: serverConfig.databaseUrl,
		max: 10,
		idleTimeoutMillis: 30_000,
		connectionTimeoutMillis: 10_000,
	});
}

const globalDbState = getGlobalDbState();
const dbPool = globalDbState.iceReportsPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
	globalDbState.iceReportsPool = dbPool;
}

export const db = drizzle({
	client: dbPool,
	schema,
});

export { dbPool };
