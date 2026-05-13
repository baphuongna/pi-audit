# pi-audit

Security review and compliance audit extension for Pi coding agents.

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

## Usage

### Run Full Security Review
```bash
/review
```

### Audit Specific Target
```bash
/audit src/auth/
```

### Security-Focused Review
```bash
/security
```

## Verify

```bash
pi list
```

## License

MIT
