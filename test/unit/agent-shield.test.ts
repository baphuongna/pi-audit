import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentShield } from '../../src/security/agent-shield.ts';

describe('AgentShield', () => {
  it('should pass clean code', () => {
    const shield = new AgentShield();
    const code = 'const x = 1;\nfunction hello() { return "world"; }';
    const result = shield.scan(code);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.issues.length, 0);
  });

  it('should detect eval()', () => {
    const shield = new AgentShield();
    const code = 'eval(userInput)';
    const result = shield.scan(code);
    // Should find issues (might not be 'eval' in the rule name)
    assert.ok(result.issues.length > 0, 'Should detect issues in eval code');
  });

  it('should detect hardcoded secrets', () => {
    const shield = new AgentShield();
    const code = 'const apiKey = "sk-1234567890abcdef";';
    const result = shield.scan(code);
    // Should fail for API key
    assert.strictEqual(result.passed, false);
  });

  it('should handle empty code', () => {
    const shield = new AgentShield();
    const result = shield.scan('');
    assert.strictEqual(result.passed, true);
  });

  it('should scan multiple languages', () => {
    const shield = new AgentShield();
    
    const jsCode = 'eval("console.log(1)")';
    const pythonCode = 'print("hello")';
    const goCode = 'fmt.Println("hello")';
    
    const jsResult = shield.scan(jsCode, 'javascript');
    const pyResult = shield.scan(pythonCode, 'python');
    const goResult = shield.scan(goCode, 'go');
    
    // Each should return a result object
    assert.ok(jsResult, 'Should return result for JS');
    assert.ok(pyResult, 'Should return result for Python');
    assert.ok(goResult, 'Should return result for Go');
    
    // JS should find eval issue
    assert.ok(jsResult.issues.length > 0, 'Should detect JS issues');
  });

  it('should format report as markdown', () => {
    const shield = new AgentShield();
    const code = 'eval("alert(1)")';
    const result = shield.scan(code);
    const report = shield.formatReport(result);
    
    assert.ok(report.includes('Security Scan Report'));
    assert.ok(report.includes('Critical'));
    assert.ok(report.includes('High'));
  });
});
