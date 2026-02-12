import { Github } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { defaultViewport, fadeIn } from "@/lib/motion";

export default function Copyright() {
	return (
		<motion.div
			variants={fadeIn}
			initial="hidden"
			whileInView="visible"
			viewport={defaultViewport}
			className="w-full py-12 text-center"
		>
			<div className="flex flex-col items-center gap-2 text-xs tracking-wide text-muted-foreground font-medium">
				&copy; {new Date().getFullYear()} We The People {"// "}Public Domain
				<Button
					variant="outline"
					size="xs"
					className="tracking-wide"
					nativeButton={false}
					render={
						<a
							href="https://git.new/abolish-us"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Github data-icon="inline-start" />
							Contribute on GitHub
						</a>
					}
				/>
			</div>
		</motion.div>
	);
}
