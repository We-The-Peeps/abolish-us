"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "ahooks";
import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import IceReportsReportRow from "./IceReportsReportRow";
import type { IceReportCard, IceReportSelection } from "./iceReportsCards";
import { toSelectionKey } from "./iceReportsCards";

type SortOption = "Newest" | "Most media" | "Most comments";

function matchesQuery(card: IceReportCard, query: string): boolean {
	if (!query.length) return true;
	const haystack =
		`${card.locationDescription ?? ""} ${card.reportType ?? ""}`.toLowerCase();
	return haystack.includes(query);
}

function toMs(value: string | undefined | null): number {
	if (!value) return Number.NaN;
	const ms = Date.parse(value);
	return Number.isFinite(ms) ? ms : Number.NaN;
}

export interface IceReportsResultsPanelProps {
	cards: IceReportCard[];
	isLoading: boolean;
	heightPx?: number;
	onSelect: (selection: IceReportSelection) => void;
	onHoverChange?: (selection: IceReportSelection | null) => void;
	className?: string;
	showFiltersOnly?: boolean;
	showListOnly?: boolean;
	onFiltersChange?: (filtered: IceReportCard[]) => void;
	// Optional external state control
	search?: string;
	onSearchChange?: (value: string) => void;
	sort?: SortOption;
	onSortChange?: (value: SortOption) => void;
	onlyWithMedia?: boolean;
	onOnlyWithMediaChange?: (value: boolean) => void;
	onlyWithVehicles?: boolean;
	onOnlyWithVehiclesChange?: (value: boolean) => void;
	onlyWithOfficials?: boolean;
	onOnlyWithOfficialsChange?: (value: boolean) => void;
}

