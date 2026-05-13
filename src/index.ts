import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerPiReview } from "./src/extension/register.ts";

export default function (pi: ExtensionAPI): void {
	registerPiReview(pi);
}

// Category audit exports
export { createCategoryAnalyzer, type CategorizedFinding, type CategorySummary, type AuditCategory } from './review/category-audit.js';

// Audit trail exports
export { createAuditTrail, type AuditEntry, type AuditTrailOptions } from './audit/audit-trail.js';

// Diff scopes exports
export { createDiffScopes, type DiffScope, type DiffScopeConfig, type DiffResult } from './diff/diff-scopes.js';

// Audit trail exports
export { createAuditTrail, type AuditEntry, type AuditTrailOptions } from './audit/audit-trail.js';

// Diff scopes exports
export { createDiffScopes, type DiffScope, type DiffScopeConfig } from './diff/diff-scopes.js';
