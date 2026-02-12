import type { Meta, StoryObj } from "@storybook/react-vite";
import TraditionalChangeSection from "@/components/home/TraditionalChangeSection";

const meta = {
	title: "sections/main/TraditionalChangeSection",
	component: TraditionalChangeSection,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof TraditionalChangeSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