export default function IceReportsResultsPanel({
	cards,
	isLoading,
	heightPx,
	onSelect,
	onHoverChange,
	className,
	showFiltersOnly = false,
	showListOnly = false,
	onFiltersChange,
	search: externalSearch,
	onSearchChange,
	sort: externalSort,
	onSortChange,
	onlyWithMedia: externalOnlyWithMedia,
	onOnlyWithMediaChange,
	onlyWithVehicles: externalOnlyWithVehicles,
	onOnlyWithVehiclesChange,
	onlyWithOfficials: externalOnlyWithOfficials,
	onOnlyWithOfficialsChange,
}: IceReportsResultsPanelProps) {
	const [internalSearch, setInternalSearch] = useState("");
	const search = externalSearch ?? internalSearch;
	const setSearch = onSearchChange ?? setInternalSearch;

	const [internalSort, setInternalSort] = useState<SortOption>("Newest");
	const sort = externalSort ?? internalSort;
	const setSort = onSortChange ?? setInternalSort;

	const [internalOnlyWithMedia, setInternalOnlyWithMedia] = useState(false);
	const onlyWithMedia = externalOnlyWithMedia ?? internalOnlyWithMedia;
	const setOnlyWithMedia = onOnlyWithMediaChange ?? setInternalOnlyWithMedia;

	const [internalOnlyWithVehicles, setInternalOnlyWithVehicles] =
		useState(false);
	const onlyWithVehicles = externalOnlyWithVehicles ?? internalOnlyWithVehicles;
	const setOnlyWithVehicles =
		onOnlyWithVehiclesChange ?? setInternalOnlyWithVehicles;

	const [internalOnlyWithOfficials, setInternalOnlyWithOfficials] =
		useState(false);
	const onlyWithOfficials =
		externalOnlyWithOfficials ?? internalOnlyWithOfficials;
	const setOnlyWithOfficials =
		onOnlyWithOfficialsChange ?? setInternalOnlyWithOfficials;

	// ahooks `useDebounce` returns the debounced value (not a tuple).
	const debouncedSearch = useDebounce(search, { wait: 150 });

	const parentRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(() => {
		const q = (debouncedSearch ?? "").trim().toLowerCase();

		const base = cards.filter((card) => {
			if (
				onlyWithMedia &&
				!(typeof card.mediaCount === "number" && card.mediaCount > 0)
			)
				return false;
			if (
				onlyWithVehicles &&
				!(typeof card.numVehicles === "number" && card.numVehicles > 0)
			)
				return false;
			if (
				onlyWithOfficials &&
				!(typeof card.numOfficials === "number" && card.numOfficials > 0)
			)
				return false;
			return matchesQuery(card, q);
		});

		const sorted = [...base];
		sorted.sort((a, b) => {
			if (sort === "Most media") {
				const av = typeof a.mediaCount === "number" ? a.mediaCount : -1;
				const bv = typeof b.mediaCount === "number" ? b.mediaCount : -1;
				if (bv !== av) return bv - av;
			}
			if (sort === "Most comments") {
				const av = typeof a.commentCount === "number" ? a.commentCount : -1;
				const bv = typeof b.commentCount === "number" ? b.commentCount : -1;
				if (bv !== av) return bv - av;
			}

			// Newest: prefer incidentTime, then sourceCreatedAt.
			const aMs = toMs(a.incidentTime) || toMs(a.sourceCreatedAt) || 0;
			const bMs = toMs(b.incidentTime) || toMs(b.sourceCreatedAt) || 0;
			if (bMs !== aMs) return bMs - aMs;
			return toSelectionKey(a).localeCompare(toSelectionKey(b));
		});

		return sorted;
	}, [
		cards,
		debouncedSearch,
		onlyWithMedia,
		onlyWithOfficials,
		onlyWithVehicles,
		sort,
	]);

	const virtualizer = useVirtualizer({
		count: filtered.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 100,
		overscan: 5,
	});

	useEffect(() => {
		onFiltersChange?.(filtered);
	}, [filtered, onFiltersChange]);

	const hasAnyFilter =
		search.trim().length > 0 ||
		sort !== "Newest" ||
		onlyWithMedia ||
		onlyWithVehicles ||
		onlyWithOfficials;

	const filtersContent = (
		<div className={cn("mb-4 flex flex-col gap-2", className)}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="text-sm font-medium text-foreground">
					Reports in view
					<span className="ml-2 text-xs font-normal text-muted-foreground">
						{isLoading ? "Loading…" : `${filtered.length}/${cards.length}`}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setSearch("");
						setSort("Newest");
						setOnlyWithMedia(false);
						setOnlyWithVehicles(false);
						setOnlyWithOfficials(false);
					}}
					className={cn(
						!hasAnyFilter && "invisible pointer-events-none select-none",
					)}
				>
					Clear
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="flex-1 min-w-[240px]">
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search location or type"
					/>
				</InputGroup>

				<Select
					value={sort}
					onValueChange={(next) => setSort(next as SortOption)}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Sort" />
					</SelectTrigger>
					<SelectContent>
						{(["Newest", "Most media", "Most comments"] as SortOption[]).map(
							(item) => (
								<SelectItem key={item} value={item}>
									{item}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>

				<ButtonGroup className="w-fit">
					<Button
						variant={onlyWithMedia ? "default" : "outline"}
						size="sm"
						onClick={() => setOnlyWithMedia(!onlyWithMedia)}
						className={cn(
							onlyWithMedia && "bg-primary text-primary-foreground",
						)}
					>
						Media
					</Button>
					<Button
						variant={onlyWithVehicles ? "default" : "outline"}
						size="sm"
						onClick={() => setOnlyWithVehicles(!onlyWithVehicles)}
						className={cn(
							onlyWithVehicles && "bg-primary text-primary-foreground",
						)}
					>
						Vehicles
					</Button>
					<Button
						variant={onlyWithOfficials ? "default" : "outline"}
						size="sm"
						onClick={() => setOnlyWithOfficials(!onlyWithOfficials)}
						className={cn(
							onlyWithOfficials && "bg-primary text-primary-foreground",
						)}
					>
						Officials
					</Button>
				</ButtonGroup>
			</div>
		</div>
	);

	const listContent = (
		<div
			className={cn(
				"w-full rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col",
				className,
			)}
			style={{ height: heightPx }}
		>
			<div className="flex-1 overflow-auto" ref={parentRef}>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: "100%",
						position: "relative",
					}}
				>
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const card = filtered[virtualRow.index];
						return (
							<div
								key={virtualRow.key}
								data-index={virtualRow.index}
								ref={virtualizer.measureElement}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									transform: `translateY(${virtualRow.start}px)`,
									padding: "4px 8px",
								}}
							>
								<IceReportsReportRow
									card={card}
									onClick={() => onSelect(card)}
									onHoverChange={(next) => onHoverChange?.(next)}
								/>
							</div>
						);
					})}
					{!isLoading && filtered.length === 0 ? (
						<div className="px-1 py-10 text-center text-sm text-muted-foreground">
							No reports match your filters.
						</div>
					) : null}
				</div>
			</div>
		</div>
	);

	if (showFiltersOnly) return filtersContent;
	if (showListOnly) return listContent;

	return (
		<div className={cn("w-full", className)}>
			{filtersContent}
			{listContent}
		</div>
	);
}
