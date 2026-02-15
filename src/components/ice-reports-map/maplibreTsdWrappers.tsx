import { createElement, type PropsWithChildren } from "react";
import {
	type LayerProps,
	Layer as MapLibreLayer,
	Source as MapLibreSource,
	type SourceProps,
} from "react-map-gl/maplibre";

interface TsdDebugProps {
	// TanStack Start injects this for DX. MapLibre style-spec objects reject unknown keys,
	// so we must not forward it into `addSource` / `addLayer`.
	"data-tsd-source"?: string;
}

export function IceReportsMapSource(props: PropsWithChildren<SourceProps>) {
	const { ["data-tsd-source"]: _tsd, ...rest } = props as SourceProps &
		TsdDebugProps;
	// TanStack Start injects `data-tsd-source` into JSX elements. If we render
	// `<MapLibreSource />` in JSX here, the injected prop gets re-added and ends
	// up in MapLibre's `addSource()` style-spec object (which throws).
	return createElement(MapLibreSource, rest);
}

export function IceReportsMapLayer(props: LayerProps) {
	const { ["data-tsd-source"]: _tsd, ...rest } = props as LayerProps &
		TsdDebugProps;
	// Same issue as `IceReportsMapSource` - avoid JSX to prevent reinjection.
	return createElement(MapLibreLayer, rest);
}
