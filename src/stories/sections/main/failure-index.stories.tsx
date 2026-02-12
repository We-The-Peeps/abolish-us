import type { Meta, StoryObj } from "@storybook/react-vite";
import FailureIndex from "@/components/home/FailureIndex";

const meta = {
	title: "sections/main/FailureIndex",
	component: FailureIndex,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof FailureIndex>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
