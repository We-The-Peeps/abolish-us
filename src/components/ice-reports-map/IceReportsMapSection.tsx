import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Geometry, Point } from "geojson";
import { ListIcon, MapIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import SectionDivider from "@/components/ui/section-divider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTrpcClient } from "@/integrations/trpc/client";
import { defaultViewport, fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import usStatesData from "../../../public/us-states.json";
import IceReportsExplorerDialog, {
	type IceReportsExplorerClusterCrumb,
	type IceReportsExplorerCrumb,
	type IceReportsExplorerReportCrumb,
} from "./IceReportsExplorerDialog";
import IceReportsMapCanvas from "./IceReportsMapCanvas";
import IceReportsResultsPanel from "./IceReportsResultsPanel";
import type { IceReportCard, IceReportSelection } from "./iceReportsCards";
import { toIceReportCards } from "./iceReportsCards";
import type { IceReportBboxInput } from "./iceReportsMapUtils";
import { toNumberOrNull } from "./iceReportsMapUtils";
import WikiAgentsResultsPanel from "./WikiAgentsResultsPanel";

interface WikiAgent {
	id: number;
	wikiName: string;
	fullName: string | null;
	agency: string | null;
	role: string | null;
	fieldOffice: string | null;
	state: string | null;
	status: string | null;
	verificationStatus: string | null;
}

interface IceReportMapPoint {
	sourceId: string;
	sourceCreatedAt: string;
	reportType: string | null;
	locationDescription: string | null;
	incidentTime: string | null;
	approved: boolean | null;
	archived: boolean | null;
	mediaCount: number | null;
	commentCount: number | null;
	smallThumbnail: string | null;
	numOfficials: number | null;
	numVehicles: number | null;
	lon: number | null;
	lat: number | null;
}

const USA_VIEWPORT = {
	longitude: -98.5795,
	latitude: 39.8283,
	zoom: 3.2,
};

const USA_BBOX: IceReportBboxInput = {
	minLon: -125,
	minLat: 24,
	maxLon: -66.5,
	maxLat: 49.8,
};

const USA_MAX_BOUNDS: [[number, number], [number, number]] = [
	[USA_BBOX.minLon, USA_BBOX.minLat],
	[USA_BBOX.maxLon, USA_BBOX.maxLat],
];

const QUERY_LOOKBACK_HOURS = 24 * 14;
const QUERY_LIMIT = 500;

function toMapPoints(value: unknown): IceReportMapPoint[] {
	const cards = toIceReportCards(value);
	return cards
		.map((card): IceReportMapPoint | null => {
			const lon = toNumberOrNull(card.lon);
			const lat = toNumberOrNull(card.lat);
			if (lon === null || lat === null) return null;
			if (!card.sourceCreatedAt) return null;

			const point: IceReportMapPoint = {
				sourceId: card.sourceId,
				sourceCreatedAt: card.sourceCreatedAt,
				reportType: card.reportType,
				locationDescription: card.locationDescription,
				incidentTime: card.incidentTime,
				approved: card.approved,
				archived: card.archived,
				mediaCount: card.mediaCount,
				commentCount: card.commentCount,
				smallThumbnail: card.smallThumbnail,
				numOfficials: card.numOfficials,
				numVehicles: card.numVehicles,
				lon,
				lat,
			};

			return point;
		})
		.filter((item): item is IceReportMapPoint => item !== null);
}

function toGeoJson(
	points: IceReportMapPoint[],
): FeatureCollection<Point, Record<string, unknown>> {
	return {
		type: "FeatureCollection",
		features: points.map((point) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [point.lon ?? 0, point.lat ?? 0],
			},
			properties: {
				sourceId: point.sourceId,
				sourceCreatedAt: point.sourceCreatedAt,
				reportType: point.reportType,
				locationDescription: point.locationDescription,
				incidentTime: point.incidentTime,
				approved: point.approved,
				archived: point.archived,
				mediaCount: point.mediaCount,
				commentCount: point.commentCount,
				smallThumbnail: point.smallThumbnail,
				numOfficials: point.numOfficials,
				numVehicles: point.numVehicles,
				lon: point.lon,
				lat: point.lat,
			},
		})),
	};
}

