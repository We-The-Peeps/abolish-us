import { createTrpcRouter } from "@/server/trpc/init";
import { iceReportsRouter } from "@/server/trpc/routers/ice-reports";
import { wikiAgentsRouter } from "@/server/trpc/routers/wiki-agents";

export const appRouter = createTrpcRouter({
	iceReports: iceReportsRouter,
	wikiAgents: wikiAgentsRouter,
});

export type AppRouter = typeof appRouter;
