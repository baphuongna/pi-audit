/**
 * Multi-Perspective Reviewer
 * Based on gstack multi-role review patterns
 */

export type Perspective = 'security' | 'quality' | 'performance' | 'alignment' | 'architecture';

export interface ReviewIssue {
  perspective: Perspective;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestion: string;
  location?: {
    file: string;
    line: number;
  };
}

export interface ReviewResult {
  overall: {
    passed: boolean;
    score: number; // 0-100
    summary: string;
  };
  perspectives: Record<Perspective, {
    score: number;
    issues: ReviewIssue[];
  }>;
  allIssues: ReviewIssue[];
}

interface ReviewContext {
  project?: string;
  goal?: string;
  constraints?: string[];
  architecture?: string;
}

/**
 * Multi-Perspective Code Reviewer
 */
export class MultiPerspectiveReviewer {
  private perspectives: Map<Perspective, (code: string, context: ReviewContext) => ReviewIssue[]> = new Map();

  constructor() {
    this.initializePerspectives();
  }

  private initializePerspectives(): void {
    // Security perspective
    this.perspectives.set('security', (code) => {
      const issues: ReviewIssue[] = [];

      // Check for common security issues
      if (/\beval\s*\(/.test(code)) {
        issues.push({
          perspective: 'security',
          severity: 'critical',
          title: 'Dangerous eval() usage',
          description: 'eval() can execute arbitrary code and poses security risks',
          suggestion: 'Use safer alternatives like JSON.parse or create a sandboxed VM',
        });
      }

      if (/password\s*===?\s*['"`]/i.test(code)) {
        issues.push({
          perspective: 'security',
          severity: 'critical',
          title: 'Hardcoded password',
          description: 'Passwords should never be hardcoded',
          suggestion: 'Use environment variables or a secrets manager',
        });
      }

      if (/\.innerHTML\s*=/.test(code)) {
        issues.push({
          perspective: 'security',
          severity: 'high',
          title: 'XSS risk with innerHTML',
          description: 'Direct innerHTML assignment can lead to XSS attacks',
          suggestion: 'Use textContent or sanitize HTML with DOMPurify',
        });
      }

      if (/api[_-]?key\s*=\s*['"`]/i.test(code)) {
        issues.push({
          perspective: 'security',
          severity: 'critical',
          title: 'Hardcoded API key',
          description: 'API keys should be stored securely',
          suggestion: 'Use environment variables',
        });
      }

      return issues;
    });

    // Quality perspective
    this.perspectives.set('quality', (code) => {
      const issues: ReviewIssue[] = [];

      // Check for TODO comments
      const todos = code.match(/\/\/\s*TODO|\/\/\s*FIXME/g);
      if (todos) {
        issues.push({
          perspective: 'quality',
          severity: 'medium',
          title: 'TODO/FIXME comments found',
          description: `${todos.length} incomplete tasks found`,
          suggestion: 'Address all TODO comments before merging`,
        });
      }

      // Check for very long functions
      const functions = code.match(/function\s+\w+[^}]*{[\s\S]{500,}}/g);
      if (functions) {
        issues.push({
          perspective: 'quality',
          severity: 'low',
          title: 'Very long function',
          description: 'Some functions exceed 500 characters',
          suggestion: 'Consider breaking into smaller functions',
        });
      }

      // Check for magic numbers
      const magicNumbers = code.match(/\b\d{3,}\b(?!px|em|rem|%|ms|s)/g);
      if (magicNumbers) {
        issues.push({
          perspective: 'quality',
          severity: 'low',
          title: 'Magic numbers',
          description: 'Consider using named constants instead of magic numbers',
          suggestion: 'Define constants with descriptive names',
        });
      }

      return issues;
    });

    // Performance perspective
    this.perspectives.set('performance', (code) => {
      const issues: ReviewIssue[] = [];

      // Check for nested loops
      if (/\bfor\b[\s\S]*?\bfor\b[\s\S]*?\bfor\b/.test(code)) {
        issues.push({
          perspective: 'performance',
          severity: 'medium',
          title: 'Triple nested loops',
          description: 'Deeply nested loops can cause performance issues',
          suggestion: 'Consider algorithm optimization or memoization',
        });
      }

      // Check for inline styles in JSX (memory intensive)
      if (/style\s*=\s*\{[^}]*\{/.test(code)) {
        issues.push({
          perspective: 'performance',
          severity: 'low',
          title: 'Inline object styles',
          description: 'Creating new style objects on every render',
          suggestion: 'Move styles outside component or use CSS modules',
        });
      }

      // Check for missing dependencies in useEffect
      if (/useEffect\s*\([^)]*\)\s*,\s*\[\s*\]/.test(code)) {
        issues.push({
          perspective: 'performance',
          severity: 'medium',
          title: 'Empty useEffect dependency array',
          description: 'Effect runs only once, may miss dependencies',
          suggestion: 'Verify this is intentional, not a bug',
        });
      }

      return issues;
    });

    // Alignment perspective
    this.perspectives.set('alignment', (code, context) => {
      const issues: ReviewIssue[] = [];

      if (!context.goal) return issues;

      // Check if code aligns with described goal
      if (context.goal.includes('authentication') && !/(auth|login|password|token|jwt)/i.test(code)) {
        issues.push({
          perspective: 'alignment',
          severity: 'high',
          title: 'Code does not address stated goal',
          description: `Goal mentions authentication but code doesn't seem to handle it`,
          suggestion: 'Review if authentication is properly implemented',
        });
      }

      if (context.goal.includes('API') && !/(fetch|axios|request|http)/i.test(code)) {
        issues.push({
          perspective: 'alignment',
          severity: 'medium',
          title: 'API mentioned but not implemented',
          description: 'Code should make HTTP requests but none found',
          suggestion: 'Implement API calls or clarify requirements',
        });
      }

      return issues;
    });

    // Architecture perspective
    this.perspectives.set('architecture', (code) => {
      const issues: ReviewIssue[] = [];

      // Check for large files
      if (code.split('\n').length > 500) {
        issues.push({
          perspective: 'architecture',
          severity: 'low',
          title: 'Large file',
          description: 'File exceeds 500 lines',
          suggestion: 'Consider splitting into smaller modules',
        });
      }

      // Check for deeply nested directories (coupling)
      if (/from\s+['"]\.\.\/\.\.\/\.\.\//.test(code)) {
        issues.push({
          perspective: 'architecture',
          severity: 'low',
          title: 'Deep import path',
          description: 'File imports from 3+ levels up',
          suggestion: 'Consider restructuring or using aliases',
        });
      }

      return issues;
    });
  }

  /**
   * Review code from all perspectives
   */
  review(code: string, context: ReviewContext = {}): ReviewResult {
    const perspectiveResults: ReviewResult['perspectives'] = {
      security: { score: 100, issues: [] },
      quality: { score: 100, issues: [] },
      performance: { score: 100, issues: [] },
      alignment: { score: 100, issues: [] },
      architecture: { score: 100, issues: [] },
    };

    let totalScore = 0;

    for (const [perspective, reviewer] of this.perspectives) {
      const issues = reviewer(code, context);
      perspectiveResults[perspective].issues = issues;

      // Calculate score based on issues
      let deductions = 0;
      for (const issue of issues) {
        switch (issue.severity) {
          case 'critical':
            deductions += 30;
            break;
          case 'high':
            deductions += 20;
            break;
          case 'medium':
            deductions += 10;
            break;
          case 'low':
            deductions += 5;
            break;
        }
      }

      perspectiveResults[perspective].score = Math.max(0, 100 - deductions);
      totalScore += perspectiveResults[perspective].score;
    }

    // Calculate overall
    const avgScore = totalScore / this.perspectives.size;
    const allIssues = Object.values(perspectiveResults)
      .flatMap((r) => r.issues)
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

    const criticalIssues = allIssues.filter((i) => i.severity === 'critical').length;
    const highIssues = allIssues.filter((i) => i.severity === 'high').length;

    return {
      overall: {
        passed: criticalIssues === 0 && highIssues === 0,
        score: Math.round(avgScore),
        summary: this.generateSummary(avgScore, allIssues),
      },
      perspectives: perspectiveResults,
      allIssues,
    };
  }

  private generateSummary(score: number, issues: ReviewIssue[]): string {
    if (score >= 90) {
      return 'Excellent code quality with minimal issues';
    } else if (score >= 70) {
      return `Good code with ${issues.length} issues that should be addressed`;
    } else if (score >= 50) {
      return `Code needs improvement - ${issues.length} issues found`;
    } else {
      return `Critical issues found - code requires significant rework`;
    }
  }

  /**
   * Format review result as markdown
   */
  formatReport(result: ReviewResult): string {
    const lines: string[] = [];

    lines.push('## Multi-Perspective Code Review\n');
    lines.push(`**Overall Score:** ${result.overall.score}/100`);
    lines.push(`**Status:** ${result.overall.passed ? '✅ PASSED' : '⚠️ NEEDS ATTENTION'}`);
    lines.push(`**Summary:** ${result.overall.summary}\n`);

    lines.push('### Perspective Scores\n');
    lines.push('| Perspective | Score | Issues |');
    lines.push('|--------------|-------|--------|');

    for (const [perspective, data] of Object.entries(result.perspectives)) {
      lines.push(`| ${perspective} | ${data.score}/100 | ${data.issues.length} |`);
    }

    if (result.allIssues.length > 0) {
      lines.push('\n### Issues\n');

      for (const issue of result.allIssues) {
        const icon = issue.severity === 'critical' ? '🔴' :
                     issue.severity === 'high' ? '🟠' :
                     issue.severity === 'medium' ? '🟡' : '🔵';
        lines.push(`${icon} **${issue.title}** (${issue.perspective})`);
        lines.push(`   ${issue.description}`);
        lines.push(`   💡 ${issue.suggestion}\n`);
      }
    }

    return lines.join('\n');
  }
}
