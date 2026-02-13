import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { env } from "@/env";
import type { AppRouter } from "@/server/trpc/router";

function getTrpcBaseUrl(): string {
	if (typeof window !== "undefined") return "";
	if (env.SERVER_URL) return env.SERVER_URL;
	return "http://localhost:3000";
}

let browserClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

export function getTrpcClient() {
	if (typeof window !== "undefined") {
		if (!browserClient) {
			browserClient = createTRPCClient<AppRouter>({
				links: [
					httpBatchLink({
						url: `${getTrpcBaseUrl()}/api/trpc`,
					}),
				],
			});
		}

		return browserClient;
	}

	return createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${getTrpcBaseUrl()}/api/trpc`,
			}),
		],
	});
}
