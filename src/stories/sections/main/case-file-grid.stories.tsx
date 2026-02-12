import type { Meta, StoryObj } from "@storybook/react-vite";
import CaseFileGrid from "@/components/home/CaseFileGrid";

const meta = {
	title: "sections/main/CaseFileGrid",
	component: CaseFileGrid,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof CaseFileGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
