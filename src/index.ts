import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerPiReview } from "./extension/register.ts";

export default function (pi: ExtensionAPI): void {
	registerPiReview(pi);
}

// Category audit exports
export { createCategoryAnalyzer, type CategorizedFinding, type CategorySummary, type AuditCategory } from './review/category-audit.js';

// Audit trail exports
export { createAuditTrail, type AuditEntry, type AuditTrailOptions } from './audit/audit-trail.js';

// Diff scopes exports
export { createDiffScopes, type DiffScope, type DiffScopeConfig } from './diff/diff-scopes.js';

// Governance exports
export {
  DEFAULT_POLICY,
  STRICT_POLICY,
  createPolicy,
  isValidPolicy,
  createDeletePathGuard,
  createConsentVerifier,
  createComplianceChecker,
  generateAuditEntry,
  type GovernancePolicy,
  type PrivacyLevel,
  type AuditPathContext,
  type AuditPathResult,
  type ComplianceViolation,
  type ComplianceReport,
} from './governance/index.js';
