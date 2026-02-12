import type { Meta, StoryObj } from "@storybook/react-vite";
import SectionDivider from "@/components/ui/section-divider";

const meta = {
	title: "sections/generic/SectionDivider",
	component: SectionDivider,
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen flex-col justify-center px-8">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	args: {
		label: "Section Break",
	},
} satisfies Meta<typeof SectionDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
