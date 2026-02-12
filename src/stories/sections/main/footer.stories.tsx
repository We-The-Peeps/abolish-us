import type { Meta, StoryObj } from "@storybook/react-vite";
import Copyright from "@/components/home/Copyright";
import RebuildShipSection from "@/components/home/RebuildShipSection";

const Footer = () => (
	<footer className="w-full">
		<RebuildShipSection />
		<Copyright />
	</footer>
);

const meta = {
	title: "sections/main/Footer",
	component: Footer,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen flex-col justify-end">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
