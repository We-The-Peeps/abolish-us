import { useDebounceFn } from "ahooks";
import type { FeatureCollection, Point } from "geojson";
import type {
	GeoJSONSource,
	MapGeoJSONFeature,
	Map as MapLibreMap,
} from "maplibre-gl";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import MapLibre, {
	type MapLayerMouseEvent,
	type MapRef,
	NavigationControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import IceReportsClusterPopup, {
	type IceReportsClusterPopupItem,
} from "./IceReportsClusterPopup";
import {
	CLUSTER_MAX_ZOOM,
	CLUSTER_RADIUS_PX,
	clusterCountLayer,
	clusterLayer,
	MAP_SOURCE_ID,
	unclusteredPointLayer,
} from "./iceReportsMapLayers";
import { featureProps, roundCoordinate } from "./iceReportsMapUtils";
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

interface ClusterPopupState {
	clusterId: number;
	clusterCount: number;
	items: IceReportsClusterPopupItem[];
	isLoading: boolean;
}

export interface IceReportsMapCanvasProps {
	geojson: FeatureCollection<Point, Record<string, unknown>>;
	initialViewState: IceReportsMapCanvasViewport;
	maxBounds: [[number, number], [number, number]];
	onBboxChange: (bbox: {
		minLon: number;
		minLat: number;
		maxLon: number;
		maxLat: number;
	}) => void;
	onSelectReport: (selection: {
		sourceId: string;
		sourceCreatedAt?: string;
	}) => void;
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
	onBboxChange,
	onSelectReport,
}: IceReportsMapCanvasProps) {
	const mapRef = useRef<MapRef | null>(null);
	const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
	const [clusterPopup, setClusterPopup] = useState<ClusterPopupState | null>(
		null,
	);
	const isApplyingThemeRef = useRef(false);
	const lastAppliedThemeKeyRef = useRef<string | null>(null);

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

	const handleMouseMove = useCallback(async (event: MapLayerMouseEvent) => {
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
	}, []);

	const handleMouseLeave = useCallback(() => {
		const map = mapRef.current?.getMap();
		if (map) map.getCanvas().style.cursor = "";
		setHoverInfo(null);
	}, []);

	const toClusterPopupItems = useCallback(
		(features: MapGeoJSONFeature[]): IceReportsClusterPopupItem[] => {
			return (
				features
					.map((feature) => {
						const props = featureProps(feature);
						const sourceId = String(props.sourceId ?? "");
						if (!sourceId.length) return null;
						const sourceCreatedAtRaw = String(props.sourceCreatedAt ?? "");
						const sourceCreatedAt = sourceCreatedAtRaw.length
							? sourceCreatedAtRaw
							: undefined;

						const title =
							(props.locationDescription as string | undefined) ??
							(props.reportType as string | undefined) ??
							"ICE report";
						const subtitle =
							typeof props.reportType === "string" && props.reportType.length
								? props.reportType
								: undefined;

						return {
							sourceId,
							...(sourceCreatedAt ? { sourceCreatedAt } : {}),
							title,
							...(subtitle ? { subtitle } : {}),
						} satisfies IceReportsClusterPopupItem;
					})
					.filter((item): item is IceReportsClusterPopupItem => item !== null)
					// Prefer newest first when we have timestamps.
					.sort((a, b) => {
						const aMs = a.sourceCreatedAt
							? Date.parse(a.sourceCreatedAt)
							: Number.NaN;
						const bMs = b.sourceCreatedAt
							? Date.parse(b.sourceCreatedAt)
							: Number.NaN;
						if (Number.isFinite(aMs) && Number.isFinite(bMs)) return bMs - aMs;
						if (Number.isFinite(bMs)) return 1;
						if (Number.isFinite(aMs)) return -1;
						return a.sourceId.localeCompare(b.sourceId);
					})
			);
		},
		[],
	);

	const handleClick = useCallback(
		async (event: MapLayerMouseEvent) => {
			const map = mapRef.current?.getMap();
			if (!map) return;

			const feature = (event.features?.[0] ?? null) as MapGeoJSONFeature | null;
			if (!feature) {
				setClusterPopup(null);
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

				setClusterPopup({
					clusterId,
					clusterCount,
					items: [],
					isLoading: true,
				});

				try {
					const limit = clamp(clusterCount, 1, 75);
					const leaves = await getClusterLeaves(source, clusterId, limit);
					const items = toClusterPopupItems(leaves);
					setClusterPopup((current) =>
						current && current.clusterId === clusterId
							? { ...current, items, isLoading: false }
							: current,
					);
				} catch {
					setClusterPopup((current) =>
						current && current.clusterId === clusterId
							? { ...current, items: [], isLoading: false }
							: current,
					);
				}
				return;
			}

			const sourceId = String(props.sourceId ?? "");
			const sourceCreatedAt = String(props.sourceCreatedAt ?? "");
			if (!sourceId.length) return;

			setClusterPopup(null);
			onSelectReport({
				sourceId,
				sourceCreatedAt: sourceCreatedAt.length ? sourceCreatedAt : undefined,
			});
		},
		[onSelectReport, toClusterPopupItems],
	);

	const maybeApplyTheme = useCallback(() => {
		const map = mapRef.current?.getMap();
		if (!map) return;
		if (isApplyingThemeRef.current) return;

		// MapLibre's style-spec color parser does not accept modern syntaxes (oklch/lab).
		// Use MapLibre-safe hex colors.
		const water = "#f4f1ea";
		const land = "#111111";

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
		return [clusterLayer.id, unclusteredPointLayer.id].filter(
			(id): id is string => typeof id === "string" && id.length > 0,
		);
	}, []);

	return (
		<div className="w-full">
			<div className="mb-2 flex items-center justify-between gap-3">
				<p className="text-sm text-foreground">
					Hover for preview, click for details, click clusters for the list
				</p>
			</div>

			<div className="ice-reports-map relative overflow-hidden rounded-2xl bg-background">
				<MapLibre
					ref={mapRef}
					// Dark base so "land" is reliably dark. We still recolor water via `applyTheme()`.
					mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
					initialViewState={initialViewState}
					maxBounds={maxBounds}
					minZoom={2.8}
					maxZoom={13}
					style={{ width: "100%", height: 520 }}
					interactiveLayerIds={interactiveLayerIds}
					onDragEnd={handleDragEnd}
					onLoad={handleLoad}
					onStyleData={handleStyleData}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					onClick={handleClick}
				>
					<NavigationControl position="top-right" />

					<IceReportsMapSource
						id={MAP_SOURCE_ID}
						type="geojson"
						data={geojson}
						cluster
						clusterRadius={CLUSTER_RADIUS_PX}
						clusterMaxZoom={CLUSTER_MAX_ZOOM}
					>
						<IceReportsMapLayer {...clusterLayer} />
						<IceReportsMapLayer {...clusterCountLayer} />
						<IceReportsMapLayer {...unclusteredPointLayer} />
					</IceReportsMapSource>
				</MapLibre>

				{/* Permanent attribution overlays */}
				<div className="pointer-events-none absolute bottom-2 left-2 z-10">
					<div className="pointer-events-auto rounded-md bg-background/80 px-2 py-1 text-[11px] text-muted-foreground ring-1 ring-border/60 supports-backdrop-filter:backdrop-blur-sm">
						powered by{" "}
						<a
							className="underline underline-offset-3 hover:text-foreground"
							href="https://iceout.org"
							target="_blank"
							rel="noreferrer"
						>
							iceout.org
						</a>
					</div>
				</div>

				{/* Cluster click popup (portal so it won't be clipped by overflow-hidden). */}
				{clusterPopup && (
					<IceReportsClusterPopup
						clusterCount={clusterPopup.clusterCount}
						items={clusterPopup.items}
						isLoading={clusterPopup.isLoading}
						onClose={() => setClusterPopup(null)}
						onSelect={(item) => {
							setClusterPopup(null);
							onSelectReport({
								sourceId: item.sourceId,
								sourceCreatedAt: item.sourceCreatedAt,
							});
						}}
					/>
				)}

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
							<div className="font-medium text-foreground">
								{hoverInfo.title}
							</div>
							{hoverInfo.subtitle ? (
								<div className="mt-0.5 text-muted-foreground">
									{hoverInfo.subtitle}
								</div>
							) : null}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default memo(IceReportsMapCanvas);
