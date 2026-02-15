// Enum/label dictionaries extracted from iceout.org public frontend bundle.
// Source: `https://iceout.org/en/main-BFWUY26T.js` (fe.version "v0.2.105"), captured 2026-02-15.
//
// Why this exists:
// - The API payloads store tag enums (numbers), while the human-readable labels are hardcoded
//   in the frontend bundle (not returned by the API).

export interface IceoutReportCategory {
	id: number;
	key: string;
	label: string;
	color: string;
}

export interface IceoutResolvedActivityTag {
	id: number;
	key: string;
	label: string;
	category: IceoutReportCategory | null;
}

const ICEOUT_REPORT_CATEGORIES_BY_ID = new Map<number, IceoutReportCategory>([
	[0, { id: 0, key: "OTHER", label: "Other", color: "blue" }],
	[1, { id: 1, key: "OBSERVED", label: "Observed", color: "green" }],
	[2, { id: 2, key: "ACTIVE", label: "Active", color: "yellow" }],
	[3, { id: 3, key: "CRITICAL", label: "Critical", color: "red" }],
	// Present in the upstream enum (`Li.MURDER=4`) but not part of the public report-type UI
	// map; treat it as critical-ish for display.
	[4, { id: 4, key: "MURDER", label: "Murder", color: "red" }],
]);

// Upstream enum `On` (activity_tag_enums):
// UNSURE=0, LOITERING=1, ERRANDS=2, WARNING=3, AIRBORNE_VEHICLES=4, ABANDONED_VEHICLE=5,
// STAGING=6, PATROLLING=7, KNOCKING=8, QUESTIONING=9, CHECKPOINT=10, ARREST=11, PURSUIT=12,
// RAID=13, VIOLENCE=14, FPS=15, BOP=16, POLICE=17, PROTEST=18, TRAINING=19.
export const ICEOUT_ACTIVITY_TAGS_BY_ID = new Map<
	number,
	IceoutResolvedActivityTag
>([
	[
		1,
		{
			id: 1,
			key: "LOITERING",
			label: "Loitering/Parked",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(1) ?? null,
		},
	],
	[
		2,
		{
			id: 2,
			key: "ERRANDS",
			label: "Errands/Traveling/Eating",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(1) ?? null,
		},
	],
	[
		3,
		{
			id: 3,
			key: "WARNING",
			label: "Warning/BOLO",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(1) ?? null,
		},
	],
	[
		4,
		{
			id: 4,
			key: "AIRBORNE_VEHICLES",
			label: "Drones/Helicopter Activity",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(1) ?? null,
		},
	],
	[
		5,
		{
			id: 5,
			key: "ABANDONED_VEHICLE",
			label: "Victim's Abandoned Vehicle",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(1) ?? null,
		},
	],
	[
		6,
		{
			id: 6,
			key: "STAGING",
			label: "Staging/Raid Planning",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(1) ?? null,
		},
	],
	[
		7,
		{
			id: 7,
			key: "PATROLLING",
			label: "Patrolling/Scouting/Surveillance",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(2) ?? null,
		},
	],
	[
		8,
		{
			id: 8,
			key: "KNOCKING",
			label: "Knocking on Doors",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(2) ?? null,
		},
	],
	[
		9,
		{
			id: 9,
			key: "QUESTIONING",
			label: "Questioning People/Requesting Papers",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(2) ?? null,
		},
	],
	[
		10,
		{
			id: 10,
			key: "CHECKPOINT",
			label: "Checkpoint/Vehicle Stops",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(2) ?? null,
		},
	],
	[
		11,
		{
			id: 11,
			key: "ARREST",
			label: "Arrest",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(3) ?? null,
		},
	],
	[
		12,
		{
			id: 12,
			key: "PURSUIT",
			label: "Pursuit",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(3) ?? null,
		},
	],
	[
		13,
		{
			id: 13,
			key: "RAID",
			label: "Raid",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(3) ?? null,
		},
	],
	[
		14,
		{
			id: 14,
			key: "VIOLENCE",
			label: "Violence/Physical Force",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(3) ?? null,
		},
	],
	[
		15,
		{
			id: 15,
			key: "FPS",
			label: "FPS (Federal Protective Services)",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(0) ?? null,
		},
	],
	[
		16,
		{
			id: 16,
			key: "BOP",
			label: "BOP (Bureau of Prisons)",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(0) ?? null,
		},
	],
	[
		17,
		{
			id: 17,
			key: "POLICE",
			label: "Confirmed Police",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(0) ?? null,
		},
	],
	[
		18,
		{
			id: 18,
			key: "PROTEST",
			label: "Protest",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(0) ?? null,
		},
	],
	[
		19,
		{
			id: 19,
			key: "TRAINING",
			label: "Training/Conference",
			category: ICEOUT_REPORT_CATEGORIES_BY_ID.get(0) ?? null,
		},
	],
	[
		0,
		{
			id: 0,
			key: "UNSURE",
			label: "Not Sure/Unclear",
			category: null,
		},
	],
]);

// Upstream enum `jd` (enforcement_tag_enums):
// IMMIGRATION_ENFORCEMENT=0, LOCAL_LAW_ENFORCEMENT=1, FEDERAL_LAW_ENFORCEMENT=2, MILITARY=3, NON_ENFORCEMENT=4.
const ICEOUT_ENFORCEMENT_TAGS_BY_ID = new Map<number, string>([
	[0, "Immigration Enforcement (ICE, DHS, HSI, ERO, CBP)"],
	[1, "Local or State Law Enforcement"],
	[2, "Federal Law Enforcement"],
	[3, "Military"],
	[4, "Federal Non-enforcement Agency (FPS, BOP)"],
]);

function toEnumId(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed.length) return null;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : null;
}

export function resolveIceoutActivityTag(
	value: unknown,
): IceoutResolvedActivityTag | null {
	const id = toEnumId(value);
	if (id === null) return null;
	return ICEOUT_ACTIVITY_TAGS_BY_ID.get(id) ?? null;
}

export function resolveIceoutEnforcementTag(value: unknown): string | null {
	const id = toEnumId(value);
	if (id === null) return null;
	return ICEOUT_ENFORCEMENT_TAGS_BY_ID.get(id) ?? null;
}

export function resolveIceoutActivityTagLabels(values: unknown[]): string[] {
	const labels: string[] = [];
	for (const value of values) {
		const resolved = resolveIceoutActivityTag(value);
		if (!resolved) continue;
		labels.push(resolved.label);
	}
	return labels;
}

export function resolveIceoutEnforcementTagLabels(values: unknown[]): string[] {
	const labels: string[] = [];
	for (const value of values) {
		const resolved = resolveIceoutEnforcementTag(value);
		if (!resolved) continue;
		labels.push(resolved);
	}
	return labels;
}

export function extractIceoutPlateNumbers(vehicleReports: unknown[]): string[] {
	const plates = new Set<string>();
	for (const entry of vehicleReports) {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
		const record = entry as Record<string, unknown>;
		const plate = record.plate_number ?? record.plateNumber ?? null;
		if (typeof plate !== "string") continue;
		const trimmed = plate.trim();
		if (!trimmed.length) continue;
		plates.add(trimmed);
	}
	return Array.from(plates);
}
