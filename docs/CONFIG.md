# Configuration - pi-audit

## Configuration File

Create `pi-audit.config.json` in your project:

```json
{
  "review": {
    "perspectives": ["security", "performance", "maintainability"],
    "maxFiles": 50,
    "severity": ["critical", "high", "medium"],
    "excludePatterns": ["*.test.ts", "*.spec.ts", "node_modules/**"]
  },
  "security": {
    "owasp": true,
    "injectionCheck": true,
    "sensitiveDataCheck": true
  },
  "output": {
    "format": "markdown",
    "groupBy": "file"
  },
  "failOn": {
    "critical": true,
    "high": false,
    "medium": false
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PI_AUDIT_BASE` | Default base ref | HEAD~1 |
| `PI_AUDIT_FORMAT` | Default output format | markdown |
| `PI_AUDIT_FAIL_ON` | Fail on severity | critical |

## Per-Project Config

Add to `package.json`:

```json
{
  "pi-audit": {
    "review": {
      "perspectives": ["security"]
    }
  }
}
```

## CLI Config

```bash
# Set default base
export PI_AUDIT_BASE=main

# Set fail level
export PI_AUDIT_FAIL_ON=high
```

## Perspective Configuration

### Security Perspective
```json
{
  "security": {
    "owasp": true,
    "checks": ["injection", "xss", "csrf", "auth"],
    "excludePatterns": ["test/**"]
  }
}
```

### Performance Perspective
```json
{
  "performance": {
    "maxComplexity": 15,
    "maxDepth": 5,
    "checkNplus1": true
  }
}
```

### Testing Perspective
```json
{
  "testing": {
    "minCoverage": 80,
    "requiredTests": ["critical-paths"]
  }
}
```
