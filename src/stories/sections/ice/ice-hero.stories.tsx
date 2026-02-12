import type { Meta, StoryObj } from "@storybook/react-vite";
import IceHero from "@/components/wealth/IceHero";

const meta = {
	title: "sections/ice/IceHero",
	component: IceHero,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof IceHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
