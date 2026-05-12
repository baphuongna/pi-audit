import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { extractContext } from "../../src/diff/context-extractor.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { DiffHunk } from "../../src/types.ts";

function makeHunk(overrides: Partial<DiffHunk> = {}): DiffHunk {
	return {
		file: "test.ts",
		changeType: "modified",
		oldStart: 1,
		oldCount: 3,
		newStart: 1,
		newCount: 5,
		content: "+line1\n+line2",
		header: "",
		...overrides,
	};
}

describe("extractContext", () => {
	test("extracts context from existing file", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-ctx-"));
		try {
			const filePath = path.join(dir, "test.ts");
			const lines = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
			fs.writeFileSync(filePath, lines.join("\n"));

			const hunks = [makeHunk({ file: "test.ts", newStart: 5, newCount: 3 })];
			const contexts = extractContext("test.ts", hunks, dir, 3, 3);

			assert.equal(contexts.length, 1);
			assert.equal(contexts[0]!.hunkIndex, 0);
			assert.ok(contexts[0]!.beforeLines.length <= 3);
			assert.ok(contexts[0]!.hunkLines.length > 0);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("returns empty for non-existent file", () => {
		const hunks = [makeHunk({ file: "nonexistent.ts" })];
		const contexts = extractContext("nonexistent.ts", hunks, "/tmp", 3, 3);
		assert.equal(contexts.length, 0);
	});

	test("handles hunk at start of file", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-ctx-"));
		try {
			const filePath = path.join(dir, "test.ts");
			fs.writeFileSync(filePath, "first line\nsecond line\nthird line\n");

			const hunks = [makeHunk({ file: "test.ts", newStart: 1, newCount: 2 })];
			const contexts = extractContext("test.ts", hunks, dir, 5, 5);

			assert.equal(contexts.length, 1);
			assert.equal(contexts[0]!.beforeLines.length, 0);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("handles multiple hunks", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-ctx-"));
		try {
			const filePath = path.join(dir, "test.ts");
			const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);
			fs.writeFileSync(filePath, lines.join("\n"));

			const hunks = [
				makeHunk({ file: "test.ts", newStart: 5, newCount: 3 }),
				makeHunk({ file: "test.ts", newStart: 30, newCount: 5 }),
			];
			const contexts = extractContext("test.ts", hunks, dir, 2, 2);

			assert.equal(contexts.length, 2);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});
});
