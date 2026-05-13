# Quick Start - pi-audit

## Installation

```bash
pi install npm:pi-audit
```

## Basic Usage

### 1. Review Current Changes

```bash
# Review unstaged changes
/review

# Review staged changes
/review diff --staged

# Review changes between branches
/review diff --base=main --head=feature-branch
```

### 2. Security Review

```bash
# Quick security scan
/security

# Full OWASP audit
/review security --owasp
```

### 3. File Review

```bash
# Review specific file
/review file src/auth/login.ts

# Review with full context
/review file src/auth/login.ts --context=full
```

### 4. Generate Report

```bash
# Markdown report grouped by severity
/review report --format=markdown --groupBy=severity

# JSON report grouped by file
/review report --format=json --groupBy=file
```

## Examples

### Example: Review Authentication Code

```
/review file src/auth/authentication.ts
```

Output:
```
## Security Review: src/auth/authentication.ts

### Critical Issues
- [C1] SQL Injection vulnerability in line 42
- [C2] Missing rate limiting on login endpoint

### High Issues
- [H1] Password stored without proper hashing

### Recommendations
- Use parameterized queries
- Implement account lockout policy
```

### Example: Diff Review

```
/review diff --base=HEAD~1 --head=HEAD
```

## Next Steps

- Read [docs/GUIDE.md](GUIDE.md) for advanced usage
- Read [docs/COMMANDS.md](COMMANDS.md) for command reference
- Read [docs/CONFIG.md](CONFIG.md) for configuration options
