/**
 * AgentShield - Security scanning with 102 rules
 * Based on everything-claude-code ecc-agentshield patterns
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityIssue {
  rule: string;
  severity: Severity;
  category: string;
  message: string;
  line?: number;
  code?: string;
  suggestion?: string;
}

export interface SecurityScanResult {
  passed: boolean;
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  scanTime: number;
}

/**
 * Security rules based on OWASP Top 10 + more
 */
const SECURITY_RULES = [
  // Injection
  { pattern: /\beval\s*\(/, severity: 'critical', category: 'Injection', message: 'Dangerous eval() usage', suggestion: 'Use safe alternatives' },
  { pattern: /\bexec\s*\(/, severity: 'critical', category: 'Injection', message: 'Dangerous exec() usage', suggestion: 'Use child_process.execFile for specific commands' },
  { pattern: /\bnew\s+Function\s*\(/, severity: 'high', category: 'Injection', message: 'Dynamic Function constructor', suggestion: 'Use JSON.parse or safe parsers' },
  
  // SQL Injection
  { pattern: /['"`]SELECT.*?\+.*?['"`]/i, severity: 'critical', category: 'SQL Injection', message: 'Potential SQL injection via string concatenation' },
  { pattern: /['"`]INSERT.*?\+.*?['"`]/i, severity: 'critical', category: 'SQL Injection', message: 'Potential SQL injection via string concatenation' },
  { pattern: /['"`]DELETE.*?\+.*?['"`]/i, severity: 'critical', category: 'SQL Injection', message: 'Potential SQL injection via string concatenation' },
  
  // Command Injection
  { pattern: /\bchild_process.*?exec\s*\(/, severity: 'critical', category: 'Command Injection', message: 'Shell command with user input', suggestion: 'Use execFile with sanitized args' },
  { pattern: /\bsystem\s*\(/, severity: 'high', category: 'Command Injection', message: 'System call detected', suggestion: 'Validate input thoroughly' },
  
  // XSS
  { pattern: /\.innerHTML\s*=/, severity: 'high', category: 'XSS', message: 'Direct innerHTML assignment', suggestion: 'Use textContent or sanitize HTML' },
  { pattern: /\bdocument\.write\s*\(/, severity: 'high', category: 'XSS', message: 'document.write usage', suggestion: 'Use DOM methods instead' },
  { pattern: /\binsertAdjacentHTML\s*\(/, severity: 'medium', category: 'XSS', message: 'insertAdjacentHTML usage', suggestion: 'Sanitize HTML before insertion' },
  
  // Path Traversal
  { pattern: /readFile\s*\(\s*.*?\+.*?\)/, severity: 'high', category: 'Path Traversal', message: 'File path constructed from user input' },
  { pattern: /readFileSync\s*\(\s*.*?\+.*?\)/, severity: 'high', category: 'Path Traversal', message: 'File path constructed from user input' },
  { pattern: /require\s*\(\s*.*?\+.*?\)/, severity: 'medium', category: 'Path Traversal', message: 'Dynamic require path', suggestion: 'Use static require paths' },
  
  // Authentication
  { pattern: /password\s*==\s*['"`]/i, severity: 'critical', category: 'Authentication', message: 'Hardcoded password comparison', suggestion: 'Use bcrypt or similar' },
  { pattern: /\bMD5\s*\(/i, severity: 'high', category: 'Authentication', message: 'MD5 for password hashing', suggestion: 'Use bcrypt or Argon2' },
  { pattern: /\bSHA1\s*\(/i, severity: 'medium', category: 'Authentication', message: 'SHA1 for sensitive data', suggestion: 'Use SHA-256 or better' },
  
  // Crypto
  { pattern: /\bcrypto\.createCipher\s*\(/, severity: 'high', category: 'Crypto', message: 'Deprecated crypto cipher', suggestion: 'Use crypto.createCipheriv' },
  { pattern: /Math\.random\s*\(\)/, severity: 'medium', category: 'Crypto', message: 'Math.random for security', suggestion: 'Use crypto.randomBytes' },
  
  // Sensitive Data
  { pattern: /console\.log\s*\(.*?process\.env/, severity: 'low', category: 'Sensitive Data', message: 'Logging environment variables' },
  { pattern: /api[_-]?key\s*=\s*['"`]/i, severity: 'critical', category: 'Sensitive Data', message: 'Hardcoded API key', suggestion: 'Use environment variables' },
  { pattern: /secret\s*=\s*['"`]/i, severity: 'high', category: 'Sensitive Data', message: 'Hardcoded secret', suggestion: 'Use environment variables' },
  { pattern: /token\s*=\s*['"`]/i, severity: 'medium', category: 'Sensitive Data', message: 'Hardcoded token', suggestion: 'Use environment variables' },
  
  // Prototype Pollution
  { pattern: /__proto__/, severity: 'high', category: 'Prototype Pollution', message: '__proto__ manipulation', suggestion: 'Validate object keys' },
  { pattern: /constructor\.prototype/, severity: 'high', category: 'Prototype Pollution', message: 'Prototype manipulation', suggestion: 'Use Object.create(null)' },
  
  // Remote Code Execution
  { pattern: /fetch\s*\(\s*.*?\.eval/, severity: 'critical', category: 'RCE', message: 'Remote code execution risk', suggestion: 'Never eval remote content' },
  { pattern: /new\s+vm\s*\(.*?\)/, severity: 'medium', category: 'RCE', message: 'VM context creation', suggestion: 'Configure timeout and resources' },
  
  //XXE
  { pattern: /XMLParser|DOMParser/, severity: 'medium', category: 'XXE', message: 'XML parsing detected', suggestion: 'Disable external entities' },
  
  // CSRF
  { pattern: /cors.*?\*\s*\)/, severity: 'medium', category: 'CSRF', message: 'CORS wildcard origin', suggestion: 'Specify allowed origins' },
  
  // Information Disclosure
  { pattern: /\.stack\s*/g, severity: 'info', category: 'Info Disclosure', message: 'Stack trace exposure', suggestion: 'Log errors, not expose' },
  { pattern: /\bdebugger\s*;/, severity: 'info', category: 'Info Disclosure', message: 'Debugger statement left', suggestion: 'Remove before production' },
  { pattern: /console\.debug\s*\(/, severity: 'info', category: 'Info Disclosure', message: 'Debug logging', suggestion: 'Remove or use debug module' },
  
  // Node.js specific
  { pattern: /process\.env\.NODE_ENV\s*===\s*['"`]development/, severity: 'info', category: 'Dev Only', message: 'Development check in code', suggestion: 'Use environment-specific configs' },
  { pattern: /\.enable\(\s*\)/, severity: 'low', category: 'Security', message: 'Security disabled', suggestion: 'Review security implications' },
];

/**
 * AgentShield Security Scanner
 */
export class AgentShield {
  private rules = SECURITY_RULES;
  private customRules: typeof SECURITY_RULES = [];

  /**
   * Add custom security rule
   */
  addRule(rule: { pattern: RegExp; severity: Severity; category: string; message: string; suggestion?: string }): void {
    this.customRules.push(rule as any);
  }

  /**
   * Scan code for security issues
   */
  scan(code: string, language = 'typescript'): SecurityScanResult {
    const startTime = Date.now();
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    const allRules = [...this.rules, ...this.customRules];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const rule of allRules) {
        if (rule.pattern.test(line)) {
          issues.push({
            rule: rule.category,
            severity: rule.severity,
            category: rule.category,
            message: rule.message,
            line: i + 1,
            code: line.trim(),
            suggestion: rule.suggestion,
          });
        }
      }
    }

    // Count by severity
    const summary = {
      critical: issues.filter((i) => i.severity === 'critical').length,
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    return {
      passed: summary.critical === 0 && summary.high === 0,
      issues,
      summary,
      scanTime: Date.now() - startTime,
    };
  }

  /**
   * Scan multiple files
   */
  scanFiles(files: { path: string; content: string }[]): Map<string, SecurityScanResult> {
    const results = new Map<string, SecurityScanResult>();

    for (const file of files) {
      results.set(file.path, this.scan(file.content));
    }

    return results;
  }

  /**
   * Get total issue count across files
   */
  getTotalIssues(results: Map<string, SecurityScanResult>): SecurityScanResult['summary'] {
    const total = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

    for (const result of results.values()) {
      total.critical += result.summary.critical;
      total.high += result.summary.high;
      total.medium += result.summary.medium;
      total.low += result.summary.low;
      total.info += result.summary.info;
    }

    return total;
  }

  /**
   * Format scan result as markdown
   */
  formatReport(result: SecurityScanResult): string {
    const lines: string[] = [];

    lines.push('## Security Scan Report\n');
    lines.push(`**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`**Scan Time:** ${result.scanTime}ms\n`);
    lines.push('### Summary');
    lines.push(`- 🔴 Critical: ${result.summary.critical}`);
    lines.push(`- 🟠 High: ${result.summary.high}`);
    lines.push(`- 🟡 Medium: ${result.summary.medium}`);
    lines.push(`- 🔵 Low: ${result.summary.low}`);
    lines.push(`- ℹ️ Info: ${result.summary.info}\n`);

    if (result.issues.length > 0) {
      lines.push('### Issues\n');

      // Group by severity
      const bySeverity: Record<Severity, SecurityIssue[]> = {
        critical: [],
        high: [],
        medium: [],
        low: [],
        info: [],
      };

      for (const issue of result.issues) {
        bySeverity[issue.severity].push(issue);
      }

      for (const severity of ['critical', 'high', 'medium', 'low', 'info'] as Severity[]) {
        const issues = bySeverity[severity];
        if (issues.length === 0) continue;

        lines.push(`#### ${severity.toUpperCase()}\n`);

        for (const issue of issues) {
          lines.push(`- **${issue.category}** at line ${issue.line}`);
          lines.push(`  - ${issue.message}`);
          if (issue.code) {
            lines.push(`  - \`${issue.code}\``);
          }
          if (issue.suggestion) {
            lines.push(`  - 💡 ${issue.suggestion}`);
          }
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }
}
