import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { createFinding, validateFinding, findingsByFile, findingsBySeverity, findingsByCategory, buildSummary } from "../../src/review/finding.ts";
import type { ReviewFinding } from "../../src/types.ts";

function sampleFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
	return {
		file: "src/index.ts",
		line: 10,
		severity: "must-fix",
		category: "security",
		title: "SQL Injection",
		description: "User input used directly in query",
		evidence: "db.query(`SELECT * FROM users WHERE id = ${id}`)",
		suggestion: "Use parameterized queries",
		...overrides,
	};
}

describe("createFinding", () => {
	test("creates a valid finding", () => {
		const f = createFinding("a.ts", 5, "should-fix", "perf", "Slow loop", "N+1 query", "for (const u of users) db.find(u.id)", "Batch the query");
		assert.equal(f.file, "a.ts");
		assert.equal(f.line, 5);
		assert.equal(f.severity, "should-fix");
		assert.equal(f.category, "perf");
	});
});

describe("validateFinding", () => {
	test("valid finding passes", () => {
		const result = validateFinding(sampleFinding());
		assert.equal(result.valid, true);
		assert.equal(result.errors.length, 0);
	});

	test("missing evidence fails", () => {
		const result = validateFinding(sampleFinding({ evidence: "" }));
		assert.equal(result.valid, false);
		assert.ok(result.errors.some((e) => e.includes("evidence")));
	});

	test("missing file fails", () => {
		const result = validateFinding(sampleFinding({ file: "" }));
		assert.equal(result.valid, false);
	});

	test("invalid severity fails", () => {
		const result = validateFinding(sampleFinding({ severity: "critical" as never }));
		assert.equal(result.valid, false);
	});

	test("negative line fails", () => {
		const result = validateFinding(sampleFinding({ line: -1 }));
		assert.equal(result.valid, false);
	});
});

describe("findingsByFile", () => {
	test("groups findings by file", () => {
		const findings = [
			sampleFinding({ file: "a.ts" }),
			sampleFinding({ file: "b.ts" }),
			sampleFinding({ file: "a.ts", title: "Second issue" }),
		];
		const grouped = findingsByFile(findings);
		assert.equal(Object.keys(grouped).length, 2);
		assert.equal(grouped["a.ts"]!.length, 2);
		assert.equal(grouped["b.ts"]!.length, 1);
	});
});

describe("findingsBySeverity", () => {
	test("groups findings by severity", () => {
		const findings = [
			sampleFinding({ severity: "must-fix" }),
			sampleFinding({ severity: "info" }),
			sampleFinding({ severity: "must-fix", title: "Another" }),
		];
		const grouped = findingsBySeverity(findings);
		assert.equal(grouped["must-fix"]!.length, 2);
		assert.equal(grouped["info"]!.length, 1);
		assert.equal(grouped["should-fix"]!.length, 0);
	});
});

describe("findingsByCategory", () => {
	test("groups findings by category", () => {
		const findings = [
			sampleFinding({ category: "security" }),
			sampleFinding({ category: "performance" }),
		];
		const grouped = findingsByCategory(findings);
		assert.equal(Object.keys(grouped).length, 2);
	});
});

describe("buildSummary", () => {
	test("counts correctly", () => {
		const findings = [
			sampleFinding({ file: "a.ts", severity: "must-fix", category: "security" }),
			sampleFinding({ file: "b.ts", severity: "should-fix", category: "performance" }),
			sampleFinding({ file: "a.ts", severity: "info", category: "style" }),
		];
		const summary = buildSummary(findings, ["security", "performance"]);
		assert.equal(summary.total, 3);
		assert.equal(summary.bySeverity["must-fix"], 1);
		assert.equal(summary.byFile["a.ts"], 2);
		assert.equal(summary.byCategory["security"], 1);
	});
});
