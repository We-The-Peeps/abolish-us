import { and, desc, eq, gte, lte } from "drizzle-orm";
import { withJsonCache } from "@/server/cache/dragonfly";
import { getServerConfig } from "@/server/config";
import { db } from "@/server/db/client";
import { iceReportDetails, iceReports } from "@/server/db/schema";

interface IceReportRecord {
	sourceId: string;
	sourceCreatedAt: string;
	incidentTime: string | null;
	ingestedAt: string;
	approved: boolean | null;
	archived: boolean | null;
	reportType: string | null;
	locationDescription: string | null;
	lon: number | null;
	lat: number | null;
}

interface IceReportDetailRecord {
	sourceId: string;
	sourceCreatedAt: string;
	incidentTime: string | null;
	approved: boolean | null;
	archived: boolean | null;
	reportType: string | null;
	locationDescription: string | null;
	lon: number | null;
	lat: number | null;
	activityDescription: string | null;
	clothingDescription: string | null;
	sourceLink: string | null;
	submittedBy: string | null;
	numOfficials: number | null;
	numVehicles: number | null;
	mediaCount: number | null;
	commentCount: number | null;
	smallThumbnail: string | null;
	activityTags: unknown[];
	enforcementTags: unknown[];
	categoryTags: unknown[];
	media: unknown[];
	comments: unknown[];
	vehicleReports: unknown[];
	rawSummary: Record<string, unknown>;
	rawDetail: Record<string, unknown>;
}

interface IceReportsRecentInput {
	limit: number;
	lookbackHours: number;
	reportType?: string;
}

interface IceReportsBboxInput {
	minLon: number;
	minLat: number;
	maxLon: number;
	maxLat: number;
	limit: number;
	lookbackHours: number;
	reportType?: string;
}

interface IceReportDetailInput {
	sourceId: string;
	sourceCreatedAt?: string;
}

const CACHE_NAMESPACE = "iceout:trpc:v1";
const MAX_QUERY_LIMIT = 500;

function clampLimit(limit: number): number {
	return Math.min(Math.max(limit, 1), MAX_QUERY_LIMIT);
}

function toIsoString(value: Date | null): string {
	return value ? value.toISOString() : new Date(0).toISOString();
}

function toIsoStringOrNull(value: Date | null): string | null {
	return value ? value.toISOString() : null;
}

function toLookbackDate(lookbackHours: number): Date {
	const safeHours = Math.min(Math.max(lookbackHours, 1), 24 * 30);
	return new Date(Date.now() - safeHours * 60 * 60 * 1000);
}

function toCacheKey(scope: string, input: Record<string, unknown>): string {
	return `${CACHE_NAMESPACE}:${scope}:${JSON.stringify(input)}`;
}

function toArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function toRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return value as Record<string, unknown>;
}

function normalizeRows(
	rows: Array<{
		sourceId: string;
		sourceCreatedAt: Date | null;
		incidentTime: Date | null;
		ingestedAt: Date | null;
		approved: boolean | null;
		archived: boolean | null;
		reportType: string | null;
		locationDescription: string | null;
		lon: number | null;
		lat: number | null;
	}>,
): IceReportRecord[] {
	return rows.map((row) => ({
		sourceId: row.sourceId,
		sourceCreatedAt: toIsoString(row.sourceCreatedAt),
		incidentTime: toIsoStringOrNull(row.incidentTime),
		ingestedAt: toIsoString(row.ingestedAt),
		approved: row.approved,
		archived: row.archived,
		reportType: row.reportType,
		locationDescription: row.locationDescription,
		lon: row.lon,
		lat: row.lat,
	}));
}

export async function getRecentIceReports(
	input: IceReportsRecentInput,
): Promise<IceReportRecord[]> {
	const serverConfig = getServerConfig();
	const limit = clampLimit(input.limit);
	const sinceDate = toLookbackDate(input.lookbackHours);
	const cacheKey = toCacheKey("recent", {
		limit,
		lookbackHours: input.lookbackHours,
		reportType: input.reportType ?? null,
	});

	return withJsonCache(
		{
			key: cacheKey,
			ttlSeconds: serverConfig.trpcCacheTtlSeconds,
		},
		async () => {
			const whereConditions = [gte(iceReports.sourceCreatedAt, sinceDate)];

			if (input.reportType) {
				whereConditions.push(eq(iceReports.reportType, input.reportType));
			}

			const rows = await db
				.select({
					sourceId: iceReports.sourceId,
					sourceCreatedAt: iceReports.sourceCreatedAt,
					incidentTime: iceReports.incidentTime,
					ingestedAt: iceReports.ingestedAt,
					approved: iceReports.approved,
					archived: iceReports.archived,
					reportType: iceReports.reportType,
					locationDescription: iceReports.locationDescription,
					lon: iceReports.lon,
					lat: iceReports.lat,
				})
				.from(iceReports)
				.where(and(...whereConditions))
				.orderBy(desc(iceReports.sourceCreatedAt))
				.limit(limit);

			return normalizeRows(rows);
		},
	);
}

