import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createCategoryAnalyzer } from '../../src/review/category-audit.ts';

describe('Category Audit', () => {
  const analyzer = createCategoryAnalyzer();

  it('adds findings with categories', () => {
    analyzer.add({
      category: 'security',
      severity: 'critical',
      title: 'SQL Injection',
      description: 'Found SQL injection vulnerability'
    });
    
    const findings = analyzer.byCategory('security');
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].severity, 'critical');
  });

  it('filters by severity', () => {
    analyzer.clear();
    analyzer.add({ category: 'security', severity: 'critical', title: 'Crit' });
    analyzer.add({ category: 'security', severity: 'low', title: 'Low' });
    
    const critical = analyzer.bySeverity('critical');
    assert.strictEqual(critical.length, 1);
  });

  it('generates summary', () => {
    analyzer.clear();
    analyzer.add({ category: 'security', severity: 'high', title: '1' });
    analyzer.add({ category: 'security', severity: 'high', title: '2' });
    analyzer.add({ category: 'performance', severity: 'medium', title: '3' });
    
    const summary = analyzer.getSummary();
    assert.strictEqual(summary.length, 2);
    
    const security = summary.find(s => s.category === 'security');
    assert.strictEqual(security?.count, 2);
    assert.strictEqual(security?.bySeverity.high, 2);
  });

  it('generates markdown report', () => {
    analyzer.clear();
    analyzer.add({ category: 'security', severity: 'high', title: 'Issue', description: 'Desc' });
    
    const report = analyzer.generateReport();
    assert.ok(report.includes('# Audit Report'));
    assert.ok(report.includes('Security'));
  });
});
