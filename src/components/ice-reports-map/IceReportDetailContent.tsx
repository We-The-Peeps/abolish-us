"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarIcon,
	CameraIcon,
	CarIcon,
	ExternalLinkIcon,
	MapPinIcon,
	MessageSquareIcon,
	Share2Icon,
	UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrpcClient } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";
import type { IceReportSelection } from "./iceReportsCards";

export interface IceReportDetailContentProps {
	selection: IceReportSelection;
	enabled?: boolean;
}

/**
 * Custom hook to check if an image URL is valid and reachable.
 */
function useImagePrecheck(urls: string[]) {
	const [status, setStatus] = useState<
		Record<string, "loading" | "valid" | "error">
	>(Object.fromEntries(urls.map((url) => [url, "loading"])));

	useEffect(() => {
		for (const url of urls) {
			if (status[url] !== "loading") continue;

			const img = new Image();
			img.src = url;
			img.onload = () => setStatus((prev) => ({ ...prev, [url]: "valid" }));
			img.onerror = () => setStatus((prev) => ({ ...prev, [url]: "error" }));
		}
	}, [urls, status]);

	return status;
}

export default function IceReportDetailContent({
	selection,
	enabled = true,
}: IceReportDetailContentProps) {
	const trpcClient = useMemo(() => getTrpcClient(), []);
	const isClient = typeof window !== "undefined";

	const { data: reportDetail, isLoading } = useQuery({
		queryKey: [
			"ice-reports",
			"detail",
			selection.sourceId,
			selection.sourceCreatedAt ?? null,
		],
		queryFn: () =>
			trpcClient.iceReports.detail.query({
				sourceId: selection.sourceId,
				sourceCreatedAt: selection.sourceCreatedAt,
			}),
		enabled: isClient && enabled && Boolean(selection.sourceId),
		staleTime: 60_000,
	});

	const mediaUrls = useMemo(() => {
		if (!reportDetail?.mediaCount) return [];
		return Array.from({ length: reportDetail.mediaCount }).map(
			(_, i) => `https://iceout.org/api/v1/media/${selection.sourceId}/${i}`,
		);
	}, [reportDetail?.mediaCount, selection.sourceId]);

	const imageStatuses = useImagePrecheck(mediaUrls);

	const iceoutReportUrl = selection.sourceId
		? `https://iceout.org/en/reportInfo/${encodeURIComponent(selection.sourceId)}`
		: null;

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Skeleton className="aspect-square w-full rounded-xl" />
				<div className="space-y-4">
					<Skeleton className="h-8 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-12 w-full rounded-lg" />
						<Skeleton className="h-12 w-full rounded-lg" />
					</div>
					<Skeleton className="h-24 w-full rounded-lg" />
				</div>
			</div>
		);
	}

	if (!reportDetail) {
		return (
			<div className="flex h-40 items-center justify-center text-muted-foreground">
				No details found for this report.
			</div>
		);
	}

	const renderMedia = (url: string, index: number) => {
		const status = imageStatuses[url];

		if (status === "error") {
			return (
				<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground/40">
					<CameraIcon className="size-12" />
					<span className="text-xs font-medium uppercase tracking-wider">
						Image unavailable
					</span>
				</div>
			);
		}

		if (status === "loading") {
			return <Skeleton className="h-full w-full" />;
		}

		return (
			<img
				src={url}
				alt={`Report media ${index + 1}`}
				className="h-full w-full object-cover"
			/>
		);
	};

	return (
		<div className="flex flex-col gap-8 pb-6">
			{/* Top Section: Image and Base Details Side-by-Side */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
				{/* Left: Media Column */}
				<div className="space-y-4">
					<div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted shadow-sm">
						{mediaUrls.length > 0 ? (
							mediaUrls.length > 1 ? (
								<Carousel className="h-full w-full">
									<CarouselContent className="h-full">
										{mediaUrls.map((url, i) => (
											<CarouselItem
												key={`${selection.sourceId}-media-${i}`}
												className="h-full pl-0"
											>
												{renderMedia(url, i)}
											</CarouselItem>
										))}
									</CarouselContent>
									<div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 pointer-events-none">
										<CarouselPrevious className="static translate-y-0 pointer-events-auto" />
										<CarouselNext className="static translate-y-0 pointer-events-auto" />
									</div>
								</Carousel>
							) : (
								renderMedia(mediaUrls[0], 0)
							)
						) : (
							<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground/40">
								<CameraIcon className="size-12" />
								<span className="text-xs font-medium uppercase tracking-wider">
									No media available
								</span>
							</div>
						)}
						<div className="absolute top-4 right-4 flex gap-2">
							<Button
								size="icon-sm"
								variant="secondary"
								className="rounded-full shadow-md"
							>
								<Share2Icon className="size-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Right: Base Details Column */}
				<div className="flex flex-col justify-between space-y-6">
					<div className="space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h2 className="text-3xl font-bold tracking-tight text-foreground">
									{reportDetail.reportType || "ICE Report"}
								</h2>
								<div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
									<MapPinIcon className="size-4 shrink-0" />
									<span className="text-base font-medium">
										{reportDetail.locationDescription || "Unknown location"}
									</span>
								</div>
							</div>
							<Badge
								variant={reportDetail.approved ? "secondary" : "secondary"}
								className="capitalize"
							>
								{reportDetail.approved ? "Verified" : "Observed"}
							</Badge>
						</div>

						<div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y py-5">
							<div className="flex items-center gap-3">
								<CalendarIcon className="size-5 text-muted-foreground" />
								<div className="flex flex-col">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Occurred
									</span>
									<span className="text-sm font-semibold">
										{reportDetail.incidentTime || "Unknown"}
									</span>
								</div>
							</div>
							<div className="h-10 w-px bg-border hidden sm:block" />
							<div className="flex items-center gap-3">
								<MessageSquareIcon className="size-5 text-muted-foreground" />
								<div className="flex flex-col">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
										Comments
									</span>
									<span className="text-sm font-semibold">
										{reportDetail.commentCount || 0} discussions
									</span>
								</div>
							</div>
						</div>

						{/* Stats Grid */}
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col rounded-2xl border p-4 transition-colors hover:bg-muted/30">
								<div className="flex items-center gap-2 text-muted-foreground">
									<UserIcon className="size-4" />
									<span className="text-xs font-bold uppercase tracking-wider">
										Officials
									</span>
								</div>
								<span className="mt-1 text-2xl font-black">
									{reportDetail.numOfficials ?? "Unknown"}
								</span>
							</div>
							<div className="flex flex-col rounded-2xl border p-4 transition-colors hover:bg-muted/30">
								<div className="flex items-center gap-2 text-muted-foreground">
									<CarIcon className="size-4" />
									<span className="text-xs font-bold uppercase tracking-wider">
										Vehicles
									</span>
								</div>
								<span className="mt-1 text-2xl font-black">
									{reportDetail.numVehicles ?? "Unknown"}
								</span>
							</div>
						</div>
					</div>

					{/* Primary Actions */}
					<div className="flex flex-col gap-3 pt-4">
						{iceoutReportUrl && (
							<a
								href={iceoutReportUrl}
								target="_blank"
								rel="noreferrer"
								className={cn(
									buttonVariants({ variant: "default", size: "lg" }),
									"w-full rounded-xl shadow-sm gap-2 font-bold",
								)}
							>
								View Full Report on Iceout.org
								<ExternalLinkIcon className="size-4" />
							</a>
						)}
						{reportDetail.locationDescription && (
							<a
								href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
									reportDetail.locationDescription,
								)}`}
								target="_blank"
								rel="noreferrer"
								className={cn(
									buttonVariants({ variant: "outline", size: "lg" }),
									"w-full rounded-xl gap-2 font-semibold",
								)}
							>
								Open in Google Maps
							</a>
						)}
					</div>
				</div>
			</div>

			{/* Bottom Section: Description, Comments, and Tags */}
			<div className="grid grid-cols-1 gap-8 border-t pt-8">
				<div className="space-y-8">
					{/* Description / Activity */}
					<div className="space-y-4">
						<h3 className="text-lg font-bold tracking-tight text-foreground">
							Activity Description
						</h3>
						<div className="rounded-2xl bg-muted/20 p-6 text-base leading-relaxed text-foreground/90 border">
							{reportDetail.activityDescription ||
								"No detailed activity description provided for this report."}
						</div>
					</div>

					{/* Comments Section */}
					<div className="space-y-4 pt-2">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-bold tracking-tight text-foreground">
								Comments & Discussions
							</h3>
							<Badge variant="outline" className="px-3 py-1 font-bold">
								{reportDetail.commentCount || 0}
							</Badge>
						</div>
						<div className="rounded-2xl border border-dashed p-10 text-center bg-muted/5">
							<MessageSquareIcon className="mx-auto size-10 text-muted-foreground/20" />
							<p className="mt-3 text-base text-muted-foreground">
								{reportDetail.commentCount && reportDetail.commentCount > 0
									? "View discussions on the full report page."
									: "No comments yet on this report."}
							</p>
							{iceoutReportUrl && (
								<a
									href={iceoutReportUrl}
									target="_blank"
									rel="noreferrer"
									className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
								>
									Join the conversation
									<ExternalLinkIcon className="size-4" />
								</a>
							)}
						</div>
					</div>

					{/* Tags Section */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{Array.isArray(reportDetail.activityTagLabels) &&
							reportDetail.activityTagLabels.length > 0 && (
								<div className="space-y-3">
									<h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
										Activity Tags
									</h4>
									<div className="flex flex-wrap gap-2">
										{reportDetail.activityTagLabels.map((label) => (
											<Badge
												key={label}
												variant="secondary"
												className="rounded-lg px-3 py-1 text-xs font-semibold"
											>
												{label}
											</Badge>
										))}
									</div>
								</div>
							)}

						{Array.isArray(reportDetail.enforcementTagLabels) &&
							reportDetail.enforcementTagLabels.length > 0 && (
								<div className="space-y-3">
									<h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
										Enforcement Agency
									</h4>
									<div className="flex flex-wrap gap-2">
										{reportDetail.enforcementTagLabels.map((label) => (
											<Badge
												key={label}
												variant="outline"
												className="border-primary/20 bg-primary/5 text-primary rounded-lg px-3 py-1 text-xs font-semibold"
											>
												{label}
											</Badge>
										))}
									</div>
								</div>
							)}

						{Array.isArray(reportDetail.licensePlates) &&
							reportDetail.licensePlates.length > 0 && (
								<div className="space-y-3">
									<h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
										License Plates
									</h4>
									<div className="flex flex-wrap gap-2">
										{reportDetail.licensePlates.map((plate) => (
											<Badge
												key={plate}
												variant="outline"
												className="font-mono tracking-widest font-bold px-3 py-1"
											>
												{plate}
											</Badge>
										))}
									</div>
								</div>
							)}
					</div>
				</div>
			</div>
		</div>
	);
}