export async function getIceReportsInBbox(
	input: IceReportsBboxInput,
): Promise<IceReportRecord[]> {
	const serverConfig = getServerConfig();
	const limit = clampLimit(input.limit);
	const sinceDate = toLookbackDate(input.lookbackHours);
	const cacheKey = toCacheKey("bbox", {
		minLon: input.minLon,
		minLat: input.minLat,
		maxLon: input.maxLon,
		maxLat: input.maxLat,
		limit,
		lookbackHours: input.lookbackHours,
		reportType: input.reportType ?? null,
	});

	return withJsonCache(
		{
			key: cacheKey,
			ttlSeconds: serverConfig.trpcCacheTtlSeconds,
		},
		async () => {
			const whereConditions = [
				gte(iceReports.sourceCreatedAt, sinceDate),
				gte(iceReports.lon, input.minLon),
				lte(iceReports.lon, input.maxLon),
				gte(iceReports.lat, input.minLat),
				lte(iceReports.lat, input.maxLat),
			];

			if (input.reportType) {
				whereConditions.push(eq(iceReports.reportType, input.reportType));
			}

			const rows = await db
				.select({
					sourceId: iceReports.sourceId,
					sourceCreatedAt: iceReports.sourceCreatedAt,
					incidentTime: iceReports.incidentTime,
					ingestedAt: iceReports.ingestedAt,
					approved: iceReports.approved,
					archived: iceReports.archived,
					reportType: iceReports.reportType,
					locationDescription: iceReports.locationDescription,
					lon: iceReports.lon,
					lat: iceReports.lat,
				})
				.from(iceReports)
				.where(and(...whereConditions))
				.orderBy(desc(iceReports.sourceCreatedAt))
				.limit(limit);

			return normalizeRows(rows);
		},
	);
}

export async function getIceReportDetail(
	input: IceReportDetailInput,
): Promise<IceReportDetailRecord | null> {
	const serverConfig = getServerConfig();
	const sourceCreatedAt = input.sourceCreatedAt
		? new Date(input.sourceCreatedAt)
		: null;
	const cacheKey = toCacheKey("detail", {
		sourceId: input.sourceId,
		sourceCreatedAt: input.sourceCreatedAt ?? null,
	});

	return withJsonCache(
		{
			key: cacheKey,
			ttlSeconds: serverConfig.trpcCacheTtlSeconds,
		},
		async () => {
			const whereConditions = [eq(iceReports.sourceId, input.sourceId)];

			if (sourceCreatedAt && Number.isFinite(sourceCreatedAt.getTime())) {
				whereConditions.push(eq(iceReports.sourceCreatedAt, sourceCreatedAt));
			}

			const rows = await db
				.select({
					sourceId: iceReports.sourceId,
					sourceCreatedAt: iceReports.sourceCreatedAt,
					incidentTime: iceReports.incidentTime,
					approved: iceReports.approved,
					archived: iceReports.archived,
					reportType: iceReports.reportType,
					locationDescription: iceReports.locationDescription,
					lon: iceReports.lon,
					lat: iceReports.lat,
					activityDescription: iceReportDetails.activityDescription,
					clothingDescription: iceReportDetails.clothingDescription,
					sourceLink: iceReportDetails.sourceLink,
					submittedBy: iceReportDetails.submittedBy,
					numOfficials: iceReportDetails.numOfficials,
					numVehicles: iceReportDetails.numVehicles,
					mediaCount: iceReportDetails.mediaCount,
					commentCount: iceReportDetails.commentCount,
					smallThumbnail: iceReportDetails.smallThumbnail,
					activityTags: iceReportDetails.activityTags,
					enforcementTags: iceReportDetails.enforcementTags,
					categoryTags: iceReportDetails.categoryTags,
					media: iceReportDetails.media,
					comments: iceReportDetails.comments,
					vehicleReports: iceReportDetails.vehicleReports,
					rawSummary: iceReportDetails.rawSummary,
					rawDetail: iceReportDetails.rawDetail,
				})
				.from(iceReports)
				.innerJoin(
					iceReportDetails,
					and(
						eq(iceReports.sourceId, iceReportDetails.sourceId),
						eq(iceReports.sourceCreatedAt, iceReportDetails.sourceCreatedAt),
					),
				)
				.where(and(...whereConditions))
				.orderBy(desc(iceReports.sourceCreatedAt))
				.limit(1);

			if (!rows.length) return null;

			const row = rows[0];
			return {
				sourceId: row.sourceId,
				sourceCreatedAt: toIsoString(row.sourceCreatedAt),
				incidentTime: toIsoStringOrNull(row.incidentTime),
				approved: row.approved,
				archived: row.archived,
				reportType: row.reportType,
				locationDescription: row.locationDescription,
				lon: row.lon,
				lat: row.lat,
				activityDescription: row.activityDescription,
				clothingDescription: row.clothingDescription,
				sourceLink: row.sourceLink,
				submittedBy: row.submittedBy,
				numOfficials: row.numOfficials,
				numVehicles: row.numVehicles,
				mediaCount: row.mediaCount,
				commentCount: row.commentCount,
				smallThumbnail: row.smallThumbnail,
				// TODO: Add canonical enum-to-label dictionaries and return resolved labels here
				// while still preserving raw enum IDs for filtering/analytics.
				activityTags: toArray(row.activityTags),
				enforcementTags: toArray(row.enforcementTags),
				categoryTags: toArray(row.categoryTags),
				media: toArray(row.media),
				comments: toArray(row.comments),
				vehicleReports: toArray(row.vehicleReports),
				rawSummary: toRecord(row.rawSummary),
				rawDetail: toRecord(row.rawDetail),
			};
		},
	);
}
