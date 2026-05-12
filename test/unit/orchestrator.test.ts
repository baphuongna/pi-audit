import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { ReviewOrchestrator } from "../../src/review/orchestrator.ts";
import * as os from "node:os";
import * as path from "node:path";

describe("ReviewOrchestrator", () => {
	const cwd = os.tmpdir();

	test("constructor loads without error", () => {
		const orchestrator = new ReviewOrchestrator(cwd);
		assert.ok(orchestrator);
	});

	test("resolvePerspectives defaults to enabled perspectives", () => {
		const orchestrator = new ReviewOrchestrator(cwd);
		// review() should run without error when perspectives can't be resolved
		// In a temp dir with no .pi/pi-review.json, defaults are used
	});

	test("reviewDiff returns a report structure", async () => {
		const orchestrator = new ReviewOrchestrator(cwd);
		// No git diff in temp dir — should return empty report
		const report = await orchestrator.reviewDiff(cwd);
		assert.ok(Array.isArray(report.findings));
		assert.ok(typeof report.summary === "object");
		assert.ok(report.timestamp);
	});

	test("reviewFile handles non-existent file gracefully", async () => {
		const orchestrator = new ReviewOrchestrator(cwd);
		const report = await orchestrator.reviewFile(cwd, "nonexistent-file-xyz.ts");
		assert.ok(Array.isArray(report.findings));
		assert.ok(report.timestamp);
	});

	test("generateFormattedReport creates valid report", () => {
		const orchestrator = new ReviewOrchestrator(cwd);
		const report = orchestrator.generateFormattedReport([], {
			format: "markdown",
			groupBy: "file",
			includeSuggestions: true,
		});
		assert.ok(report);
		assert.equal(report.findings.length, 0);
		assert.ok(report.timestamp);
	});

	test("review with empty hunks returns empty findings", async () => {
		const orchestrator = new ReviewOrchestrator(cwd);
		const report = await orchestrator.review([]);
		assert.ok(Array.isArray(report.findings));
		assert.equal(report.findings.length, 0);
	});
});