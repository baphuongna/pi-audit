import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import { createAuditTrail } from '../../src/audit/audit-trail.ts';

describe('Audit Trail', () => {
  const testFile = '/tmp/test-audit.jsonl';
  const trail = createAuditTrail({ filePath: testFile });

  afterEach(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  it('logs entries', () => {
    const entry = trail.log({ kind: 'test', response: 'test response' });
    assert.ok(entry.id);
    assert.strictEqual(entry.kind, 'test');
  });

  it('logs model calls', () => {
    const entry = trail.logModelCall('claude-3', 'prompt', 'response');
    assert.strictEqual(entry.kind, 'model_call');
    assert.strictEqual(entry.model, 'claude-3');
  });

  it('logs tool calls', () => {
    const entry = trail.logToolCall('bash', 0);
    assert.strictEqual(entry.kind, 'tool_call');
    assert.strictEqual(entry.tool_name, 'bash');
  });

  it('reads entries', () => {
    trail.log({ kind: 'test1', response: '1' });
    trail.log({ kind: 'test2', response: '2' });
    const entries = trail.readAll();
    assert.strictEqual(entries.length, 2);
  });

  it('gets recent entries', () => {
    for (let i = 0; i < 5; i++) {
      trail.log({ kind: 'test', response: String(i) });
    }
    const recent = trail.recent(3);
    assert.strictEqual(recent.length, 3);
  });

  it('gets statistics', () => {
    trail.log({ kind: 'model', response: '1' });
    trail.log({ kind: 'model', response: '2' });
    trail.log({ kind: 'tool', response: '3' });
    const stats = trail.getStats();
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.byKind.model, 2);
    assert.strictEqual(stats.byKind.tool, 1);
  });
});
