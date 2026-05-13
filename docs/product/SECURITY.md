# Security Review Contracts

## Core Principle

pi-audit must detect security vulnerabilities without producing false positives that annoy developers or false negatives that miss real risks.

## Security Review Tool

**Purpose**: Generic security vulnerability detection for code under review.

**Input**: Code content (string)

**Output**: Array of security findings with:
- `type`: vulnerability type
- `severity`: critical | high | medium | low | info
- `message`: human-readable description
- `location`: file, line, column
- `rule`: which rule was triggered

**Rules**:
- SQL injection patterns
- XSS patterns
- Authentication issues
- Cryptography misuse
- Path traversal
- Command injection
- Insecure dependencies

## OWASP Audit Tool

**Purpose**: OWASP Top 10 compliance checking.

**Input**: Code content (string)

**Output**: Array of OWASP findings with:
- `category`: A01-A10 OWASP category
- `severity`: critical | high | medium | low
- `cwe`: CWE identifier
- `description`: OWASP-specific description

## Agent Shield Tool

**Purpose**: Detect prompt injection attempts.

**Input**: Text content (string)

**Output**: Shield findings with:
- `type`: injection type
- `confidence`: high | medium | low
- `matched`: the suspicious pattern

## Completion Guard

**Purpose**: Detect if a completion has been mutated.

**Input**: Original content, received content

**Output**: Mutation status and details if mutated.

## Severity Levels

| Level | Meaning | Action |
| --- | --- | --- |
| critical | Direct vulnerability | Must fix |
| high | Likely vulnerability | Should fix |
| medium | Potential issue | Consider fixing |
| low | Style/observation | Nice to fix |
| info | Informational | No action needed |
