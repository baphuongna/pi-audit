# pi-audit

Security review and compliance audit extension for coding agents.

## Features

- **Five-Axis Review** - Security, Performance, Maintainability, Testing, Documentation
- **OWASP Audit** - Automated vulnerability detection based on OWASP Top 10
- **AgentShield** - Protection against prompt injection and malicious instructions
- **CompletionMutationGuard** - Mutation detection for secure completion
- **Levenshtein Distance** - Fuzzy matching for similarity detection

## Installation

```bash
npm install pi-audit
```

## Usage

After installation, the extension registers with the coding agent automatically.

### Review Commands

- `/review` - Run full security review
- `/audit [target]` - Audit specific target (file, function, module)
- `/security` - Security-focused review

### Configuration

```typescript
// Optional configuration
{
  rules: {
    owasp: true,
    complexity: 15,
    securityScore: 80,
  }
}
```

## Architecture

```
src/
├── review/
│   ├── five-axis-review.ts  # Multi-dimensional review
│   └── multi-perspective.ts # Perspective analysis
├── security/
│   ├── owasp-audit.ts      # OWASP compliance
│   └── agent-shield.ts      # Prompt protection
├── guard/
│   └── completion-guard.ts # Mutation detection
└── index.ts
```

## Patterns Applied

- AgentShield pattern from everything-claude-code
- OWASP audit from vetc-dev-kit security
- CompletionMutationGuard from pi-crew

## License

MIT
