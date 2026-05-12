/**
 * Five-Axis Code Review
 * Based on agent-skills /code-review-and-quality pattern
 * Multi-dimensional review: Correctness, Readability, Architecture, Security, Performance
 */

import { AgentShield } from '../security/agent-shield.ts';

export interface ReviewAxes {
  correctness: AxisResult;
  readability: AxisResult;
  architecture: AxisResult;
  security: AxisResult;
  performance: AxisResult;
}

export interface AxisResult {
  score: number; // 0-100
  issues: ReviewIssue[];
  positives: string[];
  verdict: 'pass' | 'needs-work' | 'fail';
}

export interface ReviewIssue {
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  line?: number;
  message: string;
  suggestion?: string;
}

export interface CodeReviewResult {
  axes: ReviewAxes;
  overall: {
    score: number;
    verdict: 'approve' | 'request-changes' | 'reject';
    summary: string;
  };
  recommendations: string[];
}

export interface ReviewContext {
  files: string[];
  language: 'typescript' | 'python' | 'go' | 'rust' | 'java';
  scope?: 'minor' | 'standard' | 'extensive';
}

/**
 * Five-Axis Code Reviewer
 */
export class FiveAxisReviewer {
  private shield: AgentShield;

  constructor() {
    this.shield = new AgentShield();
  }

  /**
   * Review code across all five axes
   */
  async review(code: string, context: ReviewContext): Promise<CodeReviewResult> {
    // Run all axes in parallel
    const [correctness, readability, architecture, security, performance] =
      await Promise.all([
        this.reviewCorrectness(code, context),
        this.reviewReadability(code, context),
        this.reviewArchitecture(code, context),
        this.reviewSecurity(code, context),
        this.reviewPerformance(code, context),
      ]);

    const axes: ReviewAxes = {
      correctness,
      readability,
      architecture,
      security,
      performance,
    };

    // Calculate overall
    const overall = this.calculateOverall(axes);

    // Generate recommendations
    const recommendations = this.generateRecommendations(axes);

    return { axes, overall, recommendations };
  }

  /**
   * 1. Correctness Review
   * Does the code do what it claims?
   */
  private async reviewCorrectness(
    code: string,
    context: ReviewContext
  ): Promise<AxisResult> {
    const issues: ReviewIssue[] = [];
    const positives: string[] = [];

    const lines = code.split('\n');

    // Check for common correctness issues
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Null/undefined checks
      if (line.includes('.') && !line.includes('?.') && !line.includes('null') && !line.includes('undefined')) {
        // Potential null access - check if it's a variable
        const match = line.match(/(\w+)\.\w+\(/);
        if (match) {
          const varName = match[1];
          if (!this.isCheckedVariable(varName, lines.slice(0, i))) {
            issues.push({
              severity: 'major',
              line: lineNum,
              message: `Potential null access on '${varName}'`,
              suggestion: `Consider using optional chaining: ${varName}?.`,
            });
          }
        }
      }

      // Async without await
      if (line.match(/\.then\(|\.catch\(/)) {
        issues.push({
          severity: 'minor',
          line: lineNum,
          message: 'Promise chain without await',
          suggestion: 'Consider using async/await for clearer control flow',
        });
      }

      // Assignment in condition
      if (line.match(/\([^)]*=\s*[^)]+\)/)) {
        issues.push({
          severity: 'suggestion',
          line: lineNum,
          message: 'Assignment in condition',
          suggestion: 'Use === for comparison or extract the assignment',
        });
      }
    }

    // Check for error handling
    if (!code.includes('try') && !code.includes('catch')) {
      issues.push({
        severity: 'minor',
        message: 'No try-catch blocks found - ensure error handling exists',
      });
    }

    if (issues.length === 0) {
      positives.push('No obvious correctness issues detected');
      positives.push('Basic structure appears sound');
    }

    const criticalIssues = issues.filter((i) => i.severity === 'critical').length;
    const majorIssues = issues.filter((i) => i.severity === 'major').length;

    return {
      score: Math.max(0, 100 - criticalIssues * 20 - majorIssues * 10 - issues.length * 2),
      issues,
      positives,
      verdict: criticalIssues > 0 ? 'fail' : majorIssues > 2 ? 'needs-work' : 'pass',
    };
  }

