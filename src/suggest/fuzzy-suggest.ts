/**
 * Fuzzy Suggestion Engine - Levenshtein-based typo correction
 * Pattern from: pi-crew/src/config/suggestions.ts
 */

/**
 * Classic Levenshtein edit distance between two strings.
 * Uses single-row DP for O(min(n,m)) memory.
 */
export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Single-row DP to keep memory O(min(n,m))
  let prev = new Uint32Array(lb + 1);
  let curr = new Uint32Array(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }

  return prev[lb];
}

const DEFAULT_MAX_DISTANCE = 3;

/**
 * Find the closest matching key from a list of valid keys.
 * Case-insensitive. Returns null if no match within maxDistance.
 */
export function findClosestKey(
  input: string,
  validKeys: readonly string[],
  maxDistance: number = DEFAULT_MAX_DISTANCE
): string | null {
  if (validKeys.length === 0) return null;

  const lower = input.toLowerCase();
  let bestKey: string | null = null;
  let bestDist = maxDistance + 1;

  for (const key of validKeys) {
    const dist = levenshtein(lower, key.toLowerCase());
    if (dist < bestDist) {
      bestDist = dist;
      bestKey = key;
    }
  }

  return bestDist <= maxDistance ? bestKey : null;
}

/**
 * Suggest the closest known key for a potentially mistyped input.
 */
export function suggestKey(input: string, knownKeys: readonly string[]): string | null {
  return findClosestKey(input, knownKeys);
}

/**
 * Suggest multiple close matches with their distances.
 */
export function suggestMultiple(
  input: string,
  validKeys: readonly string[],
  maxDistance: number = DEFAULT_MAX_DISTANCE,
  limit = 5
): Array<{ key: string; distance: number }> {
  if (validKeys.length === 0) return [];

  const lower = input.toLowerCase();
  const matches: Array<{ key: string; distance: number }> = [];

  for (const key of validKeys) {
    const dist = levenshtein(lower, key.toLowerCase());
    if (dist <= maxDistance) {
      matches.push({ key, distance: dist });
    }
  }

  return matches
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Suggestion engine for security rules
 */
export interface RuleSuggestion {
  rule: string;
  distance: number;
  category?: string;
}

export class SecurityRuleSuggester {
  private rules: Map<string, { category: string; description: string }>;

  constructor() {
    this.rules = new Map();
  }

  /**
   * Register a security rule
   */
  register(id: string, category: string, description: string): void {
    this.rules.set(id.toLowerCase(), { category, description });
  }

  /**
   * Register multiple rules at once
   */
  registerBatch(rules: Array<{ id: string; category: string; description: string }>): void {
    for (const rule of rules) {
      this.register(rule.id, rule.category, rule.description);
    }
  }

  /**
   * Suggest the closest matching rule
   */
  suggest(input: string): RuleSuggestion | null {
    const closest = findClosestKey(input, [...this.rules.keys()]);
    if (!closest) return null;
    
    const rule = this.rules.get(closest);
    return {
      rule: closest,
      distance: levenshtein(input.toLowerCase(), closest),
      category: rule?.category
    };
  }

  /**
   * Suggest multiple rules
   */
  suggestMultiple(input: string, limit = 5): RuleSuggestion[] {
    const matches = suggestMultiple(input, [...this.rules.keys()], 5, limit);
    return matches.map(match => ({
      rule: match.key,
      distance: match.distance,
      category: this.rules.get(match.key)?.category
    }));
  }

  /**
   * Get all registered rules
   */
  getRules(): string[] {
    return [...this.rules.keys()];
  }

  /**
   * Get rules by category
   */
  getByCategory(category: string): string[] {
    const result: string[] = [];
    for (const [key, value] of this.rules) {
      if (value.category === category) {
        result.push(key);
      }
    }
    return result;
  }
}
