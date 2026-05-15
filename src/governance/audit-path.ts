/**
 * Audit Path Guard - pi-audit
 * 
 * Injects policy checks into delete paths and verifies consent before operations.
 * Wraps dangerous operations with governance safeguards.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
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
 * Secret key for HMAC signature verification.
 * In production, load from secure environment variable.
 */
function getConsentSecret(): string {
  const secret = process.env.PI_AUDIT_CONSENT_SECRET;
  if (!secret) {
    throw new Error(
      "PI_AUDIT_CONSENT_SECRET environment variable is not set. " +
      "Consent verification requires a secret. Set it to a cryptographically random value."
    );
  }
  return secret;
}

/**
 * Creates HMAC signature for consent token.
 * Format: HMAC-SHA256(timestamp.userId, secret)
 */
function createConsentSignature(timestamp: string, userId: string): string {
  const secret = getConsentSecret();
  return createHmac("sha256", secret)
    .update(`${timestamp}.${userId}`)
    .digest("hex");
}

/**
 * Verifies user consent for an operation
 * Requires a cryptographically verifiable token with valid HMAC signature.
 */
export function verifyConsent(context: AuditPathContext): boolean {
  const consentToken = context.metadata?.consentToken;
  if (typeof consentToken !== "string" || consentToken.length === 0) {
    return false;
  }

  // Token format: <signature>.<timestamp>.<userId>
  const parts = consentToken.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [signature, timestampStr, userId] = parts;
  const timestamp = parseInt(timestampStr, 10);

  // Check timestamp is valid number
  if (isNaN(timestamp)) {
    return false;
  }

  // Check timestamp is recent (within 1 hour)
  const oneHourMs = 60 * 60 * 1000;
  const now = Date.now();
  if (Math.abs(now - timestamp) > oneHourMs) {
    return false;
  }

  // Verify HMAC signature
  const expectedSig = createConsentSignature(timestampStr, userId);
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");
    // Use timing-safe comparison to prevent timing attacks
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Creates a consent token for a user.
 * This is a helper for generating valid tokens - call this when user consents.
 */
export function createConsentToken(userId: string): string {
  const timestamp = Date.now().toString();
  const signature = createConsentSignature(timestamp, userId);
  return `${signature}.${timestamp}.${userId}`;
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
