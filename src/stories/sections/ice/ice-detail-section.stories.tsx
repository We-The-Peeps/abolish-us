import type { Meta, StoryObj } from "@storybook/react-vite";
import IceDetailSection from "@/components/wealth/IceDetailSection";

const meta = {
	title: "sections/ice/IceDetailSection",
	component: IceDetailSection,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof IceDetailSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
