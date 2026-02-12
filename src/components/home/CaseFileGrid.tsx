import { useInterval } from "ahooks";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import SectionDivider from "@/components/ui/section-divider";
import { MOBILE_BREAKPOINT, useIsMobile } from "@/hooks/use-mobile";
import { fadeIn } from "@/lib/motion";
import CaseFileCard from "./CaseFileCard";

interface SubjectMeta {
	name: string;
	position: string;
	caseId: string;
}

interface CaseSubject extends SubjectMeta {
	src: string;
}

/** Metadata keyed by filename prefix (the part before `-N`) */
const subjectMeta: Record<string, SubjectMeta> = {
	clinton: {
		name: "Clinton, William J.",
		position: "Former U.S. President",
		caseId: "DOJ-EF-0012",
	},
	trump: {
		name: "Trump, Donald J.",
		position: "U.S. President",
		caseId: "DOJ-EF-0027",
	},
	andrew: {
		name: "Windsor, Andrew A.",
		position: "Duke of York",
		caseId: "DOJ-EF-0031",
	},
	branson: {
		name: "Branson, Richard C.",
		position: "Chairman, Virgin Group",
		caseId: "DOJ-EF-0044",
	},
	woody: {
		name: "Allen, Heywood A.",
		position: "Film Director",
		caseId: "DOJ-EF-0058",
	},
	bannon: {
		name: "Bannon, Stephen K.",
		position: "Fmr. White House Strategist",
		caseId: "DOJ-EF-0063",
	},
	michael: {
		name: "Jackson, Michael J.",
		position: "Entertainer",
		caseId: "DOJ-EF-0071",
	},
	redacted: {
		name: "[REDACTED]",
		position: "[REDACTED]",
		caseId: "DOJ-EF-0089",
	},
	chomsky: {
		name: "Chomsky, Noam A.",
		position: "Public Intellectual",
		caseId: "DOJ-EF-0090",
	},
	cronkite: {
		name: "Cronkite, Walter L.",
		position: "Broadcast Journalist",
		caseId: "DOJ-EF-0091",
	},
	dershowitz: {
		name: "Dershowitz, Alan M.",
		position: "Attorney",
		caseId: "DOJ-EF-0092",
	},
	maxwell: {
		name: "Maxwell, Ghislaine C.",
		position: "Socialite",
		caseId: "DOJ-EF-0093",
	},
	gates: {
		name: "Gates, Bill H.",
		position: "Chair, Gates Foundation",
		caseId: "DOJ-EF-0094",
	},
	jagger: {
		name: "Jagger, Mick",
		position: "Musician",
		caseId: "DOJ-EF-0095",
	},
	brunel: {
		name: "Brunel, Jean-Luc",
		position: "Modeling Agent",
		caseId: "DOJ-EF-0096",
	},
	brin: {
		name: "Brin, Sergey M.",
		position: "Google Co-Founder",
		caseId: "DOJ-EF-0097",
	},
	tucker: {
		name: "Carlson, Tucker S.",
		position: "Media Personality",
		caseId: "DOJ-EF-0098",
	},
};

const poiFilenames = [
	"andrew-1.webp",
	"bannon-1.jpg",
	"branson-1.webp",
	"branson-2.jpg",
	"brin-1.jpg",
	"brunel-1.jpg",
	"brunel-2.jpg",
	"chomsky-1.jpg",
	"clinton-1.webp",
	"clinton-2.jpg",
	"clinton-3.jpg",
	"cronkite-1.jpg",
	"dershowitz-1.jpg",
	"gates-1.jpg",
	"gates-2.jpg",
	"jagger-1.jpg",
	"maxwell-1.jpg",
	"maxwell-2.jpg",
	"michael-1.jpg",
	"redacted-1.jpg",
	"trump-1.webp",
	"trump-2.jpg",
	"tucker-1.jpg",
	"woody-1.webp",
] as const;

/** Build subjects from discovered files + metadata lookup */
const allSubjects: CaseSubject[] = poiFilenames.map((filename) => {
	const basename = filename.replace(/\.\w+$/, "");
	const key = basename.replace(/-\d+$/, "");
	const meta = subjectMeta[key];
	return {
		src: `/poi/${filename}`,
		name: meta?.name ?? "[UNKNOWN]",
		position: meta?.position ?? "[UNKNOWN]",
		caseId: `${meta?.caseId ?? "DOJ-EF-UNKN"}-${basename}`,
	};
});

const pickRandom = (count: number): number[] => {
	const indices = allSubjects.map((_, i) => i);
	const result: number[] = [];
	while (result.length < count && indices.length > 0) {
		const pick = Math.floor(Math.random() * indices.length);
		result.push(indices[pick]);
		indices.splice(pick, 1);
	}
	return result;
};

export default function CaseFileGrid() {
	const isMobile = useIsMobile();
	const isMobileOnMount =
		typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
	const useMobileLayout = isMobile || isMobileOnMount;
	const slotCount = useMobileLayout ? 4 : 8;
	const intervalMs = useMobileLayout ? 3000 : 5000;

	const [selection, setSelection] = useState<number[]>(() =>
		pickRandom(slotCount),
	);

	useEffect(() => {
		setSelection((currentSelection) =>
			currentSelection.length === slotCount
				? currentSelection
				: pickRandom(slotCount),
		);
	}, [slotCount]);

	const cycle = useCallback(() => {
		setSelection(pickRandom(slotCount));
	}, [slotCount]);

	useInterval(cycle, intervalMs);

	return (
		<div className="mt-16 mb-8 w-full">
			{/* Section header */}
			<motion.div
				variants={fadeIn}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
				className="mb-6"
			>
				<SectionDivider label="Persons of Interest" />
			</motion.div>

			{/* Case file grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
				<AnimatePresence mode="popLayout">
					{selection.map((imgIdx, slotIdx) => {
						const subject = allSubjects[imgIdx];
						return (
							<motion.div
								key={`${slotIdx}-${subject.src}`}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{
									duration: 0.4,
									delay: slotIdx * 0.06,
									ease: [0.25, 0.46, 0.45, 0.94],
								}}
							>
								<CaseFileCard {...subject} />
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
}
