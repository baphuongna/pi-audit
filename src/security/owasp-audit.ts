/**
 * OWASP + STRIDE Security Audit
 * Based on gstack /cso command patterns
 */

export type STRIDECategory = 
  | 'Spoofing'
  | 'Tampering'
  | 'Repudiation'
  | 'Information Disclosure'
  | 'Denial of Service'
  | 'Elevation of Privilege';

export interface OWASPIssue {
  owaspCategory: string;
  strideCategory: STRIDECategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cwe?: string; // Common Weakness Enumeration
  remediation: string;
}

export interface OWASPAuditResult {
  passed: boolean;
  issues: OWASPIssue[];
  byCategory: Record<string, OWASPIssue[]>;
  bySTRIDE: Record<STRIDECategory, OWASPIssue[]>;
  compliance: {
    A01: boolean; // Broken Access Control
    A02: boolean; // Cryptographic Failures
    A03: boolean; // Injection
    A04: boolean; // Insecure Design
    A05: boolean; // Security Misconfiguration
    A06: boolean; // Vulnerable Components
    A07: boolean; // Auth Failures
    A08: boolean; // Data Integrity
    A09: boolean; // Logging Failures
    A10: boolean; // SSRF
  };
}

/**
 * OWASP Top 10 + STRIDE mapping rules
 */
