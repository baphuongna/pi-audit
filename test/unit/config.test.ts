import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { loadConfig, DEFAULT_CONFIG, deepMerge } from "../../src/config.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("loadConfig", () => {
	test("returns defaults when no config file exists", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-test-"));
		try {
			const { config, source } = loadConfig(dir);
			assert.equal(source, "defaults");
			assert.equal(config.enabled, true);
			assert.equal(config.quality.rejectGeneric, true);
			assert.equal(config.quality.requireEvidence, true);
			assert.equal(config.quality.minFindingsPerFile, 1);
			assert.equal(config.autoReview.onEdit, false);
			assert.equal(config.autoReview.onCommit, true);
			assert.equal(config.autoReview.onPR, true);
			assert.equal(config.perspectives.security.enabled, true);
			assert.equal(config.perspectives.production.enabled, false);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("reads .pi/pi-audit.json", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-test-"));
		try {
			fs.mkdirSync(path.join(dir, ".pi"), { recursive: true });
			fs.writeFileSync(path.join(dir, ".pi", "pi-audit.json"), JSON.stringify({
				enabled: false,
				quality: { rejectGeneric: false, minFindingsPerFile: 3 },
				autoReview: { onEdit: true, onCommit: false },
			}));
			const { config, source } = loadConfig(dir);
			assert.equal(source, "file");
			assert.equal(config.enabled, false);
			assert.equal(config.quality.rejectGeneric, false);
			assert.equal(config.quality.minFindingsPerFile, 3);
			assert.equal(config.autoReview.onEdit, true);
			assert.equal(config.autoReview.onCommit, false);
			// Defaults preserved
			assert.equal(config.quality.requireEvidence, true);
			assert.equal(config.autoReview.onPR, true);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("handles malformed JSON gracefully", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-test-"));
		try {
			fs.mkdirSync(path.join(dir, ".pi"), { recursive: true });
			fs.writeFileSync(path.join(dir, ".pi", "pi-audit.json"), "not json {{{");
			const { config, source } = loadConfig(dir);
			assert.equal(source, "defaults");
			assert.equal(config.enabled, true);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("merges custom perspectives", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-test-"));
		try {
			fs.mkdirSync(path.join(dir, ".pi"), { recursive: true });
			fs.writeFileSync(path.join(dir, ".pi", "pi-audit.json"), JSON.stringify({
				perspectives: {
					security: { enabled: false },
					production: { enabled: true, severity: "must-fix" },
				},
			}));
			const { config } = loadConfig(dir);
			assert.equal(config.perspectives.security!.enabled, false);
			assert.equal(config.perspectives.production!.enabled, true);
			assert.equal(config.perspectives.production!.severity, "must-fix");
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("deep-merges nested objects: override perspective without losing siblings", () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-review-test-"));
		try {
			fs.mkdirSync(path.join(dir, ".pi"), { recursive: true });
			fs.writeFileSync(path.join(dir, ".pi", "pi-audit.json"), JSON.stringify({
				quality: { minFindingsPerFile: 5 },
			}));
			const { config } = loadConfig(dir);
			// Deep merge: only minFindingsPerFile overridden, siblings preserved
			assert.equal(config.quality.minFindingsPerFile, 5);
			assert.equal(config.quality.rejectGeneric, true);
			assert.equal(config.quality.requireEvidence, true);
		} finally {
			fs.rmSync(dir, { recursive: true });
		}
	});

	test("deepMerge utility exports and works correctly", () => {
		const base = { a: 1, b: { c: 2, d: 3 }, e: [1, 2] };
		const override = { b: { c: 99 }, f: 10 };
		const result = deepMerge(base as Record<string, unknown>, override) as Record<string, unknown>;
		assert.equal(result.a, 1);
		assert.equal((result.b as Record<string, unknown>).c, 99);
		assert.equal((result.b as Record<string, unknown>).d, 3); // sibling preserved
		assert.equal(result.f, 10);
	});
});
