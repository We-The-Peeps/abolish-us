import { and, desc, eq, gte, lte } from "drizzle-orm";
import { withJsonCache } from "@/server/cache/dragonfly";
import { getServerConfig } from "@/server/config";
import { db } from "@/server/db/client";
import {
	iceReportComments,
	iceReportDetails,
	iceReportMedia,
	iceReports,
	iceReportVehicles,
} from "@/server/db/schema";
import {
	extractIceoutPlateNumbers,
	resolveIceoutActivityTagLabels,
	resolveIceoutEnforcementTagLabels,
} from "@/server/domain/iceout/iceout-enums";

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

interface IceReportCardRecord extends IceReportRecord {
	mediaCount: number | null;
	commentCount: number | null;
	smallThumbnail: string | null;
	numOfficials: number | null;
	numVehicles: number | null;
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
	media: Array<{
		mediaId: number;
		mediaType: string | null;
		imageUrl: string | null;
		videoUrl: string | null;
		sizeBytes: number | null;
		smallThumbnail: string | null;
		mediumThumbnail: string | null;
		idx: number;
		mediaCreatedAt: string | null;
	}>;
	comments: Array<{
		commentId: number;
		body: string | null;
		commentCreatedAt: string | null;
	}>;
	vehicleReports: Array<{
		vehicleId: number;
		plateNumber: string | null;
	}>;
	licensePlates: string[];
	activityTagLabels: string[];
	enforcementTagLabels: string[];
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

function normalizeCardRows(
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
		mediaCount: number | null;
		commentCount: number | null;
		smallThumbnail: string | null;
		numOfficials: number | null;
		numVehicles: number | null;
	}>,
): IceReportCardRecord[] {
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
		mediaCount: row.mediaCount,
		commentCount: row.commentCount,
		smallThumbnail: row.smallThumbnail,
		numOfficials: row.numOfficials,
		numVehicles: row.numVehicles,
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
): Promise<IceReportCardRecord[]> {
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
					mediaCount: iceReportDetails.mediaCount,
					commentCount: iceReportDetails.commentCount,
					smallThumbnail: iceReportDetails.smallThumbnail,
					numOfficials: iceReportDetails.numOfficials,
					numVehicles: iceReportDetails.numVehicles,
				})
				.from(iceReports)
				.leftJoin(
					iceReportDetails,
					and(
						eq(iceReports.sourceId, iceReportDetails.sourceId),
						eq(iceReports.sourceCreatedAt, iceReportDetails.sourceCreatedAt),
					),
				)
				.where(and(...whereConditions))
				.orderBy(desc(iceReports.sourceCreatedAt))
				.limit(limit);

			return normalizeCardRows(rows);
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
			const activityTags = Array.isArray(row.activityTags)
				? row.activityTags
				: [];
			const enforcementTags = Array.isArray(row.enforcementTags)
				? row.enforcementTags
				: [];

			// Fetch normalized child relationships (stored in separate tables now).
			const [mediaRows, vehicleRows, commentRows] = await Promise.all([
				db
					.select({
						mediaId: iceReportMedia.mediaId,
						mediaType: iceReportMedia.mediaType,
						imageUrl: iceReportMedia.imageUrl,
						videoUrl: iceReportMedia.videoUrl,
						sizeBytes: iceReportMedia.sizeBytes,
						smallThumbnail: iceReportMedia.smallThumbnail,
						mediumThumbnail: iceReportMedia.mediumThumbnail,
						idx: iceReportMedia.idx,
						mediaCreatedAt: iceReportMedia.mediaCreatedAt,
					})
					.from(iceReportMedia)
					.where(
						and(
							eq(iceReportMedia.sourceId, row.sourceId),
							eq(iceReportMedia.sourceCreatedAt, row.sourceCreatedAt),
						),
					)
					.orderBy(iceReportMedia.idx),
				db
					.select({
						vehicleId: iceReportVehicles.vehicleId,
						plateNumber: iceReportVehicles.plateNumber,
					})
					.from(iceReportVehicles)
					.where(
						and(
							eq(iceReportVehicles.sourceId, row.sourceId),
							eq(iceReportVehicles.sourceCreatedAt, row.sourceCreatedAt),
						),
					),
				db
					.select({
						commentId: iceReportComments.commentId,
						body: iceReportComments.body,
						commentCreatedAt: iceReportComments.commentCreatedAt,
					})
					.from(iceReportComments)
					.where(
						and(
							eq(iceReportComments.sourceId, row.sourceId),
							eq(iceReportComments.sourceCreatedAt, row.sourceCreatedAt),
						),
					)
					.orderBy(desc(iceReportComments.commentCreatedAt)),
			]);

			const vehicleReports = vehicleRows.map((vehicle) => ({
				vehicleId: vehicle.vehicleId ?? 0,
				plateNumber: vehicle.plateNumber ?? null,
			}));
			const licensePlates = extractIceoutPlateNumbers(
				vehicleReports as unknown[],
			);
			const activityTagLabels = resolveIceoutActivityTagLabels(activityTags);
			const enforcementTagLabels =
				resolveIceoutEnforcementTagLabels(enforcementTags);

			// Older ingests could have `numVehicles=0` because the scraper previously coerced
			// null-ish values via `Number(null) => 0`. Prefer a derived count if present.
			const numVehiclesDerived =
				typeof row.numVehicles === "number" && row.numVehicles > 0
					? row.numVehicles
					: licensePlates.length > 0
						? licensePlates.length
						: vehicleReports.length > 0
							? vehicleReports.length
							: row.numVehicles;

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
				numVehicles: numVehiclesDerived ?? null,
				mediaCount: row.mediaCount,
				commentCount: row.commentCount,
				smallThumbnail: row.smallThumbnail,
				// TODO: Add canonical enum-to-label dictionaries and return resolved labels here
				// while still preserving raw enum IDs for filtering/analytics.
				activityTags,
				enforcementTags,
				categoryTags: Array.isArray(row.categoryTags) ? row.categoryTags : [],
				media: mediaRows.map((media) => ({
					mediaId: media.mediaId ?? 0,
					mediaType: media.mediaType ?? null,
					imageUrl: media.imageUrl ?? null,
					videoUrl: media.videoUrl ?? null,
					sizeBytes: media.sizeBytes ?? null,
					smallThumbnail: media.smallThumbnail ?? null,
					mediumThumbnail: media.mediumThumbnail ?? null,
					idx: media.idx ?? 0,
					mediaCreatedAt: media.mediaCreatedAt
						? media.mediaCreatedAt.toISOString()
						: null,
				})),
				comments: commentRows.map((comment) => ({
					commentId: comment.commentId ?? 0,
					body: comment.body ?? null,
					commentCreatedAt: comment.commentCreatedAt
						? comment.commentCreatedAt.toISOString()
						: null,
				})),
				vehicleReports,
				licensePlates,
				activityTagLabels,
				enforcementTagLabels,
			};
		},
	);
}
