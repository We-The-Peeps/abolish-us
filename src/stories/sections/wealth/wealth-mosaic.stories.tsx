import type { Meta, StoryObj } from "@storybook/react-vite";
import WealthMosaic from "@/components/wealth/WealthMosaic";

const meta = {
	title: "sections/wealth (WIP)/WealthMosaic",
	component: WealthMosaic,
	parameters: { layout: "fullscreen" },
	tags: ["autodocs"],
} satisfies Meta<typeof WealthMosaic>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