  private isCheckedVariable(name: string, precedingLines: string[]): boolean {
    const checkPatterns = [
      new RegExp(`if\\s*\\([^)]*${name}[^)]*\\)`),
      new RegExp(`${name}\\s*[!=]=`),
      new RegExp(`${name}\\s*\\?\\?`),
      new RegExp(`${name}\\s*\\?\\.`),
    ];

    return precedingLines.some((line) =>
      checkPatterns.some((pattern) => pattern.test(line))
    );
  }

  /**
   * 2. Readability Review
   * Can another engineer understand this code?
   */
  private async reviewReadability(
    code: string,
    context: ReviewContext
  ): Promise<AxisResult> {
    const issues: ReviewIssue[] = [];
    const positives: string[] = [];

    const lines = code.split('\n');

    // Check for naming issues
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Bad variable names
      const badNames = ['temp', 'data', 'result', 'tmp', 'foo', 'bar', 'test'];
      const match = line.match(/(?:const|let|var|function)\s+(\w+)/);
      if (match && badNames.includes(match[1])) {
        issues.push({
          severity: 'minor',
          line: i + 1,
          message: `Generic name '${match[1]}' - use descriptive names`,
        });
      }

      // Long lines
      if (line.length > 120) {
        issues.push({
          severity: 'suggestion',
          line: i + 1,
          message: `Line exceeds 120 characters (${line.length})`,
          suggestion: 'Consider breaking into multiple lines',
        });
      }

      // Deep nesting
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      if (indent > 16) {
        issues.push({
          severity: 'minor',
          line: i + 1,
          message: 'Deeply nested code - consider extracting a function',
        });
      }

      // Magic numbers
      const magicMatch = line.match(/[^'"`]\b(\d{3,})\b/);
      if (magicMatch && !line.includes('version') && !line.includes('port')) {
        issues.push({
          severity: 'suggestion',
          line: i + 1,
          message: `Magic number: ${magicMatch[1]}`,
          suggestion: 'Use a named constant instead',
        });
      }
    }

    // Check for comments
    const hasComments = code.includes('//') || code.includes('/*');
    const hasJSDoc = code.includes('@param') || code.includes('@returns');

    if (!hasComments && lines.length > 20) {
      positives.push('Code is self-documenting through clear structure');
    } else if (hasJSDoc) {
      positives.push('Good use of JSDoc documentation');
    }

    // Check line count
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0).length;
    if (nonEmptyLines < 50) {
      positives.push('Compact code - easy to understand');
    } else if (nonEmptyLines > 200) {
      issues.push({
        severity: 'suggestion',
        message: `Large file (${nonEmptyLines} lines) - consider splitting`,
      });
    }

    return {
      score: Math.max(0, 100 - issues.length * 5),
      issues,
      positives,
      verdict: issues.filter((i) => i.severity === 'critical' || i.severity === 'major').length > 0 ? 'needs-work' : 'pass',
    };
  }

  /**
   * 3. Architecture Review
   * Does the change fit the system's design?
   */
  private async reviewArchitecture(
    code: string,
    context: ReviewContext
  ): Promise<AxisResult> {
    const issues: ReviewIssue[] = [];
    const positives: string[] = [];

    // Check for circular dependencies (simple heuristic)
    const imports = code.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
    const exportCount = (code.match(/export\s+(?:default\s+)?(?:class|function|const|interface|type)/g) || []).length;

    // Single responsibility check
    const functions = code.match(/function\s+(\w+)/g) || [];
    const classes = code.match(/class\s+(\w+)/g) || [];

    if (classes.length > 1) {
      positives.push('Multiple classes suggest separation of concerns');
    }

    if (functions.length > 10) {
      const funcNames = functions.map((f) => f.replace(/function\s+/, ''));
      const longFunctions = funcNames.filter((name) => {
        const regex = new RegExp(`function\\s+${name}[^{]*\\{[^}]{500,}\\}`, 'm');
        return regex.test(code);
      });

      if (longFunctions.length > 0) {
        issues.push({
          severity: 'suggestion',
          message: 'Some functions may be too long - consider splitting',
        });
      }
    }

    // Dependency direction check
    if (imports.length > 20) {
      issues.push({
        severity: 'minor',
        message: `High import count (${imports.length}) - ensure module boundaries are clean`,
      });
    }

    if (issues.length === 0) {
      positives.push('Architecture appears sound');
    }

    return {
      score: Math.max(0, 100 - issues.length * 10),
      issues,
      positives,
      verdict: issues.length > 3 ? 'needs-work' : 'pass',
    };
  }

