import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { PerspectiveRegistry } from "../../src/perspectives/registry.ts";
import type { PerspectiveDefinition } from "../../src/types.ts";

// We need to import the perspective modules to trigger registration
import "../../src/perspectives/security.ts";
import "../../src/perspectives/performance.ts";
import "../../src/perspectives/maintainability.ts";
import "../../src/perspectives/style.ts";
import "../../src/perspectives/testing.ts";
import "../../src/perspectives/production.ts";
import { registry } from "../../src/perspectives/registry.ts";

describe("perspective registration", () => {
	test("all 6 perspectives are registered", () => {
		const names = registry.names();
		assert.ok(names.includes("security"));
		assert.ok(names.includes("performance"));
		assert.ok(names.includes("maintainability"));
		assert.ok(names.includes("style"));
		assert.ok(names.includes("testing"));
		assert.ok(names.includes("production"));
		assert.equal(names.length, 6);
	});

	test("each perspective has non-empty checklist", () => {
		for (const p of registry.list()) {
			assert.ok(p.checklist.length > 0, `${p.name} has empty checklist`);
			for (const item of p.checklist) {
				assert.ok(item.length > 0, `${p.name} has empty checklist item`);
			}
		}
	});

	test("security perspective has threat model", () => {
		const sec = registry.get("security");
		assert.ok(sec);
		assert.ok(sec!.threatModel);
		assert.ok(Object.keys(sec!.threatModel!).length > 0);
	});

	test("get returns undefined for unknown perspective", () => {
		assert.equal(registry.get("nonexistent"), undefined);
	});

	test("filterByNames returns matching perspectives", () => {
		const filtered = registry.filterByNames(["security", "performance"]);
		assert.equal(filtered.length, 2);
	});

	test("filterByNames with empty array returns all", () => {
		const all = registry.filterByNames([]);
		assert.equal(all.length, 6);
	});

	test("filterByNames with undefined returns all", () => {
		const all = registry.filterByNames();
		assert.equal(all.length, 6);
	});
});

describe("PerspectiveRegistry class", () => {
	test("buildPromptContext generates checklist", () => {
		const local = new PerspectiveRegistry();
		const def: PerspectiveDefinition = {
			name: "test",
			label: "Test Perspective",
			description: "A test perspective",
			checklist: ["Item 1?", "Item 2?"],
			defaultSeverity: "should-fix",
		};
		local.register(def);

		const ctx = local.buildPromptContext(def, []);
		assert.ok(ctx.includes("Test Perspective"));
		assert.ok(ctx.includes("Item 1?"));
		assert.ok(ctx.includes("Item 2?"));
	});

	test("buildPromptContext includes hunks", () => {
		const local = new PerspectiveRegistry();
		const def: PerspectiveDefinition = {
			name: "test",
			label: "Test",
			description: "Test",
			checklist: ["Item?"],
			defaultSeverity: "info",
		};
		local.register(def);

		const hunks = [
			{ file: "a.ts", changeType: "modified" as const, oldStart: 1, oldCount: 1, newStart: 1, newCount: 2, content: "+new line", header: "" },
			{ file: "a.ts", changeType: "modified" as const, oldStart: 5, oldCount: 1, newStart: 6, newCount: 1, content: "-old line", header: "" },
			{ file: "b.ts", changeType: "new" as const, oldStart: 0, oldCount: 0, newStart: 1, newCount: 5, content: "+all new", header: "" },
		];
		const ctx = local.buildPromptContext(def, hunks);
		assert.ok(ctx.includes("a.ts"));
		assert.ok(ctx.includes("b.ts"));
		assert.ok(ctx.includes("2 hunks"));
	});

	test("clear removes all perspectives", () => {
		const local = new PerspectiveRegistry();
		local.register({ name: "x", label: "X", description: "", checklist: ["a?"], defaultSeverity: "info" });
		assert.equal(local.list().length, 1);
		local.clear();
		assert.equal(local.list().length, 0);
	});
});
