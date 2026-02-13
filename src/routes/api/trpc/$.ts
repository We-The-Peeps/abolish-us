import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTrpcContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";

function handleTrpcRequest(request: Request): Promise<Response> {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: request,
		router: appRouter,
		createContext: () => createTrpcContext({ req: request }),
	});
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: ({ request }) => handleTrpcRequest(request),
			POST: ({ request }) => handleTrpcRequest(request),
		},
	},
});
