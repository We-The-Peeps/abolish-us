import type { Meta, StoryObj } from "@storybook/react-vite";
import WealthHero from "@/components/wealth/WealthHero";

const meta = {
	title: "sections/wealth (WIP)/WealthHero",
	component: WealthHero,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof WealthHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
