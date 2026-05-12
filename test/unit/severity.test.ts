import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { compareSeverity, severityBadge, severityLabel, sortSeverities, isHighSeverity, allSeverities } from "../../src/review/severity.ts";

describe("severity", () => {
	test("compareSeverity orders must-fix highest", () => {
		assert.ok(compareSeverity("must-fix", "should-fix") < 0);
		assert.ok(compareSeverity("should-fix", "nice-to-have") < 0);
		assert.ok(compareSeverity("nice-to-have", "info") < 0);
	});

	test("compareSeverity returns 0 for same severity", () => {
		assert.equal(compareSeverity("must-fix", "must-fix"), 0);
	});

	test("severityBadge returns emoji + label", () => {
		assert.ok(severityBadge("must-fix").includes("must-fix"));
		assert.ok(severityBadge("should-fix").includes("should-fix"));
	});

	test("severityLabel returns uppercased", () => {
		assert.ok(severityLabel("must-fix").includes("MUST-FIX"));
	});

	test("sortSeverities sorts descending", () => {
		const sorted = sortSeverities(["info", "must-fix", "should-fix"]);
		assert.deepEqual(sorted, ["must-fix", "should-fix", "info"]);
	});

	test("isHighSeverity for must-fix and should-fix", () => {
		assert.equal(isHighSeverity("must-fix"), true);
		assert.equal(isHighSeverity("should-fix"), true);
		assert.equal(isHighSeverity("nice-to-have"), false);
		assert.equal(isHighSeverity("info"), false);
	});

	test("allSeverities returns 4 entries", () => {
		assert.equal(allSeverities().length, 4);
	});
});
