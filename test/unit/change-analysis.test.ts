import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { classifyChanges, allHunks } from "../../src/diff/change-analysis.ts";

const SAMPLE_DIFF = `diff --git a/src/app.ts b/src/app.ts
index abc1234..def5678 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,5 +10,8 @@ function processUser(user) {
-  const id = user.id;
-  db.query("SELECT * FROM users WHERE id = " + id);
+  const id = validateId(user.id);
+  db.query("SELECT * FROM users WHERE id = $1", [id]);
+  logger.info("User processed", { id });
+
diff --git a/src/new-file.ts b/src/new-file.ts
new file mode 100644
--- /dev/null
+++ b/src/new-file.ts
@@ -0,0 +1,5 @@
+export function validateId(id: string): string {
+  if (!/^[0-9]+$/.test(id)) {
+    throw new Error("Invalid ID");
+  }
+  return id;
+}
diff --git a/src/old-file.ts b/src/old-file.ts
deleted file mode 100644
--- a/src/old-file.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-old line 1
-old line 2
-old line 3
diff --git a/old/name.ts b/new/name.ts
similarity index 100%
rename from old/name.ts
rename to new/name.ts`;

describe("classifyChanges", () => {
	test("parses empty diff", () => {
		assert.deepEqual(classifyChanges(""), []);
		assert.deepEqual(classifyChanges("   "), []);
	});

	test("parses multiple files", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		assert.equal(parsed.length, 4);
	});

	test("classifies modified file", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const app = parsed.find((p) => p.file === "src/app.ts");
		assert.ok(app);
		assert.equal(app!.changeType, "modified");
	});

	test("classifies new file", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const newFile = parsed.find((p) => p.file === "src/new-file.ts");
		assert.ok(newFile);
		assert.equal(newFile!.changeType, "new");
	});

	test("classifies deleted file", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const del = parsed.find((p) => p.file === "src/old-file.ts");
		assert.ok(del);
		assert.equal(del!.changeType, "deleted");
	});

	test("classifies renamed file", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const renamed = parsed.find((p) => p.changeType === "renamed");
		assert.ok(renamed);
	});

	test("extracts hunks with correct line numbers", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const app = parsed.find((p) => p.file === "src/app.ts");
		assert.ok(app);
		assert.equal(app!.hunks.length, 1);
		assert.equal(app!.hunks[0]!.oldStart, 10);
		assert.equal(app!.hunks[0]!.newStart, 10);
	});

	test("hunks contain content lines", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const app = parsed.find((p) => p.file === "src/app.ts");
		assert.ok(app);
		const content = app!.hunks[0]!.content;
		assert.ok(content.includes("+  const id = validateId"));
		assert.ok(content.includes("-  db.query"));
	});
});

describe("allHunks", () => {
	test("flattens all hunks from all files", () => {
		const parsed = classifyChanges(SAMPLE_DIFF);
		const hunks = allHunks(parsed);
		assert.ok(hunks.length >= 3);
	});
});
