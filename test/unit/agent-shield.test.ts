import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentShield } from '../../src/security/agent-shield.ts';

describe('AgentShield', () => {
  let shield: AgentShield;

  beforeEach(() => {
    shield = new AgentShield();
  });

  describe('scan', () => {
    it('should pass clean code', () => {
      const code = 'const x = 1;\nfunction hello() { return "world"; }';
      const result = shield.scan(code);
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.issues.length, 0);
    });

    it('should detect eval()', () => {
      const code = 'eval(userInput)';
      const result = shield.scan(code);
      assert.strictEqual(result.passed, false);
      assert.ok(result.issues.some(i => i.category === 'Injection'));
    });

    it('should detect innerHTML', () => {
      const code = 'element.innerHTML = userContent';
      const result = shield.scan(code);
      assert.ok(result.issues.some(i => i.category === 'XSS'));
    });

    it('should detect hardcoded passwords', () => {
      const code = 'const password = "secret123"';
      const result = shield.scan(code);
      assert.ok(result.issues.some(i => i.category === 'Sensitive Data'));
    });

    it('should detect exec()', () => {
      const code = 'child_process.exec(command)';
      const result = shield.scan(code);
      assert.ok(result.issues.some(i => i.category === 'Command Injection'));
    });

    it('should count by severity', () => {
      const code = 'eval(input); eval(input);';
      const result = shield.scan(code);
      assert.ok(result.summary.critical >= 1);
    });
  });

  describe('formatReport', () => {
    it('should format report as markdown', () => {
      const code = 'eval("dangerous")';
      const result = shield.scan(code);
      const report = shield.formatReport(result);
      
      assert.ok(report.includes('Security Scan Report'));
      assert.ok(report.includes('FAILED'));
    });
  });

  describe('addRule', () => {
    it('should add custom rule', () => {
      shield.addRule({
        pattern: /custom-danger/g,
        severity: 'high',
        category: 'Custom',
        message: 'Custom security issue',
        suggestion: 'Fix this'
      });

      const code = 'custom-danger';
      const result = shield.scan(code);
      assert.ok(result.issues.some(i => i.category === 'Custom'));
    });
  });
});
