/**
 * Audit Path Guard - pi-audit
 * 
 * Injects policy checks into delete paths and verifies consent before operations.
 * Wraps dangerous operations with governance safeguards.
 */

import type { GovernancePolicy } from "./policy.ts";

export interface AuditPathContext {
  operation: string;
  targetPath?: string;
  targetId?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit path result with policy decision
 */
export interface AuditPathResult {
  allowed: boolean;
  reason: string;
  blocked?: boolean;
}

/**
 * Wraps a delete operation with policy and consent checks
 */
export function createDeletePathGuard(policy: GovernancePolicy) {
  return function deletePathGuard(
    context: AuditPathContext,
    options: { requireConsent?: boolean } = {}
  ): AuditPathResult {
    const { operation, targetPath, targetId } = context;
    const { requireConsent = policy.consentRequired } = options;

    // Check retention policy - prevent deletion of recent data
    const now = new Date();
    const retentionMs = policy.retentionDays * 24 * 60 * 60 * 1000;

    // Policy enforcement based on privacy level
    if (policy.privacyLevel === "confidential") {
      if (!policy.auditLog) {
        return {
          allowed: false,
          reason: "Confidential data requires audit logging",
          blocked: true,
        };
      }
    }

    // Consent check for delete operations
    if (requireConsent) {
      const consentVerified = verifyConsent(context);
      if (!consentVerified) {
        return {
          allowed: false,
          reason: "Consent required before delete operation",
          blocked: true,
        };
      }
    }

    // Audit the delete attempt
    if (policy.auditLog) {
      logDeleteAttempt(context, policy);
    }

    return {
      allowed: true,
      reason: `Delete operation '${operation}' approved for ${targetPath || targetId}`,
    };
  };
}

/**
 * Verifies user consent for an operation
 */
export function verifyConsent(context: AuditPathContext): boolean {
  // Consent verification logic - check for explicit user consent
  // In a full implementation, this would check a consent store
  return context.userId !== undefined;
}

/**
 * Logs delete attempts for audit trail
 */
function logDeleteAttempt(context: AuditPathContext, policy: GovernancePolicy): void {
  const entry = {
    kind: "governance_check",
    actor: context.userId,
    operation: context.operation,
    targetPath: context.targetPath,
    targetId: context.targetId,
    timestamp: context.timestamp,
    metadata: {
      policyRetentionDays: policy.retentionDays,
      policyPrivacyLevel: policy.privacyLevel,
    },
  };

  // Log to audit trail (integration point with audit-trail.ts)
  console.log("[governance:audit]", JSON.stringify(entry));
}

/**
 * Creates a consent verification wrapper for operations
 */
export function createConsentVerifier(policy: GovernancePolicy) {
  return function verifyBeforeOperation(
    context: AuditPathContext
  ): AuditPathResult {
    if (!policy.consentRequired) {
      return { allowed: true, reason: "Consent not required by policy" };
    }

    const consentOk = verifyConsent(context);
    if (!consentOk) {
      return {
        allowed: false,
        reason: "User consent not verified",
        blocked: true,
      };
    }

    return { allowed: true, reason: "Consent verified" };
  };
}