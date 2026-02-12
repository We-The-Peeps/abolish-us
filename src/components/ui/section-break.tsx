import { motion } from "motion/react";
import { defaultViewport, fadeUp } from "@/lib/motion";

export default function SectionBreak({
	content,
}: {
	content: React.ReactNode;
}) {
	return (
		<motion.section
			variants={fadeUp}
			initial="hidden"
			whileInView="visible"
			viewport={defaultViewport}
			className="flex w-full max-w-[720px] flex-col items-center border-y border-border px-4 pt-10 pb-10 text-center"
		>
			<p className="text-xl leading-relaxed text-muted-foreground">{content}</p>
		</motion.section>
	);
}
