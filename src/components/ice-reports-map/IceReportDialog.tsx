import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrpcClient } from "@/integrations/trpc/client";
import { lockDialogScroll, unlockDialogScroll } from "@/lib/dialog-scroll-lock";

export interface IceReportSelection {
	sourceId: string;
	sourceCreatedAt?: string;
}

export interface IceReportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selection: IceReportSelection | null;
}

export default function IceReportDialog({
	open,
	onOpenChange,
	selection,
}: IceReportDialogProps) {
	const trpcClient = useMemo(() => getTrpcClient(), []);
	const isClient = typeof window !== "undefined";

	const { data: reportDetail, isLoading } = useQuery({
		queryKey: [
			"ice-reports",
			"detail",
			selection?.sourceId ?? null,
			selection?.sourceCreatedAt ?? null,
		],
		queryFn: () =>
			trpcClient.iceReports.detail.query({
				sourceId: selection?.sourceId ?? "",
				sourceCreatedAt: selection?.sourceCreatedAt,
			}),
		enabled: isClient && open && Boolean(selection?.sourceId),
		staleTime: 60_000,
	});

	const iceoutReportUrl = selection?.sourceId
		? `https://iceout.org/en/reportInfo/${encodeURIComponent(selection.sourceId)}`
		: null;

	useEffect(() => {
		if (!open) return;
		lockDialogScroll();
		return () => unlockDialogScroll();
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Report details</DialogTitle>
					<DialogDescription>
						{iceoutReportUrl ? (
							<a href={iceoutReportUrl} target="_blank" rel="noreferrer">
								Open on iceout.org
							</a>
						) : (
							"Report"
						)}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="grid gap-3">
						<div className="grid gap-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-44" />
						</div>
						<div className="grid gap-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-56" />
						</div>
						<div className="grid gap-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-64" />
						</div>
						<div className="grid gap-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-[88%]" />
						</div>
					</div>
				) : reportDetail ? (
					<div className="grid gap-2">
						<div className="text-sm">
							<span className="text-muted-foreground">Type:</span>{" "}
							<span className="text-foreground">
								{reportDetail.reportType ?? "Unknown"}
							</span>
						</div>
						<div className="text-sm">
							<span className="text-muted-foreground">When:</span>{" "}
							<span className="text-foreground">
								{reportDetail.incidentTime ?? "Unknown"}
							</span>
						</div>
						<div className="text-sm">
							<span className="text-muted-foreground">Where:</span>{" "}
							<span className="text-foreground">
								{reportDetail.locationDescription ?? "Unknown"}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="text-muted-foreground">Officials:</span>{" "}
								<span className="text-foreground">
									{reportDetail.numOfficials ?? "Unknown"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Vehicles:</span>{" "}
								<span className="text-foreground">
									{reportDetail.numVehicles ?? "Unknown"}
								</span>
							</div>
						</div>
						{reportDetail.activityDescription ? (
							<div className="text-sm">
								<span className="text-muted-foreground">Activity:</span>{" "}
								<span className="text-foreground">
									{reportDetail.activityDescription}
								</span>
							</div>
						) : null}
						{Array.isArray(reportDetail.activityTagLabels) &&
						reportDetail.activityTagLabels.length ? (
							<div className="text-sm">
								<div className="text-muted-foreground">Activity reported:</div>
								<div className="mt-1 flex flex-wrap gap-1.5">
									{reportDetail.activityTagLabels.map((label) => (
										<Badge key={label} variant="secondary">
											{label}
										</Badge>
									))}
								</div>
							</div>
						) : null}
						{Array.isArray(reportDetail.enforcementTagLabels) &&
						reportDetail.enforcementTagLabels.length ? (
							<div className="text-sm">
								<div className="text-muted-foreground">Agency tags:</div>
								<div className="mt-1 flex flex-wrap gap-1.5">
									{reportDetail.enforcementTagLabels.map((label) => (
										<Badge key={label} variant="outline">
											{label}
										</Badge>
									))}
								</div>
							</div>
						) : null}
						{Array.isArray(reportDetail.licensePlates) &&
						reportDetail.licensePlates.length ? (
							<div className="text-sm">
								<div className="text-muted-foreground">License plates:</div>
								<div className="mt-1 flex flex-wrap gap-1.5">
									{reportDetail.licensePlates.map((plate) => (
										<Badge key={plate} variant="outline">
											{plate}
										</Badge>
									))}
								</div>
							</div>
						) : null}
						{reportDetail.sourceLink ? (
							<div className="text-sm">
								<a
									className="underline underline-offset-3 hover:text-foreground"
									href={reportDetail.sourceLink}
									target="_blank"
									rel="noreferrer"
								>
									Open source link
								</a>
							</div>
						) : null}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">No details found.</p>
				)}

				<DialogFooter showCloseButton>
					{iceoutReportUrl ? (
						<a
							className={buttonVariants({ variant: "outline" })}
							href={iceoutReportUrl}
							target="_blank"
							rel="noreferrer"
						>
							View on iceout.org
						</a>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
