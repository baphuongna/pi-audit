# Test Matrix

This file maps product behavior to proof.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Tool/Feature | Unit | Integration | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| US-001 | security_review tool | yes | no | implemented | test/unit/security-review.test.ts |
| US-002 | owasp_audit tool | yes | no | implemented | test/unit/owasp-audit.test.ts |
| US-003 | agent_shield tool | yes | no | implemented | test/unit/agent-shield.test.ts |
| US-004 | completion_guard tool | yes | no | implemented | test/unit/completion-guard.test.ts |
| US-005 | diff_analysis tool | yes | no | implemented | test/unit/diff-analysis.test.ts |
| US-006 | five_axis_review tool | yes | no | implemented | test/unit/five-axis-review.test.ts |

## Evidence Rules

- **Unit proof**: Tests for pure domain functions and security rules
- **Integration proof**: Tool registration and pi extension integration

## Validation Commands

```bash
npm test           # Run all unit tests
npm run lint       # Lint checks
npx tsc --noEmit   # TypeScript type check
```
