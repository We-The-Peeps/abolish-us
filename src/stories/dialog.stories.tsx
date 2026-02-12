import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const meta = {
	title: "UI/Dialog",
	component: Dialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicDialogPreview() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" />}>
				Open dialog
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dialog Title</DialogTitle>
					<DialogDescription>
						This dialog uses the shared UI primitives from `src/components/ui`.
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}

function DialogWithFooterPreview() {
	return (
		<Dialog>
			<DialogTrigger render={<Button>Open with footer</Button>} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Confirm Action</DialogTitle>
					<DialogDescription>
						Review this action before proceeding.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton>
					<Button>Continue</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export const Default: Story = {
	render: () => <BasicDialogPreview />,
};

export const WithFooter: Story = {
	render: () => <DialogWithFooterPreview />,
};
