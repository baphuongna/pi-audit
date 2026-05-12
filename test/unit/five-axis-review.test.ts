import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FiveAxisReviewer } from '../../src/review/five-axis-review.ts';

describe('FiveAxisReviewer', () => {
  let reviewer: FiveAxisReviewer;

  beforeEach(() => {
    reviewer = new FiveAxisReviewer();
  });

  describe('review', () => {
    it('should review clean code with high score', async () => {
      const code = `
function add(a: number, b: number): number {
  return a + b;
}
const result = add(1, 2);
      `.trim();

      const result = await reviewer.review(code, { files: ['test.ts'], language: 'typescript' });

      assert.ok(result.axes);
      assert.ok(result.overall);
      assert.ok(result.overall.score >= 70);
    });

    it('should detect missing null checks', async () => {
      const code = `
function getName(user: any) {
  return user.name.toUpperCase();
}
      `.trim();

      const result = await reviewer.review(code, { files: ['test.ts'], language: 'typescript' });

      const nullAccessIssues = result.axes.correctness.issues.filter(
        i => i.message.includes('null access')
      );
      assert.ok(nullAccessIssues.length > 0, 'Should detect potential null access');
    });

    it('should detect hardcoded secrets', async () => {
      const code = `
const apiKey = "sk-1234567890abcdef";
const password = "secret123";
      `.trim();

      const result = await reviewer.review(code, { files: ['config.ts'], language: 'typescript' });

      const secretIssues = result.axes.security.issues.filter(
        i => i.severity === 'critical' && i.message.includes('secret')
      );
      assert.ok(secretIssues.length >= 2, 'Should detect hardcoded secrets');
    });

    it('should catch security issues', async () => {
      const code = `
// SQL-like concatenation
const sql = "SELECT * FROM users WHERE id = " + req.params.id;
eval(userInput);
      `.trim();

      const result = await reviewer.review(code, { files: ['db.ts'], language: 'typescript' });

      // Should find at least eval (security issue)
      assert.ok(result.axes.security.issues.length > 0, 'Should detect security issues');
    });

    it('should detect magic numbers', async () => {
      const code = `
function process() {
  const timeout = 300000;
  return timeout * 1000;
}
      `.trim();

      const result = await reviewer.review(code, { files: ['config.ts'], language: 'typescript' });

      const magicIssues = result.axes.readability.issues.filter(
        i => i.message.includes('Magic number')
      );
      assert.ok(magicIssues.length > 0, 'Should detect magic numbers');
    });
  });

  describe('formatReport', () => {
    it('should format review as markdown', async () => {
      const code = 'const x = 1;';
      const result = await reviewer.review(code, { files: ['test.ts'], language: 'typescript' });

      const report = reviewer.formatReport(result);

      assert.ok(report.includes('Code Review Report'));
      assert.ok(report.includes('Overall Score'));
      assert.ok(report.includes('Five-Axis Breakdown'));
    });
  });
});
