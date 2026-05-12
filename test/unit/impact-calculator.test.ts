import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { calculateImpact, formatImpact } from "../../src/diff/impact-calculator.ts";
import type { DiffHunk } from "../../src/types.ts";

function makeHunk(file: string, content: string, changeType: "new" | "modified" | "deleted" | "renamed" = "modified"): DiffHunk {
	return {
		file,
		changeType,
		oldStart: 1,
		oldCount: 0,
		newStart: 1,
		newCount: 0,
		content,
		header: "",
	};
}

describe("calculateImpact", () => {
	test("empty hunks produce zero impact", () => {
		const impact = calculateImpact([]);
		assert.equal(impact.filesChanged, 0);
		assert.equal(impact.linesAdded, 0);
		assert.equal(impact.linesRemoved, 0);
	});

	test("counts added and removed lines", () => {
		const hunks = [
			makeHunk("a.ts", "+line1\n+line2\n-line3\n-line4\n-line5"),
		];
		const impact = calculateImpact(hunks);
		assert.equal(impact.linesAdded, 2);
		assert.equal(impact.linesRemoved, 3);
	});

	test("counts unique files", () => {
		const hunks = [
			makeHunk("a.ts", "+a"),
			makeHunk("b.ts", "+b"),
			makeHunk("a.ts", "+c"),
		];
		const impact = calculateImpact(hunks);
		assert.equal(impact.filesChanged, 2);
	});

	test("identifies critical paths", () => {
		const hunks = [
			makeHunk("src/auth/login.ts", "+code"),
			makeHunk("src/utils/helper.ts", "+code"),
		];
		const impact = calculateImpact(hunks);
		assert.ok(impact.criticalPaths.includes("src/auth/login.ts"));
		assert.ok(!impact.criticalPaths.includes("src/utils/helper.ts"));
	});

	test("identifies high impact files (>50 changes)", () => {
		const manyChanges = Array.from({ length: 55 }, () => "+line").join("\n");
		const hunks = [
			makeHunk("big-file.ts", manyChanges),
		];
		const impact = calculateImpact(hunks);
		assert.ok(impact.highImpactFiles.includes("big-file.ts"));
	});

	test("does not count +++ or --- header lines", () => {
		const hunks = [
			makeHunk("a.ts", "+++ b/a.ts\n--- a/a.ts\n+real line"),
		];
		const impact = calculateImpact(hunks);
		assert.equal(impact.linesAdded, 1);
		assert.equal(impact.linesRemoved, 0);
	});
});

describe("formatImpact", () => {
	test("formats basic impact", () => {
		const impact = calculateImpact([
			makeHunk("a.ts", "+line1\n-line2"),
		]);
		const text = formatImpact(impact);
		assert.ok(text.includes("Files changed: 1"));
		assert.ok(text.includes("+1"));
		assert.ok(text.includes("-1"));
	});

	test("includes critical paths warning", () => {
		const impact = calculateImpact([
			makeHunk("src/auth/session.ts", "+code"),
		]);
		const text = formatImpact(impact);
		assert.ok(text.includes("Critical paths"));
	});
});