export default function IceReportsMapSection() {
	const trpcClient = useMemo(() => getTrpcClient(), []);
	const isClient = typeof window !== "undefined";
	const isMobile = useIsMobile();
	const [bboxInput, setBboxInput] = useState<IceReportBboxInput>(USA_BBOX);
	const [explorerStack, setExplorerStack] = useState<IceReportsExplorerCrumb[]>(
		[],
	);
	const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(
		null,
	);
	const [filteredCards, setFilteredCards] = useState<IceReportCard[]>([]);
	const [filteredAgents, setFilteredAgents] = useState<WikiAgent[]>([]);
	const [activeTab, setActiveTab] = useState("reports");
	const [mobileView, setMobileView] = useState<"map" | "list">("map");

	// Shared filter/sort state for reports
	const [reportsSearch, setReportsSearch] = useState("");
	const [reportsSort, setReportsSort] = useState<
		"Newest" | "Most media" | "Most comments"
	>("Newest");
	const [reportsOnlyMedia, setReportsOnlyMedia] = useState(false);
	const [reportsOnlyVehicles, setReportsOnlyVehicles] = useState(false);
	const [reportsOnlyOfficials, setReportsOnlyOfficials] = useState(false);

	// Shared filter/sort state for agents
	const [agentsSearch, setAgentsSearch] = useState("");
	const [agentsSort, setAgentsSort] = useState<"Name" | "Agency" | "State">(
		"Name",
	);

	const isReports = activeTab === "reports";
	const isAgents = activeTab === "agents";

	const { data, isLoading } = useQuery({
		queryKey: ["ice-reports", "map", bboxInput],
		queryFn: () =>
			trpcClient.iceReports.bbox.query({
				...bboxInput,
				limit: QUERY_LIMIT,
				lookbackHours: QUERY_LOOKBACK_HOURS,
			}),
		refetchInterval: 60_000,
		staleTime: 20_000,
		enabled: isClient,
	});

	const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
		queryKey: ["wiki-agents", "list"],
		queryFn: () => trpcClient.wikiAgents.list.query(),
		staleTime: 60_000,
		enabled: isClient && isAgents,
	});

	const points = useMemo(() => toMapPoints(data), [data]);
	const geojson = useMemo(
		() =>
			toGeoJson(filteredCards.length > 0 ? toMapPoints(filteredCards) : points),
		[points, filteredCards],
	);

	const agentsGeojson = useMemo((): FeatureCollection<
		Geometry,
		Record<string, unknown>
	> => {
		const agentsToMap =
			filteredAgents.length > 0
				? filteredAgents
				: (agentsData as WikiAgent[]) || [];
		if (agentsToMap.length === 0)
			return { type: "FeatureCollection", features: [] };

		return {
			type: "FeatureCollection",
			features: (
				usStatesData as FeatureCollection<Geometry, { name: string }>
			).features.map((feature) => {
				const stateName = feature.properties?.name;
				const stateAgents = agentsToMap.filter((a) => a.state === stateName);
				const totalCount = stateAgents.length;
				const verifiedCount = stateAgents.filter(
					(a) => a.verificationStatus === "Verified",
				).length;

				return {
					...feature,
					properties: {
						...feature.properties,
						agentCount: totalCount,
						verifiedCount: verifiedCount,
					},
				};
			}),
		};
	}, [agentsData, filteredAgents]);

	const cards = useMemo(() => toIceReportCards(data), [data]);

	const handleBboxChange = useCallback((nextBbox: IceReportBboxInput) => {
		setBboxInput((currentBbox) =>
			currentBbox.minLon === nextBbox.minLon &&
			currentBbox.minLat === nextBbox.minLat &&
			currentBbox.maxLon === nextBbox.maxLon &&
			currentBbox.maxLat === nextBbox.maxLat
				? currentBbox
				: nextBbox,
		);
	}, []);

	const handleSelectReport = useCallback(
		(nextSelection: IceReportSelection) => {
			setExplorerStack([
				{
					kind: "report",
					selection: nextSelection,
				} satisfies IceReportsExplorerReportCrumb,
			]);
		},
		[],
	);

	const handleSelectCluster = useCallback(
		(cluster: IceReportsExplorerClusterCrumb) => {
			setExplorerStack((current) => {
				// If the active stack is already rooted on this cluster, just update it
				// (this allows the "loading -> loaded" update without navigation reset).
				const root = current[0];
				if (root?.kind === "cluster" && root.clusterId === cluster.clusterId) {
					return [cluster, ...current.slice(1)];
				}
				return [cluster];
			});
		},
		[],
	);

	const mapHeightPx = isMobile ? 420 : 560;

	return (
		<motion.section
			variants={staggerContainer(0.08)}
			initial="hidden"
			whileInView="visible"
			viewport={defaultViewport}
			className="w-full max-w-[1200px] px-4 pt-8 pb-2"
		>
			<motion.div variants={fadeUp} className="mb-4">
				<SectionDivider label="Icy Conditions Across the US" />
			</motion.div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex flex-col gap-6"
			>
				<motion.div variants={fadeUp} className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<TabsList>
							<TabsTrigger value="reports">Reports</TabsTrigger>
							<TabsTrigger value="agents">Agents</TabsTrigger>
						</TabsList>

						{isMobile && (
							<div className="flex items-center gap-1 rounded-lg bg-muted p-1">
								<Button
									variant={mobileView === "map" ? "default" : "ghost"}
									size="sm"
									className="h-7 px-2"
									onClick={() => setMobileView("map")}
								>
									<MapIcon className="mr-1.5 size-3.5" />
									Map
								</Button>
								<Button
									variant={mobileView === "list" ? "default" : "ghost"}
									size="sm"
									className="h-7 px-2"
									onClick={() => setMobileView("list")}
								>
									<ListIcon className="mr-1.5 size-3.5" />
									List
								</Button>
							</div>
						)}
					</div>

					<div className="w-full">
						{isReports ? (
							<IceReportsResultsPanel
								cards={cards}
								isLoading={isLoading}
								onSelect={handleSelectReport}
								onFiltersChange={setFilteredCards}
								showFiltersOnly
								className="mb-0"
								search={reportsSearch}
								onSearchChange={setReportsSearch}
								sort={reportsSort}
								onSortChange={setReportsSort}
								onlyWithMedia={reportsOnlyMedia}
								onOnlyWithMediaChange={setReportsOnlyMedia}
								onlyWithVehicles={reportsOnlyVehicles}
								onOnlyWithVehiclesChange={setReportsOnlyVehicles}
								onlyWithOfficials={reportsOnlyOfficials}
								onOnlyWithOfficialsChange={setReportsOnlyOfficials}
							/>
						) : (
							<WikiAgentsResultsPanel
								agents={(agentsData as WikiAgent[]) ?? []}
								isLoading={isLoadingAgents}
								onFiltersChange={setFilteredAgents}
								showFiltersOnly
								className="mb-0"
								search={agentsSearch}
								onSearchChange={setAgentsSearch}
								sort={agentsSort}
								onSortChange={setAgentsSort}
							/>
						)}
					</div>
				</motion.div>

				<motion.div
					variants={fadeUp}
					className={cn(
						"relative flex flex-col gap-4 w-full",
						isReports ? "lg:flex-row" : "lg:flex-row-reverse",
					)}
				>
					<motion.div
						layout
						className={cn(
							"flex-1 min-w-0",
							isMobile && mobileView !== "map" && "hidden",
						)}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
					>
						<IceReportsMapCanvas
							geojson={isReports ? geojson : agentsGeojson}
							mode={activeTab as "reports" | "agents"}
							initialViewState={USA_VIEWPORT}
							maxBounds={USA_MAX_BOUNDS}
							onBboxChange={handleBboxChange}
							onSelectReport={handleSelectReport}
							onSelectCluster={(cluster) => handleSelectCluster(cluster)}
							highlightedSourceId={highlightedSourceId}
							heightPx={mapHeightPx}
						/>
					</motion.div>

					<div
						className={cn(
							"lg:w-[420px] lg:flex-none",
							isMobile && mobileView !== "list" && "hidden",
						)}
					>
						<AnimatePresence mode="wait">
							{isReports && (
								<motion.div
									key="reports-sidebar"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ duration: 0.2 }}
								>
									<IceReportsResultsPanel
										cards={cards}
										isLoading={isLoading}
										heightPx={mapHeightPx}
										onSelect={(selection) => handleSelectReport(selection)}
										onHoverChange={(selection) =>
											setHighlightedSourceId(selection?.sourceId ?? null)
										}
										showListOnly
										search={reportsSearch}
										onSearchChange={setReportsSearch}
										sort={reportsSort}
										onSortChange={setReportsSort}
										onlyWithMedia={reportsOnlyMedia}
										onOnlyWithMediaChange={setReportsOnlyMedia}
										onlyWithVehicles={reportsOnlyVehicles}
										onOnlyWithVehiclesChange={setReportsOnlyVehicles}
										onlyWithOfficials={reportsOnlyOfficials}
										onOnlyWithOfficialsChange={setReportsOnlyOfficials}
									/>
								</motion.div>
							)}
							{isAgents && (
								<motion.div
									key="agents-sidebar"
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									transition={{ duration: 0.2 }}
								>
									<WikiAgentsResultsPanel
										agents={(agentsData as WikiAgent[]) ?? []}
										isLoading={isLoadingAgents}
										heightPx={mapHeightPx}
										showListOnly
										search={agentsSearch}
										onSearchChange={setAgentsSearch}
										sort={agentsSort}
										onSortChange={setAgentsSort}
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</Tabs>

			<IceReportsExplorerDialog
				stack={explorerStack}
				onStackChange={(next) => setExplorerStack(next)}
			/>
		</motion.section>
	);
}
