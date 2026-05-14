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
  tools: [review_diff, review_file, review_report, read, bash]
  context: [code files to review]
---

# Security Review Skill

## Objective
Perform comprehensive security review using AgentShield scanning, OWASP Top 10 + STRIDE analysis, and multi-perspective review.

## Tools Available
- `review_diff` - Review git diff with multi-perspective analysis
- `review_file` - Review a single file with multi-perspective analysis
- `review_report` - Generate a formatted review report from findings

## When to Use
- When user asks to "review code for security" or "audit this"
- Before merging security-sensitive code
- After implementing authentication, payment, or data handling
- When user says "check for vulnerabilities"

## Workflow

### Step 1: Review Diff or File
```typescript
// Review git diff
review_diff({ base: "HEAD~1", head: "HEAD" });

// Or review a single file
review_file({ file: "src/auth/login.ts", context: "full" });
```

### Step 2: Generate Report
```typescript
review_report({
  format: "markdown",
  groupBy: "severity",
  includeSuggestions: true
});
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
Agent: review_diff({ base: "HEAD~1" })
```

### Full File Review
```
User: Review the auth module for security
Agent: review_file({ file: "src/auth/*", perspectives: ["security"] })
```

### Generate Report
```
Agent: review_report({ format: "markdown" })
```

## Output Format

### Review Report
```markdown
## Security Review Report
**Status:** ❌ FAILED

### Summary
- 🔴 Critical: 2
- 🟠 High: 3
- 🟡 Medium: 1

### Issues by Severity
- **CRITICAL**: SQL Injection at line 42
- **HIGH**: Hardcoded credentials at line 15
```

## Integration

### With pi-pipeline
```typescript
// Run security scan as quality gate
review_diff({ base: "HEAD~1" });
// Fail if critical issues found
```

## Integration with pi-recollect

**IMPORTANT: Store findings in memory to avoid repeating work**

### After Finding Vulnerabilities

```typescript
// Store security pattern found
memory_store({
  category: "security",
  title: "SQL Injection in user input",
  content: `Location: src/db/query.ts:42
Pattern: String concatenation in SQL query
Fix: Use parameterized queries
Prevention: ESLint rule sql-injection`,
  metadata: { severity: "high", type: "sql-injection" }
})
```

### Before Security Review

```typescript
// Search for previous findings
memory_search({
  query: "SQL injection authentication",
  maxResults: 3
})

// Check for known patterns
memory_search({
  query: "security auth login",
  scope: "solutions"
})
```

### Why This Matters

- Agent remembers "this project had SQL injection issues before"
- Agent can check if similar patterns exist elsewhere
- Avoids re-finding the same vulnerability multiple times
- Speeds up future security reviews

## Token Optimization

Without memory:
1. Find SQL injection → Fix it
2. Session ends
3. Next session: Find SQL injection AGAIN (waste tokens)

With memory:
1. Find SQL injection → Fix it
2. memory_store findings
3. Next session: memory_search → Found it before! → Skip
