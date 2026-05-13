# Command Reference - pi-audit

## Slash Commands

### /review
Main review command.

```bash
/review [subcommand] [options]
```

#### Subcommands

- `security` - Security-focused review
- `performance` - Performance-focused review
- `diff` - Review git diff
- `file <path>` - Review specific file
- `report` - Generate report

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--base <ref>` | Base git ref | HEAD~1 |
| `--head <ref>` | Head git ref | HEAD |
| `--staged` | Review staged changes | false |
| `--context` | Context mode (full/changed) | changed |
| `--maxFiles <n>` | Max files to review | 50 |
| `--format` | Output format (markdown/json/summary) | markdown |

### /security
Quick security scan.

```bash
/security [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--owasp` | Include OWASP Top 10 checks |
| `--sensitive` | Check for sensitive data exposure |
| `--injection` | Check for injection vulnerabilities |

### /review-file
Review specific file.

```bash
/review file <path> [options]
```

## Tools

### review_diff
Review git diff programmatically.

```javascript
await review_diff({
  base: "main",
  head: "feature",
  perspectives: ["security", "performance"],
  maxFiles: 50
})
```

### review_file
Review single file.

```javascript
await review_file({
  file: "src/auth/login.ts",
  context: "full",
  perspectives: ["security"]
})
```

### review_report
Generate report from findings.

```javascript
await review_report({
  format: "markdown",
  groupBy: "severity",
  includeSuggestions: true
})
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success, no issues |
| 1 | Issues found |
| 2 | Review error |
| 10 | Blocked by critical issues |
| 11 | Blocked by configuration |
