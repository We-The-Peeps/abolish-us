import type { LayerProps } from "react-map-gl/maplibre";

export const CLUSTER_RADIUS_PX = 52;
export const CLUSTER_MAX_ZOOM = 12;

export const MAP_SOURCE_ID = "ice-reports";
export const AGENTS_SOURCE_ID = "wiki-agents";

// Layer definitions follow the official react-map-gl clustering example:
// https://github.com/visgl/react-map-gl/tree/8.1-release/examples/maplibre/clusters
export const clusterLayer: LayerProps = {
	id: "ice-reports-clusters",
	type: "circle",
	source: MAP_SOURCE_ID,
	filter: ["has", "point_count"],
	paint: {
		"circle-color": "#dc2626",
		"circle-opacity": 0.9,
		"circle-stroke-width": 2,
		"circle-stroke-color": "#fee2e2",
		"circle-radius": [
			"step",
			["get", "point_count"],
			18,
			25,
			22,
			100,
			28,
			500,
			34,
		],
	},
};

export const clusterCountLayer: LayerProps = {
	id: "ice-reports-cluster-count",
	type: "symbol",
	source: MAP_SOURCE_ID,
	filter: ["has", "point_count"],
	layout: {
		"text-field": "{point_count_abbreviated}",
		"text-size": 12,
	},
	paint: {
		"text-color": "#ffffff",
	},
};

export const unclusteredPointLayer: LayerProps = {
	id: "ice-reports-unclustered",
	type: "circle",
	source: MAP_SOURCE_ID,
	filter: ["!", ["has", "point_count"]],
	paint: {
		"circle-color": "#dc2626",
		"circle-radius": 6,
		"circle-opacity": 0.95,
		"circle-stroke-width": 2,
		"circle-stroke-color": "#fee2e2",
	},
};

export const agentStateLayer: LayerProps = {
	id: "agent-states",
	type: "fill",
	source: AGENTS_SOURCE_ID,
	paint: {
		"fill-color": [
			"interpolate",
			["linear"],
			["get", "agentCount"],
			0,
			"rgba(220, 38, 38, 0)",
			1,
			"rgba(220, 38, 38, 0.1)",
			10,
			"rgba(220, 38, 38, 0.3)",
			50,
			"rgba(220, 38, 38, 0.6)",
			100,
			"rgba(220, 38, 38, 0.9)",
		],
		"fill-outline-color": "#dc2626",
	},
};

export const agentStateLabelLayer: LayerProps = {
	id: "agent-state-labels",
	type: "symbol",
	source: AGENTS_SOURCE_ID,
	layout: {
		"text-field": [
			"step",
			["get", "agentCount"],
			"",
			1,
			["concat", ["get", "name"], "\n", ["get", "agentCount"], " agents"],
		],
		"text-size": 12,
	},
	paint: {
		"text-color": "#ffffff",
		"text-halo-color": "#000000",
		"text-halo-width": 1,
	},
};
