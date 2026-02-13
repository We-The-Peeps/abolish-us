import {
	boolean,
	doublePrecision,
	foreignKey,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export interface IceReportRawPayload {
	[key: string]: unknown;
}

export interface IceReportArrayPayload extends Array<unknown> {}

export const iceReports = pgTable(
	"ice_reports",
	{
		sourceId: text("source_id").notNull(),
		sourceCreatedAt: timestamp("source_created_at", {
			withTimezone: true,
		}).notNull(),
		incidentTime: timestamp("incident_time", { withTimezone: true }),
		ingestedAt: timestamp("ingested_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		approved: boolean("approved"),
		archived: boolean("archived"),
		reportType: text("report_type"),
		locationDescription: text("location_description"),
		sourceUrl: text("source_url"),
		lon: doublePrecision("lon"),
		lat: doublePrecision("lat"),
	},
	(table) => [
		primaryKey({
			name: "ice_reports_pk",
			columns: [table.sourceId, table.sourceCreatedAt],
		}),
		index("ice_reports_source_created_at_idx").on(table.sourceCreatedAt),
		index("ice_reports_incident_time_idx").on(table.incidentTime),
		index("ice_reports_report_type_created_idx").on(
			table.reportType,
			table.sourceCreatedAt,
		),
		index("ice_reports_archived_approved_created_idx").on(
			table.archived,
			table.approved,
			table.sourceCreatedAt,
		),
	],
);

export const iceReportDetails = pgTable(
	"ice_report_details",
	{
		sourceId: text("source_id").notNull(),
		sourceCreatedAt: timestamp("source_created_at", {
			withTimezone: true,
		}).notNull(),
		ingestedAt: timestamp("ingested_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		activityDescription: text("activity_description"),
		clothingDescription: text("clothing_description"),
		sourceLink: text("source_link"),
		submittedBy: text("submitted_by"),
		numOfficials: integer("num_officials"),
		numVehicles: integer("num_vehicles"),
		mediaCount: integer("media_count"),
		commentCount: integer("comment_count"),
		smallThumbnail: text("small_thumbnail"),
		activityTags: jsonb("activity_tags")
			.$type<IceReportArrayPayload>()
			.notNull(),
		enforcementTags: jsonb("enforcement_tags")
			.$type<IceReportArrayPayload>()
			.notNull(),
		categoryTags: jsonb("category_tags")
			.$type<IceReportArrayPayload>()
			.notNull(),
		media: jsonb("media").$type<IceReportArrayPayload>().notNull(),
		comments: jsonb("comments").$type<IceReportArrayPayload>().notNull(),
		vehicleReports: jsonb("vehicle_reports")
			.$type<IceReportArrayPayload>()
			.notNull(),
		rawSummary: jsonb("raw_summary").$type<IceReportRawPayload>().notNull(),
		rawDetail: jsonb("raw_detail").$type<IceReportRawPayload>().notNull(),
	},
	(table) => [
		primaryKey({
			name: "ice_report_details_pk",
			columns: [table.sourceId, table.sourceCreatedAt],
		}),
		foreignKey({
			name: "ice_report_details_report_fk",
			columns: [table.sourceId, table.sourceCreatedAt],
			foreignColumns: [iceReports.sourceId, iceReports.sourceCreatedAt],
		}).onDelete("cascade"),
		index("ice_report_details_created_idx").on(table.sourceCreatedAt),
		index("ice_report_details_media_count_idx").on(
			table.mediaCount,
			table.commentCount,
		),
	],
);
