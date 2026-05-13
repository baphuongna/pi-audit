/**
 * Diff Scopes - pi-audit
 * 
 * Configurable review scopes for focused code review.
 */

export type DiffScope = 'last-commit' | 'full-diff' | 'selected-files' | 'branch';

export interface DiffScopeConfig {
  scope: DiffScope;
  files?: string[];
  base?: string;
  head?: string;
  commit?: string;
}

export function createDiffScopes() {
  return {
    parse(config: DiffScopeConfig): DiffScopeConfig {
      return { scope: config.scope, files: config.files || [], base: config.base, head: config.head, commit: config.commit };
    },
    
    describe(scope: DiffScope): string {
      switch (scope) {
        case 'last-commit': return 'Review only files changed in the most recent commit';
        case 'full-diff': return 'Review all changes from base to head';
        case 'selected-files': return 'Review only specified files';
        case 'branch': return 'Review all changes on current branch';
        default: return 'Unknown scope';
      }
    },
    
    validate(config: DiffScopeConfig): { valid: boolean; error?: string } {
      if (config.scope === 'selected-files' && (!config.files || config.files.length === 0)) {
        return { valid: false, error: 'selected-files scope requires files array' };
      }
      if (config.scope === 'full-diff' && (!config.base || !config.head)) {
        return { valid: false, error: 'full-diff scope requires base and head' };
      }
      return { valid: true };
    }
  };
}
