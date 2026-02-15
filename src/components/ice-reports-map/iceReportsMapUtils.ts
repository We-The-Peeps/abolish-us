import type { MapGeoJSONFeature } from "maplibre-gl";

const BBOX_PRECISION = 4;

export interface IceReportBboxInput {
	minLon: number;
	minLat: number;
	maxLon: number;
	maxLat: number;
}

export function roundCoordinate(value: number): number {
	return Number(value.toFixed(BBOX_PRECISION));
}

export function hasBboxChanged(
	prev: IceReportBboxInput,
	next: IceReportBboxInput,
): boolean {
	return (
		prev.minLon !== next.minLon ||
		prev.minLat !== next.minLat ||
		prev.maxLon !== next.maxLon ||
		prev.maxLat !== next.maxLat
	);
}

export function toNumberOrNull(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim().length) {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

export function getCssVar(name: string, fallback: string): string {
	if (typeof window === "undefined") return fallback;
	const value = getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
	return value.length ? value : fallback;
}

// MapLibre's color parser is stricter than the browser's; resolve CSS vars /
// modern color syntaxes (like oklch) to an rgb() string.
export function resolveCssColor(value: string, fallback: string): string {
	if (typeof window === "undefined") return fallback;

	// Use computed style normalization so modern syntaxes (oklch, lab, etc) become rgb().
	// Note: some browsers now preserve modern syntaxes in computed styles; MapLibre does not
	// accept those, so we must fall back to a MapLibre-safe string.
	const el = document.createElement("span");
	el.style.color = fallback;
	el.style.color = value;
	document.body.appendChild(el);
	try {
		const resolved = getComputedStyle(el).color;
		const maybe = typeof resolved === "string" ? resolved.trim() : "";

		// MapLibre accepts hex + rgb/rgba. Reject modern syntaxes (oklch/lab/lch/color()).
		if (
			maybe &&
			(/^(rgb|rgba)\(/i.test(maybe) || maybe.startsWith("#")) &&
			!/oklch\(|lab\(|lch\(|color\(/i.test(maybe)
		) {
			return maybe;
		}

		// Fallback: canvas tends to normalize to rgb()/hex in more cases.
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return fallback;
		ctx.fillStyle = fallback;
		ctx.fillStyle = value;
		const normalized = String(ctx.fillStyle ?? "").trim();
		if (
			normalized &&
			(/^(rgb|rgba)\(/i.test(normalized) || normalized.startsWith("#")) &&
			!/oklch\(|lab\(|lch\(|color\(/i.test(normalized)
		) {
			return normalized;
		}

		return fallback;
	} finally {
		el.remove();
	}
}

export function featureProps(
	feature: MapGeoJSONFeature,
): Record<string, unknown> {
	return (feature.properties ?? {}) as Record<string, unknown>;
}
