"use client";

import { useDebounce } from "ahooks";
import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { lockDialogScroll, unlockDialogScroll } from "@/lib/dialog-scroll-lock";
import { cn } from "@/lib/utils";
import IceReportDetailContent from "./IceReportDetailContent";
import IceReportsReportRow from "./IceReportsReportRow";
import type { IceReportCard, IceReportSelection } from "./iceReportsCards";
import { toReportTitle, toSelectionKey } from "./iceReportsCards";

export interface IceReportsExplorerClusterCrumb {
	kind: "cluster";
	clusterId: number;
	clusterCount: number;
	items: IceReportCard[];
	isLoading: boolean;
}

export interface IceReportsExplorerReportCrumb {
	kind: "report";
	selection: IceReportSelection;
	card?: IceReportCard | null;
}

export type IceReportsExplorerCrumb =
	| IceReportsExplorerClusterCrumb
	| IceReportsExplorerReportCrumb;

export interface IceReportsExplorerDialogProps {
	stack: IceReportsExplorerCrumb[];
	onStackChange: (next: IceReportsExplorerCrumb[]) => void;
}

function clusterMatchesQuery(card: IceReportCard, query: string): boolean {
	if (!query.length) return true;
	const haystack =
		`${card.locationDescription ?? ""} ${card.reportType ?? ""}`.toLowerCase();
	return haystack.includes(query);
}

export default function IceReportsExplorerDialog({
	stack,
	onStackChange,
}: IceReportsExplorerDialogProps) {
	const open = stack.length > 0;
	const active = stack[stack.length - 1] ?? null;

	// Only used in the cluster list view (this is the "cluster search").
	const [clusterSearch, setClusterSearch] = useState("");
	// ahooks `useDebounce` returns the debounced value (not a tuple).
	const debouncedClusterSearch = useDebounce(clusterSearch, { wait: 150 });

	useEffect(() => {
		if (!open) return;
		lockDialogScroll();
		return () => unlockDialogScroll();
	}, [open]);

	useEffect(() => {
		// Reset cluster search whenever navigation changes.
		if (stack.length === 0) return;
		setClusterSearch("");
	}, [stack.length]);

	const clusterFilteredItems = useMemo(() => {
		if (!active || active.kind !== "cluster") return [];
		const q = (debouncedClusterSearch ?? "").trim().toLowerCase();
		return active.items.filter((item) => clusterMatchesQuery(item, q));
	}, [active, debouncedClusterSearch]);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) onStackChange([]);
			}}
		>
			<DialogContent className="max-h-[calc(100vh-2rem)] w-[min(calc(100%-2rem),980px)] overflow-hidden p-0 sm:max-w-none">
				<DialogHeader className="gap-2 border-b px-4 py-3">
					<DialogTitle className="text-base">ICE reports</DialogTitle>

					<Breadcrumb className="w-full">
						<BreadcrumbList className="text-xs">
							{stack.flatMap((crumb, idx) => {
								const isLast = idx === stack.length - 1;
								const label =
									crumb.kind === "cluster"
										? `Cluster (${crumb.clusterCount})`
										: crumb.card
											? toReportTitle(crumb.card)
											: "Report";

								const item = (
									<BreadcrumbItem key={`${crumb.kind}-${idx}`}>
										{isLast ? (
											<BreadcrumbPage className="max-w-[40ch] truncate">
												{label}
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink
												href="#"
												className="max-w-[40ch] truncate"
												onClick={(e) => {
													e.preventDefault();
													onStackChange(stack.slice(0, idx + 1));
												}}
											>
												{label}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								);

								return isLast
									? [item]
									: [
											item,
											<BreadcrumbSeparator key={`sep-${crumb.kind}-${idx}`} />,
										];
							})}
						</BreadcrumbList>
					</Breadcrumb>
				</DialogHeader>

				<div className="grid min-h-0 grid-rows-[auto_1fr]">
					{active?.kind === "cluster" ? (
						<div className="border-b px-4 py-3">
							<InputGroup className="h-9">
								<InputGroupAddon>
									<SearchIcon className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									value={clusterSearch}
									onChange={(e) => setClusterSearch(e.target.value)}
									placeholder="Search this cluster"
								/>
							</InputGroup>
							<div className="mt-2 text-xs text-muted-foreground">
								{active.isLoading
									? "Loading reports…"
									: `${clusterFilteredItems.length}/${active.items.length} shown`}
							</div>
						</div>
					) : null}

					<div className="h-[500px] w-full">
						<ScrollArea className="h-full">
							<div
								className={cn(
									"p-4",
									active?.kind === "cluster" ? "grid gap-2" : "",
								)}
							>
								{active?.kind === "cluster" ? (
									active.isLoading ? (
										<div className="text-sm text-muted-foreground">
											Loading…
										</div>
									) : clusterFilteredItems.length ? (
										clusterFilteredItems.map((card) => (
											<IceReportsReportRow
												key={toSelectionKey(card)}
												card={card}
												onClick={(next) => {
													onStackChange([
														...stack,
														{
															kind: "report",
															selection: {
																sourceId: next.sourceId,
																sourceCreatedAt: next.sourceCreatedAt,
															},
															card: next,
														} satisfies IceReportsExplorerReportCrumb,
													]);
												}}
												compact
											/>
										))
									) : (
										<div className="py-10 text-center text-sm text-muted-foreground">
											No reports match your search.
										</div>
									)
								) : active?.kind === "report" ? (
									<IceReportDetailContent
										selection={active.selection}
										enabled={open}
									/>
								) : (
									<div className="text-sm text-muted-foreground">
										Select a report to view details.
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
