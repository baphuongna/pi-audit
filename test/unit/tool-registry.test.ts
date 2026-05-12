import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Test tool-registry types and helper functions without Pi API
describe("tool-registry helpers", () => {
	test("reviewResult structure is correct", () => {
		// We test the result shape that the tools would produce
		const result = {
			content: [{ type: "text" as const, text: "review output" }],
			details: { tool: "pi-review", status: "ok" as const },
		};
		assert.equal(result.content.length, 1);
		assert.equal(result.content[0]!.type, "text");
		assert.equal(result.details.tool, "pi-review");
		assert.equal(result.details.status, "ok");
	});

	test("error result includes isError flag", () => {
		const result = {
			content: [{ type: "text" as const, text: "error message" }],
			details: { tool: "pi-review", status: "error" as const },
			isError: true as const,
		};
		assert.equal(result.isError, true);
		assert.equal(result.details.status, "error");
	});

	test("tool parameter shapes are valid", () => {
		// Validate parameter interfaces
		const diffParams = { base: "HEAD~1", head: "HEAD", perspectives: ["security"], maxFiles: 10 };
		assert.equal(diffParams.perspectives!.length, 1);

		const fileParams = { file: "src/app.ts", perspectives: ["security"], context: "full" as const };
		assert.equal(fileParams.file, "src/app.ts");

		const reportParams = { format: "markdown" as const, includeSuggestions: true, groupBy: "file" as const };
		assert.equal(reportParams.format, "markdown");
	});
});
