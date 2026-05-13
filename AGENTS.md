# pi-audit Agent Operating Guide

## Extension Purpose

pi-audit provides security review, compliance audit, and multi-perspective code review for Pi coding agents. It helps identify vulnerabilities, security risks, and compliance issues before code reaches production.

## Source Of Truth

Read in this order:

1. `README.md` for extension overview.
2. `docs/HARNESS.md` for the human-agent operating model.
3. `docs/FEATURE_INTAKE.md` before turning any request into work.
4. `docs/ARCHITECTURE.md` before proposing implementation changes.
5. `docs/product/` for current product contracts.
6. `docs/stories/` for story packets and backlog.
7. `docs/TEST_MATRIX.md` for proof status.
8. `docs/decisions/` for why important choices were made.

## Extension Capabilities

### Core Tools
- `security_review` - Security vulnerability detection
- `owasp_audit` - OWASP Top 10 compliance checking
- `agent_shield` - Prompt injection protection
- `completion_guard` - Mutation detection
- `diff_analysis` - Multi-perspective diff review
- `five_axis_review` - Complete review across 6 perspectives

### Commands
- `/review` - Run full multi-perspective review
- `/review security` - Security-focused review
- `/review diff --base=X --head=Y` - Review git diff
- `/review report --format=markdown` - Generate report

## Task Loop

For every task:

1. Classify the request with `docs/FEATURE_INTAKE.md`.
2. Identify affected product docs and story files.
3. Check `docs/TEST_MATRIX.md` for existing proof and gaps.
4. Work only inside the selected lane: tiny, normal, or high-risk.
5. Before finishing, ask:
   - Did product truth change?
   - Did validation expectations change?
   - Did architecture rules change?
   - Did we discover a repeated failure pattern?
6. Update routine harness files directly, or add to `docs/HARNESS_BACKLOG.md`.

## Validation Commands

```text
npm test                    # Unit tests
npm run lint               # Lint checks
npx tsc --noEmit          # TypeScript type check
```

## Done Definition

A task is done when:

- The requested change is completed or the blocker is documented.
- Relevant docs, stories, and test matrix entries remain current.
- Validation commands were run when they exist.
- Missing harness capabilities were added to `docs/HARNESS_BACKLOG.md`.
