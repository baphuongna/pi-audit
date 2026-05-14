# pi-audit Agent Operating Guide

## Extension Purpose

pi-audit provides security review, compliance audit, and multi-perspective code review for Pi coding agents.

## Source Of Truth

1. `README.md` - Extension overview
2. `skills/security-review/SKILL.md` - Skill documentation for agents
3. `docs/HARNESS.md` - Operating model
4. `docs/FEATURE_INTAKE.md` - Intake process
5. `docs/product/` - Product contracts
6. `docs/stories/` - Story packets
7. `docs/TEST_MATRIX.md` - Proof status
8. `docs/decisions/` - Decision records

## Extension Capabilities

### Core Tools
- `review_diff` - Review git diff with multi-perspective analysis
- `review_file` - Review a single file with multi-perspective analysis
- `review_report` - Generate a formatted review report

### Skills
- `skills/security-review/SKILL.md` - Security vulnerability detection, OWASP audit, STRIDE analysis

## When to Use This Extension

- Security review requests
- Vulnerability scanning
- OWASP compliance checking
- Multi-perspective code review

## Validation Commands

```bash
npm test
npm run lint
npx tsc --noEmit
```
