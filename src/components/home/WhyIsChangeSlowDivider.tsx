import { motion } from "motion/react";
import SectionDivider from "@/components/ui/section-divider";
import { defaultViewport, fadeIn } from "@/lib/motion";

export default function WhyIsChangeSlowDivider() {
	return (
		<motion.section
			variants={fadeIn}
			initial="hidden"
			whileInView="visible"
			viewport={defaultViewport}
			className="w-full max-w-[760px] px-4 pt-2 pb-8"
		>
			<SectionDivider label="why is change slow" />
		</motion.section>
	);
}
