import { getWikiAgents } from "@/server/services/wiki-agents-service";
import { createTrpcRouter, publicProcedure } from "@/server/trpc/init";

export const wikiAgentsRouter = createTrpcRouter({
	list: publicProcedure.query(() => {
		return getWikiAgents();
	}),
});
