import { useDebounceFn } from "ahooks";
import type { FeatureCollection, Geometry, Point } from "geojson";
import type {
	GeoJSONSource,
	MapGeoJSONFeature,
	Map as MapLibreMap,
} from "maplibre-gl";
import { memo, useCallback, useId, useMemo, useRef, useState } from "react";
import MapLibre, {
	type MapLayerMouseEvent,
	type MapRef,
	NavigationControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { IceReportCard, IceReportSelection } from "./iceReportsCards";
import {
	AGENTS_SOURCE_ID,
	agentStateLabelLayer,
	agentStateLayer,
	CLUSTER_MAX_ZOOM,
	CLUSTER_RADIUS_PX,
	clusterCountLayer,
	clusterLayer,
	MAP_SOURCE_ID,
	unclusteredPointLayer,
} from "./iceReportsMapLayers";
import {
	featureProps,
	roundCoordinate,
	toNumberOrNull,
} from "./iceReportsMapUtils";
import { IceReportsMapLayer, IceReportsMapSource } from "./maplibreTsdWrappers";

interface IceReportsMapCanvasViewport {
	longitude: number;
	latitude: number;
	zoom: number;
}

interface HoverInfo {
	x: number;
	y: number;
	kind: "cluster" | "point";
	title: string;
	subtitle?: string;
}

export interface IceReportsMapCanvasProps {
	geojson: FeatureCollection<Geometry, Record<string, unknown>>;
	mode?: "reports" | "agents";
	initialViewState: IceReportsMapCanvasViewport;
	maxBounds: [[number, number], [number, number]];
	heightPx?: number;
	onBboxChange: (bbox: {
		minLon: number;
		minLat: number;
		maxLon: number;
		maxLat: number;
		// biome-ignore lint/suspicious/noExplicitAny: suppressed
	}) => any;
	onSelectReport: (selection: IceReportSelection) => void;
	onSelectCluster?: (cluster: {
		kind: "cluster";
		clusterId: number;
		clusterCount: number;
		items: IceReportCard[];
		isLoading: boolean;
	}) => void;
	highlightedSourceId?: string | null;
}

async function getClusterLeaves(
	source: GeoJSONSource,
	clusterId: number,
	limit: number,
): Promise<MapGeoJSONFeature[]> {
	const features = await source.getClusterLeaves(clusterId, limit, 0);
	return (features ?? []) as MapGeoJSONFeature[];
}

function applyTheme(map: MapLibreMap, colors: { water: string; land: string }) {
	const { water, land } = colors;
	const style = map.getStyle();
	for (const layer of style.layers ?? []) {
		const id = layer.id.toLowerCase();

		// Most open styles treat "background" as the land mass.
		if (layer.type === "background") {
			map.setPaintProperty(layer.id, "background-color", land);
			continue;
		}

		// Water polygons/lines.
		if (layer.type === "fill" && /water/.test(id)) {
			map.setPaintProperty(layer.id, "fill-color", water);
			continue;
		}
		if (layer.type === "line" && /waterway|river|stream|canal/.test(id)) {
			map.setPaintProperty(layer.id, "line-color", water);
			continue;
		}

		// Everything else "fill" becomes land silhouette (dark).
		if (layer.type === "fill") {
			map.setPaintProperty(layer.id, "fill-color", land);
			continue;
		}

		// Keep boundaries subtle but still visible.
		if (layer.type === "line" && /boundary/.test(id)) {
			map.setPaintProperty(layer.id, "line-color", land);
			map.setPaintProperty(layer.id, "line-opacity", 0.25);
		}
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function IceReportsMapCanvas({
	geojson,
	initialViewState,
	maxBounds,
	heightPx = 520,
	mode = "reports",
	onBboxChange,
	onSelectReport,
	onSelectCluster,
	highlightedSourceId = null,
}: IceReportsMapCanvasProps) {
	const mapRef = useRef<MapRef | null>(null);
	const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
	const highlightLayerId = useId();
	const isApplyingThemeRef = useRef(false);
	const lastAppliedThemeKeyRef = useRef<string | null>(null);

	const isReports = mode === "reports";
	const isAgents = mode === "agents";

	// Layers are imported from the official example; keep them stable.

	const updateBboxFromMap = useCallback(() => {
		const bounds = mapRef.current?.getBounds();
		if (!bounds) return;

		const nextBbox = {
			minLon: roundCoordinate(bounds.getWest()),
			minLat: roundCoordinate(bounds.getSouth()),
			maxLon: roundCoordinate(bounds.getEast()),
			maxLat: roundCoordinate(bounds.getNorth()),
		};

		onBboxChange(nextBbox);
	}, [onBboxChange]);

	const { run: debouncedUpdateBbox } = useDebounceFn(updateBboxFromMap, {
		wait: 300,
	});

	const handleDragEnd = useCallback(() => {
		// Only update the bbox after a pan/drag. Updating on zoom causes a refetch and
		// full recluster redraw, which is noisy and unnecessary.
		debouncedUpdateBbox();
	}, [debouncedUpdateBbox]);

	const handleMouseMove = useCallback(
		async (event: MapLayerMouseEvent) => {
			const map = mapRef.current?.getMap();
			if (!map) return;

			const feature = (event.features?.[0] ?? null) as MapGeoJSONFeature | null;
			if (!feature) {
				map.getCanvas().style.cursor = "";
				setHoverInfo(null);
				return;
			}

			map.getCanvas().style.cursor = "pointer";

			const props = featureProps(feature);

			if (isAgents) {
				const stateName = props.name as string;
				const totalCount = props.agentCount as number;
				const verifiedCount = props.verifiedCount as number;
				const unverifiedCount = totalCount - verifiedCount;

				setHoverInfo({
					x: event.point.x,
					y: event.point.y,
					kind: "point",
					title: stateName,
					subtitle: `${totalCount} agents (${verifiedCount} verified, ${unverifiedCount} unverified)`,
				});
				return;
			}

			const isCluster =
				typeof props.point_count === "number" ||
				typeof props.point_count === "string";

			if (isCluster) {
				const clusterCount = Number(props.point_count);

				setHoverInfo({
					x: event.point.x,
					y: event.point.y,
					kind: "cluster",
					title: `${clusterCount} reports`,
					subtitle: "Click for list",
				});
				return;
			}

			const title =
				(props.locationDescription as string | undefined) ??
				(props.reportType as string | undefined) ??
				"ICE report";

			setHoverInfo({
				x: event.point.x,
				y: event.point.y,
				kind: "point",
				title,
				subtitle: "Click for details",
			});
		},
		[isAgents],
	);

	const handleMouseLeave = useCallback(() => {
		const map = mapRef.current?.getMap();
		if (map) map.getCanvas().style.cursor = "";
		setHoverInfo(null);
	}, []);

	const toClusterCards = useCallback((features: MapGeoJSONFeature[]) => {
		function toStringOrNull(value: unknown): string | null {
			if (typeof value !== "string") return null;
			const trimmed = value.trim();
			return trimmed.length ? trimmed : null;
		}

		function toIntegerOrNull(value: unknown): number | null {
			const num = toNumberOrNull(value);
			if (num === null) return null;
			const rounded = Math.trunc(num);
			return Number.isFinite(rounded) ? rounded : null;
		}

		return (
			features
				.map((feature) => {
					const props = featureProps(feature);
					const sourceId = String(props.sourceId ?? "").trim();
					if (!sourceId.length) return null;

					const sourceCreatedAt =
						toStringOrNull(props.sourceCreatedAt) ?? undefined;

					return {
						sourceId,
						...(sourceCreatedAt ? { sourceCreatedAt } : {}),
						reportType: toStringOrNull(props.reportType),
						locationDescription: toStringOrNull(props.locationDescription),
						incidentTime: toStringOrNull(props.incidentTime),
						approved:
							typeof props.approved === "boolean" ? props.approved : null,
						archived:
							typeof props.archived === "boolean" ? props.archived : null,
						lon: toNumberOrNull(props.lon),
						lat: toNumberOrNull(props.lat),
						mediaCount: toIntegerOrNull(props.mediaCount),
						commentCount: toIntegerOrNull(props.commentCount),
						smallThumbnail: toStringOrNull(props.smallThumbnail),
						numOfficials: toIntegerOrNull(props.numOfficials),
						numVehicles: toIntegerOrNull(props.numVehicles),
					} satisfies IceReportCard;
				})
				.filter((item): item is IceReportCard => item !== null)
				// Prefer newest first when we have timestamps.
				.sort((a, b) => {
					const aMs = a.incidentTime
						? Date.parse(a.incidentTime)
						: a.sourceCreatedAt
							? Date.parse(a.sourceCreatedAt)
							: Number.NaN;
					const bMs = b.incidentTime
						? Date.parse(b.incidentTime)
						: b.sourceCreatedAt
							? Date.parse(b.sourceCreatedAt)
							: Number.NaN;
					if (Number.isFinite(aMs) && Number.isFinite(bMs)) return bMs - aMs;
					if (Number.isFinite(bMs)) return 1;
					if (Number.isFinite(aMs)) return -1;
					return a.sourceId.localeCompare(b.sourceId);
				})
		);
	}, []);

	const handleClick = useCallback(
		async (event: MapLayerMouseEvent) => {
			const map = mapRef.current?.getMap();
			if (!map) return;

			const feature = (event.features?.[0] ?? null) as MapGeoJSONFeature | null;
			if (!feature) {
				return;
			}

			const props = featureProps(feature);
			const source = map.getSource(MAP_SOURCE_ID) as GeoJSONSource | undefined;

			if (typeof props.point_count !== "undefined") {
				const clusterId = Number(props.cluster_id);
				const clusterCount = Number(props.point_count);
				if (
					!source ||
					!Number.isFinite(clusterId) ||
					!Number.isFinite(clusterCount)
				)
					return;

				onSelectCluster?.({
					kind: "cluster",
					clusterId,
					clusterCount,
					items: [],
					isLoading: true,
				});

				try {
					const limit = clamp(clusterCount, 1, 75);
					const leaves = await getClusterLeaves(source, clusterId, limit);
					const items = toClusterCards(leaves);
					onSelectCluster?.({
						kind: "cluster",
						clusterId,
						clusterCount,
						items,
						isLoading: false,
					});
				} catch {
					onSelectCluster?.({
						kind: "cluster",
						clusterId,
						clusterCount,
						items: [],
						isLoading: false,
					});
				}
				return;
			}

			const sourceId = String(props.sourceId ?? "");
			const sourceCreatedAt = String(props.sourceCreatedAt ?? "");
			if (!sourceId.length) return;

			onSelectReport({
				sourceId,
				sourceCreatedAt: sourceCreatedAt.length ? sourceCreatedAt : undefined,
			});
		},
		[onSelectCluster, onSelectReport, toClusterCards],
	);

	const maybeApplyTheme = useCallback(() => {
		const map = mapRef.current?.getMap();
		if (!map) return;
		if (isApplyingThemeRef.current) return;

		// MapLibre's style-spec color parser does not accept modern syntaxes (oklch/lab).
		// Use MapLibre-safe hex colors based on current theme.
		const isDark = document.documentElement.classList.contains("dark");
		// Land should be light, water should match page background.
		// Page background: light=#f4f1ea, dark=oklch(0.16 0.007 60) -> approx #272727
		const water = isDark ? "#111111" : "#f4f1ea";
		const land = isDark ? "#f4f1ea" : "#111111";

		const style = map.getStyle();
		const themeKey = `${style?.sprite ?? ""}|${style?.glyphs ?? ""}|${water}|${land}`;
		if (lastAppliedThemeKeyRef.current === themeKey) return;

		isApplyingThemeRef.current = true;
		try {
			applyTheme(map, { water, land });
			lastAppliedThemeKeyRef.current = themeKey;
		} finally {
			// setPaintProperty emits styledata; this prevents a feedback loop.
			queueMicrotask(() => {
				isApplyingThemeRef.current = false;
			});
		}
	}, []);

	const handleLoad = useCallback(() => {
		// Initialize bbox based on actual map bounds once the style loads.
		debouncedUpdateBbox();
		maybeApplyTheme();
	}, [debouncedUpdateBbox, maybeApplyTheme]);

	const handleStyleData = useCallback(() => {
		maybeApplyTheme();
	}, [maybeApplyTheme]);

	const interactiveLayerIds = useMemo(() => {
		const ids: string[] = [];
		if (isAgents) {
			if (agentStateLayer.id) ids.push(agentStateLayer.id);
		} else {
			if (clusterLayer.id) ids.push(clusterLayer.id);
			if (unclusteredPointLayer.id) ids.push(unclusteredPointLayer.id);
		}
		return ids;
	}, [isAgents]);

	return (
		<div className="ice-reports-map relative overflow-hidden rounded-2xl bg-background">
			<MapLibre
				ref={mapRef}
				// Dark base so "land" is reliably dark. We still recolor water via `applyTheme()`.
				mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
				initialViewState={initialViewState}
				maxBounds={maxBounds}
				minZoom={2.8}
				maxZoom={13}
				style={{ width: "100%", height: heightPx }}
				interactiveLayerIds={interactiveLayerIds}
				onDragEnd={handleDragEnd}
				onLoad={handleLoad}
				onStyleData={handleStyleData}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onClick={handleClick}
			>
				<NavigationControl position="top-right" />

				{isReports && (
					<IceReportsMapSource
						id={MAP_SOURCE_ID}
						type="geojson"
						data={geojson as FeatureCollection<Point>}
						cluster
						clusterRadius={CLUSTER_RADIUS_PX}
						clusterMaxZoom={CLUSTER_MAX_ZOOM}
					>
						<IceReportsMapLayer {...clusterLayer} />
						<IceReportsMapLayer {...clusterCountLayer} />
						<IceReportsMapLayer {...unclusteredPointLayer} />
						{highlightedSourceId ? (
							<IceReportsMapLayer
								id={`ice-reports-highlight-${highlightLayerId.replace(/:/g, "")}`}
								type="circle"
								source={MAP_SOURCE_ID}
								filter={[
									"all",
									["!", ["has", "point_count"]],
									["==", ["get", "sourceId"], highlightedSourceId],
								]}
								paint={{
									"circle-color": "#ffffff",
									"circle-radius": 9,
									"circle-opacity": 0.8,
									"circle-stroke-width": 3,
									"circle-stroke-color": "#dc2626",
								}}
							/>
						) : null}
					</IceReportsMapSource>
				)}

				{isAgents && (
					<IceReportsMapSource
						id={AGENTS_SOURCE_ID}
						type="geojson"
						data={geojson}
					>
						<IceReportsMapLayer {...agentStateLayer} />
						<IceReportsMapLayer {...agentStateLabelLayer} />
					</IceReportsMapSource>
				)}
			</MapLibre>

			{/* Permanent attribution overlays */}
			<div className="pointer-events-none absolute bottom-2 left-2 z-10">
				<div className="pointer-events-auto rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground ring-1 ring-border/60 supports-backdrop-filter:backdrop-blur-sm">
					powered by{" "}
					<a
						className="underline underline-offset-3 hover:text-foreground"
						href={isAgents ? "https://wiki.icelist.is/" : "https://iceout.org"}
						target="_blank"
						rel="noreferrer"
					>
						{isAgents ? "icelist.is" : "iceout.org"}
					</a>
				</div>
			</div>

			{/* Hover tooltip */}
			{hoverInfo && (
				<div
					className="pointer-events-none absolute z-20"
					style={{
						left: hoverInfo.x,
						top: hoverInfo.y,
						transform: "translate(10px, 10px)",
					}}
				>
					<div className="max-w-[260px] rounded-lg bg-background/90 px-3 py-2 text-xs ring-1 ring-border/60 supports-backdrop-filter:backdrop-blur-sm">
						<div className="font-medium text-foreground">{hoverInfo.title}</div>
						{hoverInfo.subtitle ? (
							<div className="mt-0.5 text-muted-foreground">
								{hoverInfo.subtitle}
							</div>
						) : null}
					</div>
				</div>
			)}
		</div>
	);
}

export default memo(IceReportsMapCanvas);
