import type { Meta, StoryObj } from "@storybook/react-vite";

import { AspectRatio } from "@/components/ui/aspect-ratio";

const meta = {
	title: "UI/AspectRatio",
	component: AspectRatio,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixteenByNine: Story = {
	render: () => (
		<div className="w-96">
			<AspectRatio
				ratio={16 / 9}
				className="overflow-hidden rounded-lg border border-border bg-muted"
			>
				<div className="flex h-full w-full items-center justify-center text-muted-foreground">
					16:9
				</div>
			</AspectRatio>
		</div>
	),
};

export const Square: Story = {
	render: () => (
		<div className="w-72">
			<AspectRatio
				ratio={1}
				className="overflow-hidden rounded-lg border border-border bg-muted"
			>
				<div className="flex h-full w-full items-center justify-center text-muted-foreground">
					1:1
				</div>
			</AspectRatio>
		</div>
	),
};
