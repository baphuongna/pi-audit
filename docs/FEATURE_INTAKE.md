# Feature Intake

Every implementation prompt enters the intake gate before code changes.

## Intake Flow

```text
User prompt
    |
    v
Classify input type
    |
    v
Restate as work item
    |
    v
Find affected product docs
    |
    v
Run risk checklist
    |
    v
Choose lane: tiny, normal, or high-risk
```

## Lanes

### Tiny

Use for low-risk docs, copy, names, or narrow edits.

Requirements:
- Patch directly.
- Keep affected docs current.
- Run available quick checks.

### Normal

Use for story-sized behavior with bounded blast radius.

Requirements:
- Create or update one story file.
- Link relevant product docs.
- Add or update validation expectations.
- Implement the smallest vertical slice.
- Update `docs/TEST_MATRIX.md`.

### High-Risk

Use when the work can affect security enforcement or produce false negatives.

Requirements:
- Create a story folder.
- Ask for human confirmation before implementation.
- Record a decision when behavior changes.

## Risk Checklist

| Risk flag | Applies when |
| --- | --- |
| Security model | Changes security detection logic |
| OWASP rules | Modifies OWASP Top 10 checks |
| False positive | Could break existing valid detections |
| False negative | Could miss existing vulnerabilities |
| API contract | Changes tool output format |
| Multi-perspective | Affects multiple review dimensions |

## Output

At the end of intake:

```text
Lane: normal
Reason: adds new OWASP check for SQL injection patterns
Story: docs/stories/US-XXX-new-owasp-check.md
Validation: unit tests, integration test
```
