import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/button";
import SectionBreak from "@/components/ui/section-break";

const meta = {
	title: "sections/generic/SectionBreak",
	component: SectionBreak,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof SectionBreak>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		content: (
			<>
				This is some inciteful text, iand accepts any element. For example:{" "}
				<br />
				<Button variant="outline" size="lg">
					this is a button
				</Button>
			</>
		),
	},
};
