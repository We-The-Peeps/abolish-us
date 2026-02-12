import { motion } from "motion/react";
import { fadeIn, lineReveal, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
	label: string;
	className?: string;
	labelClassName?: string;
}

export default function SectionDivider({
	label,
	className,
	labelClassName,
}: SectionDividerProps) {
	return (
		<motion.div
			variants={staggerContainer(0.15, 0.1)}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, amount: 0.2 }}
			className={cn("flex items-center gap-4", className)}
		>
			<motion.div
				variants={lineReveal}
				className="h-px flex-1 origin-right bg-foreground/10"
			/>
			<motion.span
				variants={fadeIn}
				className={cn(
					"select-none font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60",
					labelClassName,
				)}
			>
				{label}
			</motion.span>
			<motion.div
				variants={lineReveal}
				className="h-px flex-1 origin-left bg-foreground/10"
			/>
		</motion.div>
	);
}
