import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
	validateDiffReview,
	validateFileReview,
	formatCompletenessReport,
	isReviewThorough,
	COMPLETENESS_THRESHOLDS,
} from "../../src/quality/completeness-check.ts";

describe("completeness-check", () => {
	describe("validateDiffReview", () => {
		test("returns perfect score when all inputs provided", () => {
			const result = validateDiffReview({
				base: "main",
				head: "HEAD",
				perspectives: ["security", "performance"],
				maxFiles: 20,
			});

			assert.strictEqual(result.score, 100);
			assert.strictEqual(result.isComplete, true);
			assert.strictEqual(result.warnings.length, 0);
		});

		test("returns low score when no inputs provided", () => {
			const result = validateDiffReview({});

			assert.ok(result.score < 50);
			assert.strictEqual(result.isComplete, false);
			assert.ok(result.warnings.length > 0);
		});

		test("adds warning for missing base ref", () => {
			const result = validateDiffReview({ head: "HEAD" });

			assert.strictEqual(result.checklist.hasBase, false);
			assert.ok(result.warnings.some((w: string) => w.includes("base ref")));
		});

		test("adds warning for missing head ref", () => {
			const result = validateDiffReview({ base: "main" });

			assert.strictEqual(result.checklist.hasHead, false);
			assert.ok(result.warnings.some((w: string) => w.includes("head ref")));
		});

		test("adds warning for low maxFiles", () => {
			const result = validateDiffReview({ maxFiles: 5 });

			assert.ok(result.warnings.some((w: string) => w.includes("maxFiles")));
		});

		test("marks maxFiles as reasonable when >= 10", () => {
			const result = validateDiffReview({ maxFiles: 10 });

			assert.strictEqual(result.checklist.maxFilesReasonable, true);
		});
	});

	describe("validateFileReview", () => {
		test("returns high score when file and perspectives provided", () => {
			const result = validateFileReview({
				file: "src/index.ts",
				perspectives: ["security"],
				context: "full",
			});

			assert.ok(result.score >= 70);
			assert.strictEqual(result.isComplete, true);
		});

		test("recommends security perspective", () => {
			const result = validateFileReview({
				file: "src/index.ts",
			});

			assert.ok(result.recommendations.some((r: string) => r.includes("security")));
		});
	});

	describe("formatCompletenessReport", () => {
		test("formats diff review result", () => {
			const result = validateDiffReview({});
			const report = formatCompletenessReport(result, "diff");

			assert.ok(report.includes("Completeness Check"));
			assert.ok(report.includes("diff"));
			assert.ok(report.includes("Score:"));
		});

		test("formats file review result", () => {
			const result = validateFileReview({ file: "test.ts" });
			const report = formatCompletenessReport(result, "file");

			assert.ok(report.includes("file"));
			assert.ok(report.includes("✅"));
		});
	});

	describe("isReviewThorough", () => {
		test("returns true for score >= recommended threshold", () => {
			assert.strictEqual(isReviewThorough(COMPLETENESS_THRESHOLDS.recommended), true);
			assert.strictEqual(isReviewThorough(100), true);
		});

		test("returns false for score < recommended threshold", () => {
			assert.strictEqual(isReviewThorough(50), false);
			assert.strictEqual(isReviewThorough(0), false);
		});
	});
});