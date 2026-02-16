import {
	bigint,
	bigserial,
	boolean,
	doublePrecision,
	foreignKey,
	index,
	integer,
	jsonb,
	pgSchema,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export interface IceReportArrayPayload extends Array<unknown> {}

export const wikiAgents = pgTable(
	"wiki_agents",
	{
		id: integer("id").primaryKey().notNull(),
		wikiName: text("wiki_name").unique().notNull(),
		fullName: text("full_name"),
		agency: text("agency"),
		role: text("role"),
		fieldOffice: text("field_office"),
		state: text("state"),
		status: text("status"),
		verificationStatus: text("verification_status"),
		externalLinks: jsonb("external_links").default("[]"),
		notes: text("notes"),
		rawInfobox: jsonb("raw_infobox"),
		lastScrapedAt: timestamp("last_scraped_at", {
			withTimezone: true,
		}).defaultNow(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("idx_wiki_agents_agency").on(table.agency),
		index("idx_wiki_agents_state").on(table.state),
		index("idx_wiki_agents_verification").on(table.verificationStatus),
	],
);

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

export const iceReportMedia = pgTable(
	"ice_report_media",
	{
		mediaId: bigint("media_id", { mode: "number" }).notNull(),
		sourceId: text("source_id").notNull(),
		sourceCreatedAt: timestamp("source_created_at", {
			withTimezone: true,
		}).notNull(),
		mediaType: text("media_type"),
		imageUrl: text("image_url"),
		videoUrl: text("video_url"),
		sizeBytes: integer("size_bytes"),
		smallThumbnail: text("small_thumbnail"),
		mediumThumbnail: text("medium_thumbnail"),
		idx: integer("idx").notNull().default(0),
		mediaCreatedAt: timestamp("media_created_at", { withTimezone: true }),
	},
	(table) => [
		primaryKey({
			name: "ice_report_media_pk",
			columns: [table.mediaId],
		}),
		foreignKey({
			name: "ice_report_media_detail_fk",
			columns: [table.sourceId, table.sourceCreatedAt],
			foreignColumns: [
				iceReportDetails.sourceId,
				iceReportDetails.sourceCreatedAt,
			],
		}).onDelete("cascade"),
		index("ice_report_media_report_idx").on(
			table.sourceId,
			table.sourceCreatedAt,
		),
		index("ice_report_media_type_idx").on(table.mediaType),
	],
);

export const iceReportVehicles = pgTable(
	"ice_report_vehicles",
	{
		vehicleId: bigint("vehicle_id", { mode: "number" }).notNull(),
		sourceId: text("source_id").notNull(),
		sourceCreatedAt: timestamp("source_created_at", {
			withTimezone: true,
		}).notNull(),
		plateNumber: text("plate_number"),
	},
	(table) => [
		primaryKey({
			name: "ice_report_vehicles_pk",
			columns: [table.vehicleId],
		}),
		foreignKey({
			name: "ice_report_vehicles_detail_fk",
			columns: [table.sourceId, table.sourceCreatedAt],
			foreignColumns: [
				iceReportDetails.sourceId,
				iceReportDetails.sourceCreatedAt,
			],
		}).onDelete("cascade"),
		index("ice_report_vehicles_report_idx").on(
			table.sourceId,
			table.sourceCreatedAt,
		),
		index("ice_report_vehicles_plate_idx").on(table.plateNumber),
	],
);

export const iceReportComments = pgTable(
	"ice_report_comments",
	{
		commentId: bigserial("comment_id", { mode: "number" }).primaryKey(),
		sourceId: text("source_id").notNull(),
		sourceCreatedAt: timestamp("source_created_at", {
			withTimezone: true,
		}).notNull(),
		body: text("body"),
		commentCreatedAt: timestamp("comment_created_at", { withTimezone: true }),
	},
	(table) => [
		foreignKey({
			name: "ice_report_comments_detail_fk",
			columns: [table.sourceId, table.sourceCreatedAt],
			foreignColumns: [
				iceReportDetails.sourceId,
				iceReportDetails.sourceCreatedAt,
			],
		}).onDelete("cascade"),
		index("ice_report_comments_report_idx").on(
			table.sourceId,
			table.sourceCreatedAt,
		),
	],
);
