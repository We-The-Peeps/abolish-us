import {
	ImageIcon,
	MessageSquareIcon,
	ShieldIcon,
	TruckIcon,
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	type IceReportCard,
	toReportSubtitle,
	toReportTitle,
} from "./iceReportsCards";

export interface IceReportsReportRowProps {
	card: IceReportCard;
	onClick: (card: IceReportCard) => void;
	onHoverChange?: (card: IceReportCard | null) => void;
	compact?: boolean;
}

export default function IceReportsReportRow({
	card,
	onClick,
	onHoverChange,
	compact = false,
}: IceReportsReportRowProps) {
	const subtitle = toReportSubtitle(card);

	return (
		<Button
			variant="outline"
			className={cn(
				"h-auto w-full justify-start gap-3 overflow-hidden px-2.5 py-2 text-left",
				"hover:bg-muted/60",
				compact ? "rounded-lg" : "rounded-xl",
			)}
			onClick={() => onClick(card)}
			onMouseEnter={() => onHoverChange?.(card)}
			onMouseLeave={() => onHoverChange?.(null)}
		>
			<div className="w-[84px] shrink-0">
				<AspectRatio
					ratio={16 / 10}
					className="overflow-hidden rounded-lg bg-muted ring-1 ring-border/60"
				>
					{card.smallThumbnail ? (
						// biome-ignore lint/a11y/useAltText: decorative preview thumbnail
						<img
							src={card.smallThumbnail}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-muted-foreground">
							<ImageIcon className="size-4" />
						</div>
					)}
				</AspectRatio>
			</div>

			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium text-foreground">
					{toReportTitle(card)}
				</div>
				{subtitle ? (
					<div className="mt-0.5 truncate text-xs text-muted-foreground">
						{subtitle}
					</div>
				) : null}

				<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
					{typeof card.mediaCount === "number" && card.mediaCount > 0 ? (
						<Badge variant="secondary">
							<ImageIcon className="size-3" />
							{card.mediaCount}
						</Badge>
					) : null}
					{typeof card.commentCount === "number" && card.commentCount > 0 ? (
						<Badge variant="outline">
							<MessageSquareIcon className="size-3" />
							{card.commentCount}
						</Badge>
					) : null}
					{typeof card.numOfficials === "number" && card.numOfficials > 0 ? (
						<Badge variant="outline">
							<ShieldIcon className="size-3" />
							{card.numOfficials}
						</Badge>
					) : null}
					{typeof card.numVehicles === "number" && card.numVehicles > 0 ? (
						<Badge variant="outline">
							<TruckIcon className="size-3" />
							{card.numVehicles}
						</Badge>
					) : null}
				</div>
			</div>
		</Button>
	);
}
