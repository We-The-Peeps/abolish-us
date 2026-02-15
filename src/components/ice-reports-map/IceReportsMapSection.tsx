import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Point } from "geojson";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import SectionDivider from "@/components/ui/section-divider";
import { getTrpcClient } from "@/integrations/trpc/client";
import { defaultViewport, fadeUp, staggerContainer } from "@/lib/motion";
import type { IceReportSelection } from "./IceReportDialog";
import IceReportDialog from "./IceReportDialog";
import IceReportsMapCanvas from "./IceReportsMapCanvas";
import type { IceReportBboxInput } from "./iceReportsMapUtils";
import { toNumberOrNull } from "./iceReportsMapUtils";

interface IceReportMapPoint {
	sourceId: string;
	sourceCreatedAt: string;
	reportType: string | null;
	locationDescription: string | null;
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
	if (!Array.isArray(value)) return [];

	return value
		.map((report) => {
			if (!report || typeof report !== "object") return null;
			const record = report as Record<string, unknown>;
			const lon = toNumberOrNull(record.lon);
			const lat = toNumberOrNull(record.lat);
			if (lon === null || lat === null) return null;

			return {
				sourceId: String(record.sourceId ?? ""),
				sourceCreatedAt: String(record.sourceCreatedAt ?? ""),
				reportType: (record.reportType ?? null) as string | null,
				locationDescription: (record.locationDescription ?? null) as
					| string
					| null,
				lon,
				lat,
			} satisfies IceReportMapPoint;
		})
		.filter((item) => item !== null);
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
			},
		})),
	};
}

export default function IceReportsMapSection() {
	const trpcClient = useMemo(() => getTrpcClient(), []);
	const isClient = typeof window !== "undefined";
	const [bboxInput, setBboxInput] = useState<IceReportBboxInput>(USA_BBOX);
	const [selection, setSelection] = useState<IceReportSelection | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const { data } = useQuery({
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

	const points = useMemo(() => toMapPoints(data), [data]);
	const geojson = useMemo(() => toGeoJson(points), [points]);

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
			setSelection(nextSelection);
			setIsDialogOpen(true);
		},
		[],
	);

	return (
		<motion.section
			variants={staggerContainer(0.08)}
			initial="hidden"
			whileInView="visible"
			viewport={defaultViewport}
			className="w-full max-w-[960px] px-4 pt-8 pb-2"
		>
			<motion.div variants={fadeUp} className="mb-4">
				<SectionDivider label="ICE Reports Map (USA)" />
			</motion.div>

			<motion.div variants={fadeUp} className="w-full">
				<IceReportsMapCanvas
					geojson={geojson}
					initialViewState={USA_VIEWPORT}
					maxBounds={USA_MAX_BOUNDS}
					onBboxChange={handleBboxChange}
					onSelectReport={handleSelectReport}
				/>
			</motion.div>

			<IceReportDialog
				open={isDialogOpen}
				selection={selection}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (!open) {
						setSelection(null);
					}
				}}
			/>
		</motion.section>
	);
}
