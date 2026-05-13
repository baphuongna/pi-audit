# Quick Start - pi-audit

## Installation

```bash
pi install npm:pi-audit
```

## Basic Usage

### Run Full Security Review

```bash
# In your coding agent
/review
```

### Audit Specific Target

```bash
/audit src/auth/login.ts
```

### Security Focus

```bash
/security
```

## Configuration

```typescript
// In your config
{
  "pi-audit": {
    "rules": {
      "owasp": true,
      "complexity": 15,
      "securityScore": 80
    }
  }
}
```

## Examples

### Five-Axis Review

```typescript
import { FiveAxisReview } from 'pi-audit';

const review = new FiveAxisReview();
const result = await review.analyze(`
function authenticate(user, pass) {
  // Check credentials
  return user === 'admin' && pass === 'secret';
}
`);

console.log(result);
// { security: 30, performance: 80, ... }
```

### AgentShield

```typescript
import { AgentShield } from 'pi-audit';

const shield = new AgentShield();

// Validate user input
if (!shield.validate(userInput)) {
  console.log('Potential injection detected');
}

// Sanitize
const safe = shield.sanitize(userInput);
```

## Next Steps

- Read [API.md](API.md) for full API reference
- Check [SPEC.md](../SPEC.md) for feature details
