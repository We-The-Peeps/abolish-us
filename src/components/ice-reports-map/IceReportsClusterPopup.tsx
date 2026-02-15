import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { lockDialogScroll, unlockDialogScroll } from "@/lib/dialog-scroll-lock";

export interface IceReportsClusterPopupItem {
	sourceId: string;
	sourceCreatedAt?: string;
	title: string;
	subtitle?: string;
}

export interface IceReportsClusterPopupProps {
	clusterCount: number;
	items: IceReportsClusterPopupItem[];
	isLoading: boolean;
	onClose: () => void;
	onSelect: (item: IceReportsClusterPopupItem) => void;
}

export default function IceReportsClusterPopup({
	clusterCount,
	items,
	isLoading,
	onClose,
	onSelect,
}: IceReportsClusterPopupProps) {
	useEffect(() => {
		lockDialogScroll();
		return () => unlockDialogScroll();
	}, []);

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="w-[360px] max-w-[calc(100%-2rem)] gap-3 p-3 overflow-hidden">
				<DialogHeader className="flex-row items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<DialogTitle className="text-sm font-medium text-foreground">
							Cluster
						</DialogTitle>
						<Badge variant="secondary">{clusterCount}</Badge>
					</div>
				</DialogHeader>

				{isLoading ? (
					<div className="text-xs text-muted-foreground">Loading reports…</div>
				) : items.length ? (
					<ScrollArea className="h-[260px] w-full pr-2">
						<div className="grid gap-0.5 pr-1">
							{items.map((item) => (
								<Button
									key={`${item.sourceId}|${item.sourceCreatedAt ?? ""}`}
									variant="ghost"
									size="sm"
									className="h-auto w-full max-w-full justify-start overflow-hidden px-2 py-2 text-left whitespace-normal"
									onClick={() => onSelect(item)}
								>
									<div className="min-w-0 w-full overflow-hidden">
										<div className="truncate text-sm text-foreground">
											{item.title}
										</div>
										{item.subtitle ? (
											<div className="truncate text-xs text-muted-foreground">
												{item.subtitle}
											</div>
										) : null}
									</div>
								</Button>
							))}
						</div>
					</ScrollArea>
				) : (
					<div className="text-xs text-muted-foreground">
						No reports found in this cluster.
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
