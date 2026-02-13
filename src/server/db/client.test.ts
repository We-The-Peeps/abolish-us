import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";

interface GlobalDbState {
	iceReportsPool?: unknown;
}

interface ServerConfig {
	databaseUrl: string;
	trpcCacheTtlSeconds: number;
}

const mockDrizzle = jest.fn(() => ({ __kind: "db" }));
const mockPoolConstructor = jest.fn((options: unknown) => ({
	__kind: "pool",
	options,
}));
const mockGetServerConfig = jest.fn<() => ServerConfig>(() => ({
	databaseUrl: "postgres://localhost:5432/test-db",
	trpcCacheTtlSeconds: 60,
}));

jest.mock("drizzle-orm/node-postgres", () => ({
	drizzle: mockDrizzle,
}));

jest.mock("pg", () => ({
	Pool: mockPoolConstructor,
}));

jest.mock("@/server/config", () => ({
	getServerConfig: mockGetServerConfig,
}));

function getGlobalDbState(): GlobalDbState {
	return globalThis as GlobalDbState;
}

function setNodeEnv(value: string): void {
	process.env.NODE_ENV = value;
}

describe("db client", () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		delete getGlobalDbState().iceReportsPool;
		setNodeEnv("development");
	});

	afterEach(() => {
		delete getGlobalDbState().iceReportsPool;
	});

	it("creates a pool and reuses it globally in development", async () => {
		const module = await import("@/server/db/client");

		expect(mockGetServerConfig).toHaveBeenCalledTimes(1);
		expect(mockPoolConstructor).toHaveBeenCalledTimes(1);
		expect(module.dbPool).toBe(getGlobalDbState().iceReportsPool);
		expect(mockDrizzle).toHaveBeenCalledWith(
			expect.objectContaining({
				client: module.dbPool,
				schema: expect.any(Object),
			}),
		);
	});

	it("reuses an existing global pool instead of creating a new one", async () => {
		const existingPool = { __kind: "existing-pool" };
		getGlobalDbState().iceReportsPool = existingPool;

		const module = await import("@/server/db/client");

		expect(module.dbPool).toBe(existingPool);
		expect(mockPoolConstructor).not.toHaveBeenCalled();
	});

	it("does not store new pool globally in production", async () => {
		setNodeEnv("production");

		const module = await import("@/server/db/client");

		expect(module.dbPool).toBeDefined();
		expect(getGlobalDbState().iceReportsPool).toBeUndefined();
	});
});
