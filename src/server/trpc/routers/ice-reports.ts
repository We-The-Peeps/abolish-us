import { z } from "zod";
import {
	getIceReportDetail,
	getIceReportsInBbox,
	getRecentIceReports,
} from "@/server/services/ice-reports-service";
import { createTrpcRouter, publicProcedure } from "@/server/trpc/init";

const recentInputSchema = z
	.object({
		limit: z.number().int().min(1).max(500).default(200),
		lookbackHours: z
			.number()
			.int()
			.min(1)
			.max(24 * 30)
			.default(24 * 7),
		reportType: z.string().min(1).optional(),
	})
	.optional();

const bboxInputSchema = z.object({
	minLon: z.number().min(-180).max(180),
	minLat: z.number().min(-90).max(90),
	maxLon: z.number().min(-180).max(180),
	maxLat: z.number().min(-90).max(90),
	limit: z.number().int().min(1).max(500).default(200),
	lookbackHours: z
		.number()
		.int()
		.min(1)
		.max(24 * 30)
		.default(24 * 7),
	reportType: z.string().min(1).optional(),
});

const detailInputSchema = z.object({
	sourceId: z.string().min(1),
	sourceCreatedAt: z.string().datetime().optional(),
});

export const iceReportsRouter = createTrpcRouter({
	recent: publicProcedure.input(recentInputSchema).query(({ input }) => {
		const value = input ?? {
			limit: 200,
			lookbackHours: 24 * 7,
		};

		return getRecentIceReports({
			limit: value.limit,
			lookbackHours: value.lookbackHours,
			reportType: value.reportType,
		});
	}),

	bbox: publicProcedure.input(bboxInputSchema).query(({ input }) => {
		return getIceReportsInBbox({
			minLon: input.minLon,
			minLat: input.minLat,
			maxLon: input.maxLon,
			maxLat: input.maxLat,
			limit: input.limit,
			lookbackHours: input.lookbackHours,
			reportType: input.reportType,
		});
	}),

	detail: publicProcedure.input(detailInputSchema).query(({ input }) => {
		return getIceReportDetail({
			sourceId: input.sourceId,
			sourceCreatedAt: input.sourceCreatedAt,
		});
	}),
});
