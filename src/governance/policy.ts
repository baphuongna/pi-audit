/**
 * Governance Policy - pi-audit
 * 
 * Defines governance policy interfaces and configurations for privacy,
 * retention, audit logging, and consent requirements.
 */

export type PrivacyLevel = "public" | "private" | "confidential";

export interface GovernancePolicy {
  retentionDays: number;
  privacyLevel: PrivacyLevel;
  auditLog: boolean;
  consentRequired: boolean;
}

/**
 * Default governance policy with sensible defaults
 */
export const DEFAULT_POLICY: GovernancePolicy = {
  retentionDays: 365,
  privacyLevel: "private",
  auditLog: true,
  consentRequired: true,
};

/**
 * Strict policy for sensitive data
 */
export const STRICT_POLICY: GovernancePolicy = {
  retentionDays: 730,
  privacyLevel: "confidential",
  auditLog: true,
  consentRequired: true,
};

/**
 * Creates a policy with custom overrides
 */
export function createPolicy(overrides: Partial<GovernancePolicy>): GovernancePolicy {
  return { ...DEFAULT_POLICY, ...overrides };
}

/**
 * Validates a policy configuration
 */
export function isValidPolicy(policy: GovernancePolicy): boolean {
  return (
    typeof policy.retentionDays === "number" &&
    policy.retentionDays >= 1 &&
    typeof policy.privacyLevel === "string" &&
    ["public", "private", "confidential"].includes(policy.privacyLevel) &&
    typeof policy.auditLog === "boolean" &&
    typeof policy.consentRequired === "boolean"
  );
}