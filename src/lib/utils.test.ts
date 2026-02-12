import { describe, expect, it } from "@jest/globals";
import { cn } from "@/lib/utils";

describe("cn", () => {
	it("merges class names and keeps the latest Tailwind utility", () => {
		const result = cn("px-2 py-2", "px-4", false && "hidden", undefined);

		expect(result).toContain("px-4");
		expect(result).toContain("py-2");
		expect(result).not.toContain("px-2");
	});
});
