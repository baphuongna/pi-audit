# pi-audit

Security review and compliance audit extension for Pi coding agents. Provides multi-perspective code review with automated vulnerability detection.

## Features

- **Five-Axis Review** - Security, Performance, Maintainability, Testing, Documentation
- **OWASP Audit** - Automated vulnerability detection based on OWASP Top 10
- **AgentShield** - Protection against prompt injection and malicious instructions
- **CompletionMutationGuard** - Mutation detection for secure completion
- **Diff Analysis** - Multi-perspective code review with diff scoping

## Install

```bash
pi install npm:pi-audit
```

## Quick Start

### Run Full Security Review
```bash
/review
```

### Review Changes in PR
```bash
/review diff --base=main --head=feature-branch
```

### Security-Focused Review
```bash
/review security
```

### Generate Report
```bash
/review report --format=markdown --groupBy=severity
```

## Commands

| Command | Description |
|---------|-------------|
| `/review` | Run full multi-perspective review |
| `/review security` | Security-focused review |
| `/review performance` | Performance-focused review |
| `/review diff` | Review git diff |
| `/review file <path>` | Review specific file |
| `/review report` | Generate summary report |

## Review Perspectives

The extension reviews code across 6 perspectives:

1. **Security** - Vulnerability detection, OWASP Top 10
2. **Performance** - Resource usage, algorithmic efficiency
3. **Maintainability** - Code complexity, duplication
4. **Testing** - Test coverage, edge cases
5. **Documentation** - Comments, README, API docs
6. **Production Readiness** - Error handling, logging, monitoring

## Configuration

### Review Configuration
```javascript
// In your agent config
{
  "review": {
    "perspectives": ["security", "performance"],
    "maxFiles": 50,
    "severity": ["critical", "high", "medium"]
  }
}
```

## Verify

```bash
pi list
```

## License

MIT
