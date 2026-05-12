---
name: security-review
description: Comprehensive security review with AgentShield scanning and multi-perspective analysis
triggers:
  - security
  - audit
  - vulnerability
  - scan
  - review code
  - check security
requirements:
  tools: [read, bash]
  context: [code files to review]
---

# Security Review Skill

## Objective
Perform comprehensive security review using AgentShield scanning, OWASP Top 10 + STRIDE analysis, and multi-perspective review.

## When to Use
- When user asks to "review code for security" or "audit this"
- Before merging security-sensitive code
- After implementing authentication, payment, or data handling
- When user says "check for vulnerabilities"

## Workflow

### Step 1: AgentShield Scan
```typescript
import { AgentShield } from '../../src/security/agent-shield';

const shield = new AgentShield();

// Scan code
const result = shield.scan(code);

if (!result.passed) {
  console.log('Security issues found!');
  console.log(shield.formatReport(result));
}
```

### Step 2: OWASP + STRIDE Audit
```typescript
import { OWASPAuditor } from '../../src/security/owasp-audit';

const auditor = new OWASPAuditor();
const audit = auditor.audit(code);

console.log(auditor.formatReport(audit));
```

### Step 3: Multi-Perspective Review
```typescript
import { MultiPerspectiveReviewer } from '../../src/review/multi-perspective';

const reviewer = new MultiPerspectiveReviewer();
const review = reviewer.review(code, {
  project: 'my-project',
  goal: 'Implement secure authentication'
});

console.log(reviewer.formatReport(review));
```

## Security Checks

### AgentShield Rules (102 rules)
- **Injection**: eval, exec, new Function
- **SQL Injection**: String concatenation in queries
- **XSS**: innerHTML, document.write
- **Path Traversal**: Dynamic file paths
- **Auth**: Hardcoded passwords, weak crypto
- **Secrets**: API keys, tokens in code
- **Prototype Pollution**: __proto__ manipulation

### OWASP Top 10 Categories
| Category | Description |
|----------|-------------|
| A01 | Broken Access Control |
| A02 | Cryptographic Failures |
| A03 | Injection |
| A04 | Insecure Design |
| A05 | Security Misconfiguration |
| A06 | Vulnerable Components |
| A07 | Authentication Failures |
| A08 | Data Integrity |
| A09 | Logging Failures |
| A10 | SSRF |

### STRIDE Categories
- **Spoofing**: Impersonation attacks
- **Tampering**: Data modification
- **Repudiation**: Denying actions
- **Information Disclosure**: Data exposure
- **Denial of Service**: Service disruption
- **Elevation of Privilege**: Unauthorized access

## Examples

### Basic Security Scan
```
User: Scan this code for security issues
Agent:
  const shield = new AgentShield();
  const result = shield.scan(userCode);
  console.log(shield.formatReport(result));
```

### Full OWASP Audit
```
User: Run OWASP audit on the auth module
Agent:
  const auditor = new OWASPAuditor();
  const audit = auditor.audit(authCode);
  console.log(auditor.formatReport(audit));
```

### Multi-Perspective Review
```
User: Review this code from security, quality, and performance perspectives
Agent:
  const reviewer = new MultiPerspectiveReviewer();
  const result = reviewer.review(code, { goal: 'Secure API' });
  console.log(reviewer.formatReport(result));
```

## Output Format

### AgentShield Report
```markdown
## Security Scan Report
**Status:** ❌ FAILED

### Summary
- 🔴 Critical: 2
- 🟠 High: 3
- 🟡 Medium: 1

### Issues
- **Injection** at line 5
  - Dangerous eval() usage
  - `eval(userInput)`
  - 💡 Use safe alternatives
```

### OWASP Report
```markdown
## OWASP Top 10 + STRIDE Audit
**Status:** ⚠️ NEEDS ATTENTION

### Compliance
| A01 Broken Access Control | ❌ |
| A02 Cryptographic Failures | ✅ |
| A03 Injection | ❌ |
...
```

## Integration

### With pi-pipeline
```typescript
// Run security scan as quality gate
const shield = new AgentShield();
const result = shield.scan(code);

if (result.summary.critical > 0) {
  throw new Error('Critical security issues must be fixed');
}
```

### CI/CD Integration
```bash
# Pre-commit security check
npx tsx security-scan.ts src/

# Fail if critical issues
if [ $? -ne 0 ]; then
  echo "Security issues found!"
  exit 1
fi
```
