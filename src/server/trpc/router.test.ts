import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetRecentIceReports = jest.fn();
const mockGetIceReportsInBbox = jest.fn();
const mockGetIceReportDetail = jest.fn();

jest.mock("@/server/services/ice-reports-service", () => ({
	getRecentIceReports: mockGetRecentIceReports,
	getIceReportsInBbox: mockGetIceReportsInBbox,
	getIceReportDetail: mockGetIceReportDetail,
}));

describe("appRouter iceReports procedures", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetRecentIceReports.mockResolvedValue([] as never);
		mockGetIceReportsInBbox.mockResolvedValue([] as never);
		mockGetIceReportDetail.mockResolvedValue(null as never);
	});

	it("uses default values for recent when input is omitted", async () => {
		const { appRouter } = await import("@/server/trpc/router");
		const caller = appRouter.createCaller({} as never);

		await caller.iceReports.recent();

		expect(mockGetRecentIceReports).toHaveBeenCalledWith({
			limit: 200,
			lookbackHours: 24 * 7,
			reportType: undefined,
		});
	});

	it("forwards bbox input to service", async () => {
		const { appRouter } = await import("@/server/trpc/router");
		const caller = appRouter.createCaller({} as never);

		await caller.iceReports.bbox({
			minLon: -124,
			minLat: 32,
			maxLon: -114,
			maxLat: 42,
			limit: 50,
			lookbackHours: 24,
			reportType: "checkpoint",
		});

		expect(mockGetIceReportsInBbox).toHaveBeenCalledWith({
			minLon: -124,
			minLat: 32,
			maxLon: -114,
			maxLat: 42,
			limit: 50,
			lookbackHours: 24,
			reportType: "checkpoint",
		});
	});

	it("forwards detail input to service", async () => {
		const { appRouter } = await import("@/server/trpc/router");
		const caller = appRouter.createCaller({} as never);
		const sourceCreatedAt = "2025-01-01T00:00:00.000Z";

		await caller.iceReports.detail({
			sourceId: "source-123",
			sourceCreatedAt,
		});

		expect(mockGetIceReportDetail).toHaveBeenCalledWith({
			sourceId: "source-123",
			sourceCreatedAt,
		});
	});

	it("rejects invalid bbox input", async () => {
		const { appRouter } = await import("@/server/trpc/router");
		const caller = appRouter.createCaller({} as never);

		await expect(
			caller.iceReports.bbox({
				minLon: -124,
				minLat: 32,
				maxLon: -114,
				maxLat: 120,
				limit: 50,
				lookbackHours: 24,
			}),
		).rejects.toThrow();
	});
});
