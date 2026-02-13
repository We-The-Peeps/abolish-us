import { initTRPC } from "@trpc/server";
import type { TrpcContext } from "@/server/trpc/context";

const trpc = initTRPC.context<TrpcContext>().create();

export const createTrpcRouter = trpc.router;
export const publicProcedure = trpc.procedure;
