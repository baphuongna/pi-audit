import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { validateFindingsHaveEvidence, formatEvidenceError } from "../../src/quality/evidence-required.ts";
import type { ReviewFinding } from "../../src/types.ts";

function makeFinding(evidence: string): ReviewFinding {
	return {
		file: "src/app.ts",
		line: 42,
		severity: "must-fix",
		category: "security",
		title: "SQL Injection",
		description: "User input not sanitized",
		evidence,
		suggestion: "Use parameterized queries",
	};
}

describe("validateFindingsHaveEvidence", () => {
	test("findings with evidence are valid", () => {
		const findings = [makeFinding("db.query(`SELECT * FROM t WHERE id = ${id}`)")];
		const { valid, invalid } = validateFindingsHaveEvidence(findings);
		assert.equal(valid.length, 1);
		assert.equal(invalid.length, 0);
	});

	test("findings without evidence are invalid", () => {
		const findings = [makeFinding("")];
		const { valid, invalid } = validateFindingsHaveEvidence(findings);
		assert.equal(valid.length, 0);
		assert.equal(invalid.length, 1);
	});

	test("findings with whitespace-only evidence are invalid", () => {
		const findings = [makeFinding("   ")];
		const { valid, invalid } = validateFindingsHaveEvidence(findings);
		assert.equal(valid.length, 0);
		assert.equal(invalid.length, 1);
	});

	test("mixed findings are correctly separated", () => {
		const findings = [
			makeFinding("code evidence"),
			makeFinding(""),
			makeFinding("more evidence"),
		];
		const { valid, invalid } = validateFindingsHaveEvidence(findings);
		assert.equal(valid.length, 2);
		assert.equal(invalid.length, 1);
	});
});

describe("formatEvidenceError", () => {
	test("formats error message with finding details", () => {
		const finding = makeFinding("");
		const msg = formatEvidenceError(finding);
		assert.ok(msg.includes("SQL Injection"));
		assert.ok(msg.includes("src/app.ts"));
		assert.ok(msg.includes("42"));
		assert.ok(msg.includes("evidence"));
	});
});