  /**
   * 4. Security Review
   * Does it introduce vulnerabilities?
   */
  private async reviewSecurity(
    code: string,
    context: ReviewContext
  ): Promise<AxisResult> {
    const issues: ReviewIssue[] = [];
    const positives: string[] = [];

    // Use AgentShield for security scanning
    const scanResult = this.shield.scan(code);

    for (const finding of scanResult.issues) {
      issues.push({
        severity: 'critical',
        message: finding.rule,
        suggestion: 'Review and fix security issue',
      });
    }

    // Additional manual checks
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Hardcoded secrets
      if (line.match(/password\s*=\s*['"][^'"]+['"]/i) ||
          line.match(/api[_-]?key\s*=\s*['"][^'"]+['"]/i) ||
          line.match(/secret\s*=\s*['"][^'"]+['"]/i)) {
        issues.push({
          severity: 'critical',
          line: i + 1,
          message: 'Potential hardcoded secret',
          suggestion: 'Use environment variables instead',
        });
      }

      // SQL injection risk
      if (line.match(/['"`].*\$\{.*\}/) && line.match(/query|sql|select|insert/i)) {
        issues.push({
          severity: 'critical',
          line: i + 1,
          message: 'Potential SQL injection vulnerability',
          suggestion: 'Use parameterized queries',
        });
      }

      // Inner HTML (XSS)
      if (line.match(/\.innerHTML\s*=/)) {
        issues.push({
          severity: 'major',
          line: i + 1,
          message: 'innerHTML usage - potential XSS risk',
          suggestion: 'Use textContent or sanitize input',
        });
      }
    }

    if (issues.filter((i) => i.severity === 'critical').length === 0) {
      positives.push('No critical security vulnerabilities detected');
    }

    return {
      score: Math.max(0, 100 - issues.filter((i) => i.severity === 'critical').length * 30 - issues.filter((i) => i.severity === 'major').length * 15),
      issues,
      positives,
      verdict: issues.filter((i) => i.severity === 'critical').length > 0 ? 'fail' : issues.filter((i) => i.severity === 'major').length > 0 ? 'needs-work' : 'pass',
    };
  }

  /**
   * 5. Performance Review
   * Does it introduce performance problems?
   */
  private async reviewPerformance(
    code: string,
    context: ReviewContext
  ): Promise<AxisResult> {
    const issues: ReviewIssue[] = [];
    const positives: string[] = [];

    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // N+1 query pattern
      if (line.match(/for.*\{/) && lines.slice(Math.max(0, i - 5), i).some((l) => l.includes('query') || l.includes('find'))) {
        issues.push({
          severity: 'minor',
          line: i + 1,
          message: 'Potential N+1 query pattern',
          suggestion: 'Consider batch fetching or joining',
        });
      }

      // Unbounded data fetching
      if (line.match(/\.findAll\(\)|\.getAll\(\)|\.fetchAll\(/)) {
        issues.push({
          severity: 'suggestion',
          line: i + 1,
          message: 'Unbounded fetch - consider pagination',
          suggestion: 'Add limit or pagination',
        });
      }

      // Sync I/O in loop
      if (line.match(/for.*\{/) && lines.slice(i, i + 10).some((l) => l.includes('readFile') || l.includes('writeFile'))) {
        issues.push({
          severity: 'minor',
          line: i + 1,
          message: 'Synchronous I/O inside loop',
          suggestion: 'Use async operations or batch',
        });
      }

      // Missing memoization
      if (line.match(/function\s+\w+\([^)]*\)\s*\{/) && code.includes('useMemo') === false && code.includes('cache') === false) {
        // Check if function is called multiple times with same args
        const funcName = line.match(/function\s+(\w+)/)?.[1];
        if (funcName) {
          const calls = (code.match(new RegExp(`\\b${funcName}\\(`, 'g')) || []).length;
          if (calls > 3) {
            issues.push({
              severity: 'suggestion',
              line: i + 1,
              message: `Function '${funcName}' called ${calls} times - consider memoization`,
            });
          }
        }
      }
    }

    if (issues.length === 0) {
      positives.push('No obvious performance issues detected');
    }

    return {
      score: Math.max(0, 100 - issues.length * 5),
      issues,
      positives,
      verdict: issues.filter((i) => i.severity === 'critical' || i.severity === 'major').length > 0 ? 'needs-work' : 'pass',
    };
  }

  /**
   * Calculate overall score and verdict
   */
  private calculateOverall(axes: ReviewAxes): CodeReviewResult['overall'] {
    const weights = {
      correctness: 0.3,
      readability: 0.2,
      architecture: 0.2,
      security: 0.2,
      performance: 0.1,
    };

    const score =
      axes.correctness.score * weights.correctness +
      axes.readability.score * weights.readability +
      axes.architecture.score * weights.architecture +
      axes.security.score * weights.security +
      axes.performance.score * weights.performance;

    // Verdict based on critical issues and scores
    const criticalSecurity = axes.security.issues.filter((i) => i.severity === 'critical').length;
    const criticalCorrectness = axes.correctness.issues.filter((i) => i.severity === 'critical').length;

    let verdict: 'approve' | 'request-changes' | 'reject';
    let summary: string;

    if (criticalSecurity > 0 || criticalCorrectness > 0) {
      verdict = 'reject';
      summary = 'Critical issues must be fixed before approval';
    } else if (score < 60 || axes.security.verdict === 'needs-work') {
      verdict = 'request-changes';
      summary = 'Code needs improvement before approval';
    } else if (score >= 80) {
      verdict = 'approve';
      summary = 'Code meets quality standards - approved';
    } else {
      verdict = 'request-changes';
      summary = 'Code has issues that should be addressed';
    }

    return {
      score: Math.round(score),
      verdict,
      summary,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(axes: ReviewAxes): string[] {
    const recommendations: string[] = [];

    for (const [axisName, axis] of Object.entries(axes)) {
      if (axis.issues.length > 0) {
        recommendations.push(`**${axisName}:** ${axis.issues.length} issue(s) found`);
        for (const issue of axis.issues.slice(0, 2)) {
          recommendations.push(`  - ${issue.message}${issue.suggestion ? ` → ${issue.suggestion}` : ''}`);
        }
      }
    }

    return recommendations;
  }

  /**
   * Format review as markdown report
   */
  formatReport(result: CodeReviewResult): string {
    const lines: string[] = [];

    lines.push('# Code Review Report\n');
    lines.push(`**Overall Score:** ${result.overall.score}/100`);
    lines.push(`**Verdict:** ${this.formatVerdict(result.overall.verdict)}`);
    lines.push(`**Summary:** ${result.overall.summary}\n`);

    // Axis breakdown
    lines.push('## Five-Axis Breakdown\n');

    for (const [axis, data] of Object.entries(result.axes)) {
      const icon = data.verdict === 'pass' ? '✅' : data.verdict === 'needs-work' ? '⚠️' : '❌';
      lines.push(`${icon} **${axis}**: ${data.score}/100`);
    }
    lines.push('');

    // Detailed issues
    for (const [axis, data] of Object.entries(result.axes)) {
      if (data.issues.length > 0) {
        lines.push(`### ${axis.charAt(0).toUpperCase() + axis.slice(1)} Issues\n`);
        for (const issue of data.issues) {
          const severityIcon = issue.severity === 'critical' ? '🔴' :
                              issue.severity === 'major' ? '🟠' :
                              issue.severity === 'minor' ? '🟡' : '🔵';
          lines.push(`${severityIcon} ${issue.message}`);
          if (issue.line) lines.push(`   Line ${issue.line}`);
          if (issue.suggestion) lines.push(`   → ${issue.suggestion}`);
          lines.push('');
        }
      }
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      lines.push('## Recommendations\n');
      for (const rec of result.recommendations) {
        lines.push(`- ${rec}`);
      }
    }

    return lines.join('\n');
  }

  private formatVerdict(verdict: 'approve' | 'request-changes' | 'reject'): string {
    return verdict === 'approve' ? '✅ APPROVE' :
           verdict === 'request-changes' ? '⚠️ REQUEST CHANGES' : '❌ REJECT';
  }
}