import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { generateReport, formatReport } from "../../src/review/report.ts";
import type { ReviewFinding, ReportOptions, ReviewReport } from "../../src/types.ts";

function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
	return {
		file: "src/app.ts",
		line: 10,
		severity: "must-fix",
		category: "security",
		title: "SQL Injection",
		description: "User input used directly in SQL query without parameterization",
		evidence: "db.query(`SELECT * FROM users WHERE id = ${id}`)",
		suggestion: "Use parameterized queries: db.query('SELECT * FROM users WHERE id = $1', [id])",
		...overrides,
	};
}

const SAMPLE_FINDINGS: ReviewFinding[] = [
	makeFinding(),
	makeFinding({ file: "src/app.ts", line: 25, severity: "should-fix", category: "performance", title: "N+1 Query", description: "Loop makes individual DB queries", evidence: "for (const u of users) { db.find(u.id) }", suggestion: "Batch the query" }),
	makeFinding({ file: "src/util.ts", line: 5, severity: "nice-to-have", category: "style", title: "Inconsistent naming", description: "Variable uses snake_case in camelCase project", evidence: "const user_name = getName()", suggestion: "Use userName" }),
];

describe("generateReport", () => {
	test("filters out findings without evidence", () => {
		const findings = [
			makeFinding({ evidence: "valid evidence" }),
			makeFinding({ evidence: "", title: "No evidence" }),
		];
		const report = generateReport(findings, { format: "markdown", groupBy: "file", includeSuggestions: true }, ["security"]);
		assert.equal(report.findings.length, 1);
		assert.equal(report.findings[0]!.title, "SQL Injection");
	});

	test("builds summary with correct counts", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "markdown", groupBy: "file", includeSuggestions: true }, ["security", "performance"]);
		assert.equal(report.summary.total, 3);
		assert.equal(report.summary.bySeverity["must-fix"], 1);
		assert.equal(report.summary.bySeverity["should-fix"], 1);
		assert.equal(report.summary.bySeverity["nice-to-have"], 1);
	});

	test("sets timestamp", () => {
		const report = generateReport([], { format: "markdown", groupBy: "file", includeSuggestions: true }, []);
		assert.ok(report.timestamp);
	});
});

describe("formatReport - markdown", () => {
	test("group by file", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "markdown", groupBy: "file", includeSuggestions: true }, ["security"]);
		const text = formatReport(report);
		assert.ok(text.includes("Code Review Report"));
		assert.ok(text.includes("src/app.ts"));
		assert.ok(text.includes("src/util.ts"));
		assert.ok(text.includes("SQL Injection"));
	});

	test("group by severity", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "markdown", groupBy: "severity", includeSuggestions: true }, ["security"]);
		const text = formatReport(report);
		assert.ok(text.includes("MUST-FIX"));
		assert.ok(text.includes("SHOULD-FIX"));
	});

	test("group by perspective", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "markdown", groupBy: "perspective", includeSuggestions: true }, ["security"]);
		const text = formatReport(report);
		assert.ok(text.includes("security"));
		assert.ok(text.includes("performance"));
	});

	test("omits suggestions when disabled", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "markdown", groupBy: "file", includeSuggestions: false }, ["security"]);
		const text = formatReport(report);
		assert.ok(!text.includes("Suggestion:"));
	});
});

describe("formatReport - json", () => {
	test("outputs valid JSON", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "json", groupBy: "file", includeSuggestions: true }, ["security"]);
		const text = formatReport(report);
		const parsed = JSON.parse(text);
		assert.ok(parsed.findings);
		assert.ok(parsed.summary);
	});
});

describe("formatReport - summary", () => {
	test("produces concise table", () => {
		const report = generateReport(SAMPLE_FINDINGS, { format: "summary", groupBy: "severity", includeSuggestions: true }, ["security"]);
		const text = formatReport(report);
		assert.ok(text.includes("Review Summary"));
		assert.ok(text.includes("Total"));
	});
});

describe("formatReport - empty findings", () => {
	test("handles empty findings gracefully", () => {
		const report = generateReport([], { format: "markdown", groupBy: "file", includeSuggestions: true }, []);
		const text = formatReport(report);
		assert.ok(text.includes("Total findings:"));
	});
});
