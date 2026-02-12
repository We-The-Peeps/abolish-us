import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

function SmokeComponent() {
	return <h1>Open source ready</h1>;
}

describe("react testing library setup", () => {
	it("renders jsx in jsdom", () => {
		render(<SmokeComponent />);

		expect(
			screen.getByRole("heading", { name: "Open source ready" }),
		).toBeTruthy();
	});
});
