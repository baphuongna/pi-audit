import assert from "node:assert/strict";
import test from "node:test";
import { isMutatingToolCall, evaluateMutationGuard, checkReviewMutationResult } from "../../src/guard/completion-guard.ts";

test("isMutatingToolCall - detects mutating tools", () => {
  assert.strictEqual(isMutatingToolCall("edit"), true);
  assert.strictEqual(isMutatingToolCall("write"), true);
  assert.strictEqual(isMutatingToolCall("delete_files"), true);
  assert.strictEqual(isMutatingToolCall("read"), false);
  assert.strictEqual(isMutatingToolCall("grep"), false);
});

test("isMutatingToolCall - detects mutating bash commands", () => {
  assert.strictEqual(isMutatingToolCall("bash", "rm -rf /tmp/test"), true);
  assert.strictEqual(isMutatingToolCall("bash", "git commit -m 'fix'"), true);
  assert.strictEqual(isMutatingToolCall("bash", "cat file.txt"), false);
});

test("evaluateMutationGuard - expects mutation for executor", () => {
  const result = evaluateMutationGuard("executor", '{"toolName":"edit"}');
  assert.strictEqual(result.expectsMutation, true);
  assert.strictEqual(result.observedMutation, true);
});

test("evaluateMutationGuard - no mutation expected for reviewer", () => {
  const result = evaluateMutationGuard("reviewer", '{"toolName":"bash","args":"grep test"}');
  assert.strictEqual(result.expectsMutation, false);
});

test("checkReviewMutationResult - strict mode requires mutation", () => {
  const result = checkReviewMutationResult("Reviewed the code, looks good", { strict: true });
  assert.strictEqual(result.passed, false);
});

test("checkReviewMutationResult - passes with mutation indicators", () => {
  const result = checkReviewMutationResult("Fixed the bug by updating config");
  assert.strictEqual(result.passed, true);
});
