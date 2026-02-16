"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "ahooks";
import { SearchIcon, UserIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

export interface WikiAgentsResultsPanelProps {
	agents: WikiAgent[];
	isLoading: boolean;
	heightPx?: number;
	className?: string;
	showFiltersOnly?: boolean;
	showListOnly?: boolean;
	// Optional external state control
	search?: string;
	onSearchChange?: (value: string) => void;
	sort?: AgentSortOption;
	onSortChange?: (value: AgentSortOption) => void;
	onFiltersChange?: (filtered: WikiAgent[]) => void;
}

type AgentSortOption = "Name" | "Agency" | "State";

export default function WikiAgentsResultsPanel({
	agents,
	isLoading,
	heightPx,
	className,
	showFiltersOnly = false,
	showListOnly = false,
	search: externalSearch,
	onSearchChange,
	sort: externalSort,
	onSortChange,
	onFiltersChange,
}: WikiAgentsResultsPanelProps) {
	const [internalSearch, setInternalSearch] = useState("");
	const search = externalSearch ?? internalSearch;
	const setSearch = onSearchChange ?? setInternalSearch;

	const [internalSort, setInternalSort] = useState<AgentSortOption>("Name");
	const sort = externalSort ?? internalSort;
	const setSort = onSortChange ?? setInternalSort;

	const debouncedSearch = useDebounce(search, { wait: 150 });

	const parentRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(() => {
		const q = (debouncedSearch ?? "").trim().toLowerCase();

		const base = agents.filter((agent) => {
			// Filter out agents without any meaningful details
			const hasDetails = !!(
				agent.agency ||
				agent.role ||
				agent.fieldOffice ||
				agent.state
			);
			if (!hasDetails) return false;

			// Filter out agencies with wiki syntax like [[ICE]]
			if (agent.agency?.includes("[[")) return false;

			if (!q) return true;
			const haystack =
				`${agent.fullName ?? ""} ${agent.agency ?? ""} ${agent.role ?? ""} ${agent.fieldOffice ?? ""} ${agent.state ?? ""}`.toLowerCase();
			return haystack.includes(q);
		});

		const sorted = [...base];
		sorted.sort((a, b) => {
			if (sort === "Agency") {
				return (a.agency ?? "").localeCompare(b.agency ?? "");
			}
			if (sort === "State") {
				return (a.state ?? "").localeCompare(b.state ?? "");
			}
			const nameA = a.fullName || a.wikiName || "";
			const nameB = b.fullName || b.wikiName || "";
			return nameA.localeCompare(nameB);
		});

		return sorted;
	}, [agents, debouncedSearch, sort]);

	useEffect(() => {
		onFiltersChange?.(filtered);
	}, [filtered, onFiltersChange]);

	const virtualizer = useVirtualizer({
		count: filtered.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 80,
		overscan: 5,
	});

	const filtersContent = (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="text-sm font-medium text-foreground">
					Agents in database
					<span className="ml-2 text-xs font-normal text-muted-foreground">
						{isLoading ? "Loading…" : `${filtered.length}/${agents.length}`}
					</span>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="flex-1 min-w-[240px]">
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search name, agency, or office"
					/>
				</InputGroup>

				<Select
					value={sort}
					onValueChange={(next) => setSort(next as AgentSortOption)}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="Sort" />
					</SelectTrigger>
					<SelectContent>
						{(["Name", "Agency", "State"] as AgentSortOption[]).map((item) => (
							<SelectItem key={item} value={item}>
								{item}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
						const agent = filtered[virtualRow.index];
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
								<a
									href={`https://wiki.icelist.is/index.php/${agent.wikiName}`}
									target="_blank"
									rel="noreferrer"
									className="group relative flex flex-col gap-1 rounded-xl border bg-background p-3 transition-colors hover:bg-accent/10"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
												<UserIcon className="size-4 text-muted-foreground" />
											</div>
											<div className="flex flex-col">
												<span className="text-sm font-semibold leading-tight">
													{agent.fullName || agent.wikiName}
												</span>
												<span className="text-xs text-muted-foreground">
													{agent.agency} {agent.role && `• ${agent.role}`}
												</span>
											</div>
										</div>
										{agent.verificationStatus === "Verified" && (
											<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
												Verified
											</span>
										)}
									</div>
									<div className="mt-1 flex flex-wrap gap-1.5">
										{agent.fieldOffice && (
											<span className="text-[11px] text-muted-foreground">
												Office: {agent.fieldOffice}
											</span>
										)}
										{agent.state && (
											<span className="text-[11px] text-muted-foreground">
												State: {agent.state}
											</span>
										)}
									</div>
								</a>
							</div>
						);
					})}
					{!isLoading && filtered.length === 0 && (
						<div className="px-1 py-10 text-center text-sm text-muted-foreground">
							No agents match your search.
						</div>
					)}
				</div>
			</div>
		</div>
	);

	if (showFiltersOnly) return filtersContent;
	if (showListOnly) return listContent;

	return (
		<div className={cn("w-full flex flex-col gap-4", className)}>
			{filtersContent}
			{listContent}
		</div>
	);
}
