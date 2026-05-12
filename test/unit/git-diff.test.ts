import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { extractDiff, extractFileDiff } from "../../src/diff/git-diff.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";

async function initGitRepo(dir: string): Promise<void> {
	execSync("git init", { cwd: dir });
	execSync("git config user.email test@test.com", { cwd: dir });
	execSync("git config user.name Test", { cwd: dir });
	fs.writeFileSync(path.join(dir, "a.ts"), "line1\nline2\nline3\n");
	execSync("git add .", { cwd: dir });
	execSync("git commit -m initial", { cwd: dir });
}

describe("extractDiff", () => {
	test("returns diff for changed files", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-git-"));
		try {
			await initGitRepo(dir);
			fs.writeFileSync(path.join(dir, "a.ts"), "line1\nmodified\nline3\n");
			execSync("git add .", { cwd: dir });
			execSync("git commit -m change", { cwd: dir });

			const diff = await extractDiff({ cwd: dir, base: "HEAD~1", head: "HEAD" });
			assert.ok(diff.includes("a.ts"));
			assert.ok(diff.includes("modified"));
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	test("returns empty string for no changes", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-git-"));
		try {
			await initGitRepo(dir);

			// HEAD~1 same as HEAD = no diff
			const diff = await extractDiff({ cwd: dir, base: "HEAD", head: "HEAD" });
			assert.equal(diff.trim(), "");
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe("extractFileDiff", () => {
	test("returns diff for specific file", async () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-git-"));
		try {
			await initGitRepo(dir);
			fs.writeFileSync(path.join(dir, "a.ts"), "new content\n");
			execSync("git add .", { cwd: dir });
			execSync("git commit -m change", { cwd: dir });

			const diff = await extractFileDiff(dir, "a.ts", "HEAD~1");
			assert.ok(diff.includes("a.ts"));
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});
