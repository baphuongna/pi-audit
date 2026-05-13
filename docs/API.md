# pi-audit API Reference

## Classes

### FiveAxisReview

Comprehensive security and quality review.

```typescript
import { FiveAxisReview } from 'pi-audit';

const review = new FiveAxisReview();
const result = await review.analyze(code);
```

**Methods:**
- `analyze(code: string): Promise<ReviewResult>`
- `getScore(): ReviewScore`

### OWASPAudit

Automated OWASP vulnerability detection.

```typescript
import { OWASPAudit } from 'pi-audit';

const audit = new OWASPAudit();
const findings = await audit.scan(code);
```

**Methods:**
- `scan(code: string): Promise<Finding[]>`
- `getCategories(): OWASPCategory[]`

### AgentShield

Protection against prompt injection.

```typescript
import { AgentShield } from 'pi-audit';

const shield = new AgentShield();
const isSafe = shield.validate(input);
```

**Methods:**
- `validate(input: string): boolean`
- `sanitize(input: string): string`

### CompletionMutationGuard

Mutation detection for secure completion.

```typescript
import { CompletionMutationGuard } from 'pi-audit';

const guard = new CompletionMutationGuard();
const status = guard.check(original, mutated);
```

**Methods:**
- `check(original: string, mutated: string): MutationStatus`

## Types

```typescript
interface ReviewResult {
  security: number;
  performance: number;
  maintainability: number;
  testing: number;
  documentation: number;
  overall: number;
}

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location: Location;
  recommendation: string;
}
```
