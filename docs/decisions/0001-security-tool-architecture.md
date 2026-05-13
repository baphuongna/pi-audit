# 0001 Security Tool Architecture

Date: 2026-05-13

## Status

Accepted

## Context

pi-audit needs to provide security vulnerability detection as a Pi extension tool.

## Decision

Create separate tools for each security function:
- `security_review`: Generic vulnerability detection
- `owasp_audit`: OWASP Top 10 specific checks
- `agent_shield`: Prompt injection protection
- `completion_guard`: Mutation detection

Each tool is self-contained and can be used independently.

## Consequences

Positive:
- Tools can be used individually or in combination
- Easy to test each tool in isolation
- Clear ownership per tool

Tradeoffs:
- Some code duplication between tools
- May need orchestration layer later
