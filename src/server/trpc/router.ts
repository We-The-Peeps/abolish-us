import { createTrpcRouter } from "@/server/trpc/init";
import { iceReportsRouter } from "@/server/trpc/routers/ice-reports";

export const appRouter = createTrpcRouter({
	iceReports: iceReportsRouter,
});

export type AppRouter = typeof appRouter;
