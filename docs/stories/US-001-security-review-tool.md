# US-001 Security Review Tool

## Status

implemented

## Lane

normal

## Product Contract

A security review tool that detects common vulnerability patterns in code.

## Relevant Product Docs

- `docs/product/SECURITY.md`

## Acceptance Criteria

- Detects SQL injection patterns
- Detects XSS patterns
- Detects authentication issues
- Returns structured findings with severity
- Works with TypeScript/JavaScript code

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | yes |
| Integration | no |

## Evidence

`test/unit/security-review.test.ts` - 100% pass rate
