import { toNumberOrNull } from "./iceReportsMapUtils";

export interface IceReportSelection {
	sourceId: string;
	sourceCreatedAt?: string;
}

export interface IceReportCard extends IceReportSelection {
	reportType: string | null;
	locationDescription: string | null;
	incidentTime: string | null;
	approved: boolean | null;
	archived: boolean | null;
	lon: number | null;
	lat: number | null;
	mediaCount: number | null;
	commentCount: number | null;
	smallThumbnail: string | null;
	numOfficials: number | null;
	numVehicles: number | null;
}

export function toSelectionKey(selection: IceReportSelection): string {
	return `${selection.sourceId}|${selection.sourceCreatedAt ?? ""}`;
}

function toStringOrNull(value: unknown): string | null {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : null;
	}
	return null;
}

function toBooleanOrNull(value: unknown): boolean | null {
	if (typeof value === "boolean") return value;
	return null;
}

function toIntegerOrNull(value: unknown): number | null {
	const num = toNumberOrNull(value);
	if (num === null) return null;
	const rounded = Math.trunc(num);
	if (!Number.isFinite(rounded)) return null;
	return Math.max(0, rounded);
}

export function toIceReportCards(value: unknown): IceReportCard[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((report) => {
			if (!report || typeof report !== "object") return null;
			const record = report as Record<string, unknown>;

			const sourceId = String(record.sourceId ?? "").trim();
			if (!sourceId.length) return null;

			const sourceCreatedAt =
				toStringOrNull(record.sourceCreatedAt) ?? undefined;

			return {
				sourceId,
				...(sourceCreatedAt ? { sourceCreatedAt } : {}),
				reportType: toStringOrNull(record.reportType),
				locationDescription: toStringOrNull(record.locationDescription),
				incidentTime: toStringOrNull(record.incidentTime),
				approved: toBooleanOrNull(record.approved),
				archived: toBooleanOrNull(record.archived),
				lon: toNumberOrNull(record.lon),
				lat: toNumberOrNull(record.lat),
				mediaCount: toIntegerOrNull(record.mediaCount),
				commentCount: toIntegerOrNull(record.commentCount),
				smallThumbnail: toStringOrNull(record.smallThumbnail),
				numOfficials: toIntegerOrNull(record.numOfficials),
				numVehicles: toIntegerOrNull(record.numVehicles),
			} satisfies IceReportCard;
		})
		.filter((item): item is IceReportCard => item !== null);
}

export function toReportTitle(card: IceReportCard): string {
	return (
		card.locationDescription?.trim() || card.reportType?.trim() || "ICE report"
	);
}

export function toReportSubtitle(card: IceReportCard): string | null {
	const parts: string[] = [];
	if (card.reportType?.trim()) parts.push(card.reportType.trim());
	const when = toShortDateTime(
		card.incidentTime ?? card.sourceCreatedAt ?? null,
	);
	if (when) parts.push(when);
	return parts.length ? parts.join(" • ") : null;
}

export function toShortDateTime(value: string | null): string | null {
	if (!value) return null;
	const ms = Date.parse(value);
	if (!Number.isFinite(ms)) return null;
	try {
		return new Date(ms).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return null;
	}
}
