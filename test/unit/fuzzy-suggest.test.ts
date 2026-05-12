import assert from "node:assert/strict";
import test from "node:test";
import { levenshtein, findClosestKey, suggestMultiple, SecurityRuleSuggester } from "../../src/suggest/fuzzy-suggest.ts";

test("levenshtein - edit distance", () => {
  assert.strictEqual(levenshtein("kitten", "sitting"), 3);
  assert.strictEqual(levenshtein("", "abc"), 3);
  assert.strictEqual(levenshtein("abc", ""), 3);
  assert.strictEqual(levenshtein("abc", "abc"), 0);
  assert.strictEqual(levenshtein("flaw", "lawn"), 2);
});

test("findClosestKey - exact match", () => {
  const keys = ["pi-audit", "pi-smart", "pi-pipeline", "pi-recollect"];
  assert.strictEqual(findClosestKey("pi-audit", keys), "pi-audit");
});

test("findClosestKey - typo match", () => {
  const keys = ["pi-audit", "pi-smart", "pi-pipeline", "pi-recollect"];
  assert.strictEqual(findClosestKey("pi-audti", keys), "pi-audit");
  assert.strictEqual(findClosestKey("pi-audit", keys, 1), "pi-audit");
});

test("findClosestKey - no match returns null", () => {
  const keys = ["pi-audit", "pi-smart", "pi-pipeline", "pi-recollect"];
  assert.strictEqual(findClosestKey("xyz", keys), null);
});

test("findClosestKey - case insensitive", () => {
  const keys = ["pi-audit", "pi-smart", "pi-pipeline", "pi-recollect"];
  assert.strictEqual(findClosestKey("PI-AUDIT", keys), "pi-audit");
});

test("suggestMultiple - returns matches", () => {
  const keys = ["pi-audit", "pi-smart", "pi-pipeline", "pi-recollect"];
  const matches = suggestMultiple("pi-audit", keys, 3, 3);
  assert.ok(matches.length > 0);
  assert.strictEqual(matches[0].key, "pi-audit");
  assert.strictEqual(matches[0].distance, 0);
});

test("SecurityRuleSuggester - suggest exact match (lowercase stored)", () => {
  const suggester = new SecurityRuleSuggester();
  suggester.register("AUTH-001", "authentication", "Check JWT validity");
  const result = suggester.suggest("AUTH-001");
  assert.ok(result);
  assert.strictEqual(result!.rule, "auth-001"); // Stored as lowercase
  assert.strictEqual(result!.distance, 0);
  assert.strictEqual(result!.category, "authentication");
});

test("SecurityRuleSuggester - suggest typo match", () => {
  const suggester = new SecurityRuleSuggester();
  suggester.register("AUTH-001", "authentication", "Check JWT validity");
  const result = suggester.suggest("AUTH-01");
  assert.ok(result);
  assert.strictEqual(result!.rule, "auth-001");
  assert.strictEqual(result!.category, "authentication");
});

test("SecurityRuleSuggester - no match returns null", () => {
  const suggester = new SecurityRuleSuggester();
  suggester.register("AUTH-001", "authentication", "Check JWT validity");
  const result = suggester.suggest("UNKNOWN");
  assert.strictEqual(result, null);
});

test("SecurityRuleSuggester - get by category", () => {
  const suggester = new SecurityRuleSuggester();
  suggester.registerBatch([
    { id: "AUTH-001", category: "authentication", description: "Check JWT" },
    { id: "AUTH-002", category: "authentication", description: "Check token" },
    { id: "SQL-001", category: "injection", description: "Prevent SQL injection" },
  ]);
  const rules = suggester.getByCategory("authentication");
  assert.strictEqual(rules.length, 2);
  assert.ok(rules.includes("auth-001"));
  assert.ok(rules.includes("auth-002"));
});