const OWASP_STRIDE_RULES: OWASPIssue[] = [
  // A01: Broken Access Control
  {
    owaspCategory: 'A01: Broken Access Control',
    strideCategory: 'Elevation of Privilege',
    severity: 'critical',
    title: 'Insecure Direct Object Reference',
    description: 'Direct access to objects without authorization check',
    cwe: 'CWE-639',
    remediation: 'Implement proper authorization checks',
  },
  {
    owaspCategory: 'A01: Broken Access Control',
    strideCategory: 'Information Disclosure',
    severity: 'high',
    title: 'Missing Authorization',
    description: 'Endpoint does not verify user permissions',
    cwe: 'CWE-862',
    remediation: 'Add authorization middleware',
  },
  {
    owaspCategory: 'A01: Broken Access Control',
    strideCategory: 'Spoofing',
    severity: 'high',
    title: 'Privilege Escalation',
    description: 'User can elevate privileges',
    cwe: 'CWE-269',
    remediation: 'Implement role-based access control',
  },

  // A02: Cryptographic Failures
  {
    owaspCategory: 'A02: Cryptographic Failures',
    strideCategory: 'Information Disclosure',
    severity: 'critical',
    title: 'Sensitive Data Exposure',
    description: 'Sensitive data transmitted in clear text',
    cwe: 'CWE-319',
    remediation: 'Use TLS and encrypt sensitive data',
  },
  {
    owaspCategory: 'A02: Cryptographic Failures',
    strideCategory: 'Information Disclosure',
    severity: 'critical',
    title: 'Weak Cryptographic Algorithm',
    description: 'Using MD5, SHA1, or DES for security',
    cwe: 'CWE-327',
    remediation: 'Use AES-256, SHA-256+, RSA-2048+',
  },
  {
    owaspCategory: 'A02: Cryptographic Failures',
    strideCategory: 'Information Disclosure',
    severity: 'high',
    title: 'Hardcoded Credentials',
    description: 'Credentials found in source code',
    cwe: 'CWE-798',
    remediation: 'Use environment variables or secrets manager',
  },

  // A03: Injection
  {
    owaspCategory: 'A03: Injection',
    strideCategory: 'Tampering',
    severity: 'critical',
    title: 'SQL Injection',
    description: 'User input used in SQL query without sanitization',
    cwe: 'CWE-89',
    remediation: 'Use parameterized queries',
  },
  {
    owaspCategory: 'A03: Injection',
    strideCategory: 'Tampering',
    severity: 'critical',
    title: 'Command Injection',
    description: 'User input used in system command',
    cwe: 'CWE-78',
    remediation: 'Avoid shell commands, use safe APIs',
  },
  {
    owaspCategory: 'A03: Injection',
    strideCategory: 'Tampering',
    severity: 'critical',
    title: 'LDAP Injection',
    description: 'User input used in LDAP query',
    cwe: 'CWE-90',
    remediation: 'Escape special LDAP characters',
  },
  {
    owaspCategory: 'A03: Injection',
    strideCategory: 'Tampering',
    severity: 'high',
    title: 'XSS (Cross-Site Scripting)',
    description: 'User input reflected without sanitization',
    cwe: 'CWE-79',
    remediation: 'Escape HTML, use CSP',
  },
  {
    owaspCategory: 'A03: Injection',
    strideCategory: 'Tampering',
    severity: 'high',
    title: 'NoSQL Injection',
    description: 'User input used in NoSQL query',
    cwe: 'CWE-943',
    remediation: 'Validate and sanitize all inputs',
  },

  // A04: Insecure Design
  {
    owaspCategory: 'A04: Insecure Design',
    strideCategory: 'Denial of Service',
    severity: 'medium',
    title: 'Missing Rate Limiting',
    description: 'No rate limiting on API endpoints',
    cwe: 'CWE-307',
    remediation: 'Implement rate limiting',
  },
  {
    owaspCategory: 'A04: Insecure Design',
    strideCategory: 'Denial of Service',
    severity: 'medium',
    title: 'Missing Brute Force Protection',
    description: 'No protection against brute force attacks',
    cwe: 'CWE-307',
    remediation: 'Implement account lockout and CAPTCHA',
  },

  // A05: Security Misconfiguration
  {
    owaspCategory: 'A05: Security Misconfiguration',
    strideCategory: 'Information Disclosure',
    severity: 'high',
    title: 'Default Credentials',
    description: 'Application using default credentials',
    cwe: 'CWE-255',
    remediation: 'Change all default credentials',
  },
  {
    owaspCategory: 'A05: Security Misconfiguration',
    strideCategory: 'Information Disclosure',
    severity: 'high',
    title: 'Verbose Error Messages',
    description: 'Error messages expose internal details',
    cwe: 'CWE-209',
    remediation: 'Use generic error messages in production',
  },
  {
    owaspCategory: 'A05: Security Misconfiguration',
    strideCategory: 'Information Disclosure',
    severity: 'medium',
    title: 'Debug Mode Enabled',
    description: 'Debug features enabled in production',
    cwe: 'CWE-489',
    remediation: 'Disable debug mode in production',
  },

  // A06: Vulnerable Components
  {
    owaspCategory: 'A06: Vulnerable Components',
    strideCategory: 'Elevation of Privilege',
    severity: 'high',
    title: 'Outdated Dependency',
    description: 'Using component with known vulnerabilities',
    cwe: 'CWE-1104',
    remediation: 'Keep dependencies updated, scan regularly',
  },
  {
    owaspCategory: 'A06: Vulnerable Components',
    strideCategory: 'Tampering',
    severity: 'critical',
    title: 'Supply Chain Vulnerability',
    description: 'Dependency from untrusted source',
    cwe: 'CWE-1357',
    remediation: 'Verify package integrity, use lock files',
  },

  // A07: Authentication Failures
  {
    owaspCategory: 'A07: Authentication Failures',
    strideCategory: 'Spoofing',
    severity: 'critical',
    title: 'Weak Password Policy',
    description: 'No enforcement of strong passwords',
    cwe: 'CWE-521',
    remediation: 'Require minimum 12 chars, mixed case, numbers, symbols',
  },
  {
    owaspCategory: 'A07: Authentication Failures',
    strideCategory: 'Spoofing',
    severity: 'high',
    title: 'Missing MFA',
    description: 'Multi-factor authentication not required',
    cwe: 'CWE-308',
    remediation: 'Implement MFA for sensitive operations',
  },
  {
    owaspCategory: 'A07: Authentication Failures',
    strideCategory: 'Repudiation',
    severity: 'medium',
    title: 'No Session Timeout',
    description: 'Sessions do not expire',
    cwe: 'CWE-613',
    remediation: 'Implement session timeout after inactivity',
  },

  // A08: Software and Data Integrity
  {
    owaspCategory: 'A08: Software and Data Integrity',
    strideCategory: 'Tampering',
    severity: 'high',
    title: 'Unverified File Upload',
    description: 'File upload without validation',
    cwe: 'CWE-434',
    remediation: 'Validate file type, size, and content',
  },
  {
    owaspCategory: 'A08: Software and Data Integrity',
    strideCategory: 'Tampering',
    severity: 'high',
    title: 'Insecure Deserialization',
    description: 'Deserializing untrusted data',
    cwe: 'CWE-502',
    remediation: 'Use digital signatures, validate data',
  },

  // A09: Security Logging Failures
  {
    owaspCategory: 'A09: Security Logging Failures',
    strideCategory: 'Repudiation',
    severity: 'medium',
    title: 'Missing Audit Log',
    description: 'Security events not logged',
    cwe: 'CWE-778',
    remediation: 'Log all security-relevant events',
  },
  {
    owaspCategory: 'A09: Security Logging Failures',
    strideCategory: 'Repudiation',
    severity: 'low',
    title: 'Log Injection',
    description: 'User input logged without sanitization',
    cwe: 'CWE-117',
    remediation: 'Sanitize log input, escape special chars',
  },

  // A10: Server-Side Request Forgery
  {
    owaspCategory: 'A10: Server-Side Request Forgery',
    strideCategory: 'Information Disclosure',
    severity: 'high',
    title: 'SSRF Vulnerability',
    description: 'Server making requests based on user input',
    cwe: 'CWE-918',
    remediation: 'Validate URLs, use allowlists',
  },
];

