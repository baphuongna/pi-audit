import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { isGenericReview, GENERIC_PHRASES, rejectGenericFindings } from "../../src/quality/anti-generic.ts";
import type { ReviewFinding } from "../../src/types.ts";

function makeFinding(title: string, description: string): ReviewFinding {
	return {
		file: "a.ts",
		line: 1,
		severity: "info",
		category: "style",
		title,
		description,
		evidence: "code snippet",
		suggestion: "fix it",
	};
}

describe("isGenericReview", () => {
	test("detects LGTM", () => {
		assert.equal(isGenericReview("LGTM"), true);
	});

	test("detects looks good to me", () => {
		assert.equal(isGenericReview("This looks good to me, nice work!"), true);
	});

	test("does not flag specific review", () => {
		assert.equal(isGenericReview("The SQL injection on line 42 should use parameterized queries instead of string concatenation."), false);
	});

	test("does not flag long text containing generic phrase", () => {
		const longText = "LGTM but I found a critical issue: the authentication middleware is missing CSRF token validation which could allow cross-site request forgery attacks. Additionally, the password hashing uses MD5 which is cryptographically broken.";
		assert.equal(isGenericReview(longText), false);
	});

	test("detects empty string", () => {
		assert.equal(isGenericReview(""), false);
	});

	test("detects 'no issues found'", () => {
		assert.equal(isGenericReview("no issues found"), true);
	});
});

describe("rejectGenericFindings", () => {
	test("filters out generic findings", () => {
		const findings = [
			makeFinding("LGTM", "code is clean"),
			makeFinding("SQL Injection", "User input used in query without parameterization"),
		];
		const { valid, rejected } = rejectGenericFindings(findings);
		assert.equal(valid.length, 1);
		assert.equal(rejected.length, 1);
		assert.equal(valid[0]!.title, "SQL Injection");
	});

	test("returns all valid when none are generic", () => {
		const findings = [
			makeFinding("Hardcoded secret", "API key found in source code"),
			makeFinding("Missing test", "No test coverage for new function"),
		];
		const { valid, rejected } = rejectGenericFindings(findings);
		assert.equal(valid.length, 2);
		assert.equal(rejected.length, 0);
	});
});

describe("GENERIC_PHRASES", () => {
	test("has expected phrases", () => {
		assert.ok(GENERIC_PHRASES.includes("LGTM"));
		assert.ok(GENERIC_PHRASES.includes("looks good to me"));
		assert.ok(GENERIC_PHRASES.includes("nice work"));
	});
});
