# User Guide - pi-audit

## Overview

pi-audit provides comprehensive code review capabilities for Pi coding agents. It analyzes code across multiple perspectives and generates actionable findings.

## Review Types

### 1. Full Review
Analyzes all changed files across all perspectives.

```bash
/review
```

### 2. Targeted Review
Focus on specific files or directories.

```bash
/review file src/api/
/review file src/auth/ src/payment/
```

### 3. Perspective-Focused Review
Deep analysis on one perspective.

```bash
/review security     # Security only
/review performance  # Performance only
```

### 4. Diff Review
Review specific git changes.

```bash
/review diff --base=main --head=feature
```

## Output Formats

### Inline Review
Findings displayed inline with code:

```
src/auth/login.ts:42 [CRITICAL] SQL Injection
  Query: "SELECT * FROM users WHERE id=" + userId
  Fix: Use parameterized query
```

### Report Format
Structured report generation:

```bash
/review report --format=markdown
/review report --format=json
```

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| Critical | Immediate security risk | Fix immediately |
| High | Significant vulnerability | Fix soon |
| Medium | Code quality issue | Fix in sprint |
| Low | Minor improvement | Fix when convenient |

## Integration with Workflow

### Pre-commit Hook
```bash
# Add to pre-commit
pi-audit --staged --fail-on=critical
```

### CI Integration
```yaml
# .github/workflows/review.yml
- name: Security Review
  run: pi-audit --base=main --fail-on=critical
```

## Best Practices

1. **Run early** - Review before merging
2. **Fix critical first** - Prioritize security issues
3. **Use reports** - Track issues over time
4. **Configure thresholds** - Set fail-on levels for CI

## Advanced Usage

### Custom Perspectives
```bash
/review --perspectives=security,performance,maintainability
```

### File Filters
```bash
/review --include=*.ts --exclude=*.test.ts
```

### Auto-fix Suggestions
```bash
/review --suggest-fixes
```
