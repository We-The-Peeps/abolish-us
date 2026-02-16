import { cn } from "@/lib/utils";

interface LogoProps {
	className?: string;
}

export function Logo({ className }: LogoProps) {
	return (
		<div className={cn("flex items-center gap-4", className)}>
			<div className="size-10 shrink-0 rounded-[2px] bg-foreground" />
			<span className="font-heading text-2xl font-bold tracking-[0.03em] uppercase text-foreground">
				ABOLISH US
			</span>
		</div>
	);
}
