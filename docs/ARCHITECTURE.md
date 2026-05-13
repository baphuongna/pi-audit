# Architecture

## Extension Structure

```
pi-audit/
├── src/
│   ├── extension/        # Pi extension registration
│   ├── review/            # Multi-perspective review logic
│   ├── security/          # Security and OWASP checks
│   ├── guard/             # Completion guards
│   ├── diff/              # Diff analysis
│   └── types.ts           # Shared types
├── skills/                # pi-crew skills
│   └── security-review/   # Security review skill
├── test/
│   └── unit/              # Unit tests
└── docs/
    └── product/           # Product contracts
```

## Core Components

### Security Tools

| Tool | Purpose |
| --- | --- |
| `security_review` | Generic security vulnerability detection |
| `owasp_audit` | OWASP Top 10 specific checks |
| `agent_shield` | Prompt injection protection |
| `completion_guard` | Detects mutation in completions |

### Review System

| Component | Purpose |
| --- | --- |
| `five_axis_review` | Orchestrates multi-perspective review |
| `diff_analysis` | Analyzes code changes |
| `severity` | Determines finding severity |

## Extension Registration

Tools are registered via `src/extension/register.ts` using the Pi Extension API.

## Testing Strategy

- **Unit tests**: Pure functions, security rules, detection logic
- **No integration tests**: Relies on pi-crew integration tests

## Dependencies

- `@earendil-works/pi-coding-agent` - Pi extension API
- TypeScript with strict mode
