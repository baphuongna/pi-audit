# Harness

pi-audit is a security review and compliance audit extension for Pi coding agents.

## Mental Model

```text
User intent
    |
    v
Feature intake (classify risk)
    |
    v
Story packet (if needed)
    |
    v
Agent work loop
    |
    v
Product delta (code, tests, docs)
    |
    v
Validation proof (tests pass)
    |
    v
Harness delta (update docs, backlog)
```

Every task has two possible outputs:

1. **Product delta**: code changes, tests, security rules, or documentation.
2. **Harness delta**: docs, templates, validation expectations, or backlog items.

## Source Hierarchy

```text
README.md
  extension overview and quick start

docs/product/*
  current security contracts and rules

docs/stories/*
  story-sized work packets

docs/TEST_MATRIX.md
  behavior-to-proof control panel

docs/decisions/*
  why security rules changed
```

## Input Types

| Type | Use when | Typical artifact |
| --- | --- | --- |
| New check | Adding new security vulnerability detection | Story packet |
| Rule update | Changing OWASP or security rule definitions | Story packet |
| Bug fix | False positive or missing detection | Story packet |
| Harness improvement | Improving how agents collaborate | `docs/HARNESS_BACKLOG.md` |

## Validation Ladder

```text
validate:quick
  format, lint, typecheck, unit tests

test:integration
  security rule enforcement
```

## Growth Rule

When an agent is confused, finds a missing rule, or sees a recurring failure pattern, it must improve the harness directly or add to `HARNESS_BACKLOG.md`.

## Security Review Perspectives

1. **Security** - Vulnerability detection, OWASP Top 10
2. **Performance** - Resource usage, algorithmic efficiency
3. **Maintainability** - Code complexity, duplication
4. **Testing** - Test coverage, edge cases
5. **Documentation** - Comments, README, API docs
6. **Production Readiness** - Error handling, logging, monitoring
