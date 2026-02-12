import type { Meta, StoryObj } from "@storybook/react-vite";
import HeroSection from "@/components/home/HeroSection";

const meta = {
	title: "sections/main/HeroSection",
	component: HeroSection,
	parameters: { layout: "centered" },
	decorators: [
		(Story) => (
			<div className="flex min-h-screen flex-col justify-center items-center text-center">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