/**
 * OWASP + STRIDE Security Auditor
 */
export class OWASPAuditor {
  private rules = OWASP_STRIDE_RULES;

  /**
   * Run OWASP Top 10 + STRIDE audit
   */
  audit(code: string): OWASPAuditResult {
    const issues: OWASPIssue[] = [];

    for (const rule of this.rules) {
      // Create detection patterns for each rule
      const patterns = this.getDetectionPatterns(rule);
      
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          issues.push(rule);
          break;
        }
      }
    }

    // Categorize issues
    const byCategory: Record<string, OWASPIssue[]> = {};
    const bySTRIDE: Record<STRIDECategory, OWASPIssue[]> = {
      'Spoofing': [],
      'Tampering': [],
      'Repudiation': [],
      'Information Disclosure': [],
      'Denial of Service': [],
      'Elevation of Privilege': [],
    };

    for (const issue of issues) {
      if (!byCategory[issue.owaspCategory]) {
        byCategory[issue.owaspCategory] = [];
      }
      byCategory[issue.owaspCategory].push(issue);
      bySTRIDE[issue.strideCategory].push(issue);
    }

    // Check compliance
    const compliance = {
      A01: !this.hasCategoryIssues(byCategory, 'A01'),
      A02: !this.hasCategoryIssues(byCategory, 'A02'),
      A03: !this.hasCategoryIssues(byCategory, 'A03'),
      A04: !this.hasCategoryIssues(byCategory, 'A04'),
      A05: !this.hasCategoryIssues(byCategory, 'A05'),
      A06: !this.hasCategoryIssues(byCategory, 'A06'),
      A07: !this.hasCategoryIssues(byCategory, 'A07'),
      A08: !this.hasCategoryIssues(byCategory, 'A08'),
      A09: !this.hasCategoryIssues(byCategory, 'A09'),
      A10: !this.hasCategoryIssues(byCategory, 'A10'),
    };

    return {
      passed: issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      byCategory,
      bySTRIDE,
      compliance,
    };
  }

  private hasCategoryIssues(byCategory: Record<string, any[]>, category: string): boolean {
    const issues = byCategory[`${category}:*`];
    return issues && issues.some((i) => i.severity === 'critical' || i.severity === 'high');
  }

  private getDetectionPatterns(issue: OWASPIssue): RegExp[] {
    const patterns: RegExp[] = [];

    switch (issue.title) {
      case 'SQL Injection':
        patterns.push(/['"`].*?SELECT.*?\+.*?['"`]/i);
        patterns.push(/['"`].*?INSERT.*?\+.*?['"`]/i);
        patterns.push(/query\s*\(\s*['"`].*?\+.*?['"`]/i);
        break;
      case 'Command Injection':
        patterns.push(/exec\s*\(\s*.*?\+.*?\)/);
        patterns.push(/system\s*\(\s*.*?\+.*?\)/);
        patterns.push(/spawn\s*\(\s*['"`].*sh.*['"`]/i);
        break;
      case 'XSS (Cross-Site Scripting)':
        patterns.push(/\.innerHTML\s*=/);
        patterns.push(/document\.write\s*\(/);
        break;
      case 'Sensitive Data Exposure':
        patterns.push(/password\s*===\s*['"`]/i);
        patterns.push(/secret\s*===\s*['"`]/i);
        break;
      case 'Weak Cryptographic Algorithm':
        patterns.push(/\bMD5\s*\(/i);
        patterns.push(/\bSHA1\s*\(/i);
        patterns.push(/crypto\.createCipher\s*\(/);
        break;
      case 'Hardcoded Credentials':
        patterns.push(/api[_-]?key\s*=\s*['"`]/i);
        patterns.push(/password\s*=\s*['"`]/i);
        patterns.push(/secret\s*=\s*['"`]/i);
        break;
      case 'SSRF Vulnerability':
        patterns.push(/fetch\s*\(\s*.*?user/i);
        patterns.push(/request\s*\(\s*\{.*?url.*?\}*\)/i);
        break;
      case 'Insecure Deserialization':
        patterns.push(/\.unserialize\s*\(/i);
        patterns.push(/pickle\.loads?\s*\(/i);
        patterns.push(/JSON\.parse\s*\(.*?user/i);
        break;
      case 'Unverified File Upload':
        patterns.push(/move_uploaded_file\s*\(/i);
        patterns.push(/write\s*\(\s*.*?\$_(FILES|POST)/i);
        break;
    }

    return patterns;
  }

  /**
   * Format audit result as markdown report
   */
  formatReport(result: OWASPAuditResult): string {
    const lines: string[] = [];

    lines.push('## OWASP Top 10 + STRIDE Security Audit\n');
    lines.push(`**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`);

    lines.push('### Compliance Summary\n');
    lines.push('| Category | Status |');
    lines.push('|----------|--------|');

    const categories = [
      { key: 'A01', name: 'Broken Access Control' },
      { key: 'A02', name: 'Cryptographic Failures' },
      { key: 'A03', name: 'Injection' },
      { key: 'A04', name: 'Insecure Design' },
      { key: 'A05', name: 'Security Misconfiguration' },
      { key: 'A06', name: 'Vulnerable Components' },
      { key: 'A07', name: 'Authentication Failures' },
      { key: 'A08', name: 'Data Integrity Failures' },
      { key: 'A09', name: 'Logging Failures' },
      { key: 'A10', name: 'SSRF' },
    ];

    for (const cat of categories) {
      const compliant = result.compliance[cat.key as keyof typeof result.compliance];
      lines.push(`| ${cat.key} ${cat.name} | ${compliant ? '✅' : '❌'} |`);
    }

    if (result.issues.length > 0) {
      lines.push('\n### Issues by STRIDE\n');

      for (const [stride, issues] of Object.entries(result.bySTRIDE)) {
        if (issues.length === 0) continue;

        lines.push(`#### ${stride}\n`);
        for (const issue of issues) {
          const icon = issue.severity === 'critical' ? '🔴' :
                       issue.severity === 'high' ? '🟠' :
                       issue.severity === 'medium' ? '🟡' : '🔵';
          lines.push(`${icon} **${issue.title}**`);
          lines.push(`   ${issue.description}`);
          lines.push(`   💡 ${issue.remediation}\n`);
        }
      }
    }

    return lines.join('\n');
  }
}
