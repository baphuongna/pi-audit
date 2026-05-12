import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { scoreSpecificity, isSpecificEnough } from "../../src/quality/specificity.ts";
import type { ReviewFinding } from "../../src/types.ts";

function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
	return {
		file: "src/app.ts",
		line: 10,
		severity: "should-fix",
		category: "security",
		title: "Missing validation",
		description: "Input is not validated before use",
		evidence: "const id = req.params.id; db.query(`SELECT * FROM t WHERE id = ${id}`)",
		suggestion: "Add input validation: if (!/^[0-9]+$/.test(id)) throw new Error('Invalid id')",
		...overrides,
	};
}

describe("scoreSpecificity", () => {
	test("finding with rich evidence scores high", () => {
		const finding = makeFinding();
		const score = scoreSpecificity(finding);
		assert.ok(score > 0.5, `Expected > 0.5, got ${score}`);
	});

	test("finding with empty evidence scores low", () => {
		const finding = makeFinding({
			evidence: "",
			suggestion: "Fix it",
			description: "Bad code",
			line: 0,
		});
		const score = scoreSpecificity(finding);
		assert.ok(score < 0.3, `Expected < 0.3, got ${score}`);
	});

	test("score is between 0 and 1", () => {
		const lowScore = scoreSpecificity(makeFinding({ evidence: "", description: "", suggestion: "", line: 0 }));
		const highScore = scoreSpecificity(makeFinding());
		assert.ok(lowScore >= 0);
		assert.ok(lowScore <= 1);
		assert.ok(highScore >= 0);
		assert.ok(highScore <= 1);
	});

	test("code snippets boost score", () => {
		const withoutCode = makeFinding({ evidence: "There's an issue here", suggestion: "Fix the problem" });
		const withCode = makeFinding({
			evidence: "`db.query('SELECT * FROM t')` is vulnerable",
			suggestion: "Use `db.query('SELECT * FROM t WHERE id = $1', [id])`",
		});
		assert.ok(scoreSpecificity(withCode) > scoreSpecificity(withoutCode));
	});
});

describe("isSpecificEnough", () => {
	test("returns true for specific findings", () => {
		assert.equal(isSpecificEnough(makeFinding()), true);
	});

	test("returns false for vague findings", () => {
		const finding = makeFinding({
			evidence: "",
			description: "Bad",
			suggestion: "Fix",
			line: 0,
		});
		assert.equal(isSpecificEnough(finding), false);
	});

	test("respects custom threshold", () => {
		const finding = makeFinding({ evidence: "short" });
		// With high threshold, even decent findings may not pass
		assert.equal(isSpecificEnough(finding, 0.9), false);
	});
});
