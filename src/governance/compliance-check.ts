/**
 * Compliance Check - pi-audit
 * 
 * Validates operations against governance policy and generates audit trails
 * for compliance reporting.
 */

import type { GovernancePolicy, PrivacyLevel } from "./policy.ts";
import type { AuditPathContext, AuditPathResult } from "./audit-path.ts";

export interface ComplianceViolation {
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  timestamp: string;
  context?: AuditPathContext;
}

export interface ComplianceReport {
  passed: boolean;
  violations: ComplianceViolation[];
  timestamp: string;
  policySnapshot: GovernancePolicy;
}

/**
 * Creates a compliance checker for a given policy
 */
export function createComplianceChecker(policy: GovernancePolicy) {
  return {
    /**
     * Validates an operation against the policy
     */
    checkOperation(context: AuditPathContext): AuditPathResult {
      const violations: ComplianceViolation[] = [];

      // Check retention compliance
      if (context.metadata?.createdAt) {
        const age = Date.now() - new Date(context.metadata.createdAt as string).getTime();
        const retentionMs = policy.retentionDays * 24 * 60 * 60 * 1000;
        if (age > retentionMs) {
          violations.push({
            rule: "retention_period",
            severity: "medium",
            description: `Data exceeds retention period of ${policy.retentionDays} days`,
            timestamp: new Date().toISOString(),
            context,
          });
        }
      }

      // Check privacy level requirements
      if (policy.privacyLevel === "confidential" && context.operation === "delete") {
        if (!policy.auditLog) {
          violations.push({
            rule: "confidentiality_audit",
            severity: "critical",
            description: "Confidential operations must have audit logging enabled",
            timestamp: new Date().toISOString(),
            context,
          });
        }
      }

      // Check consent requirements
      if (policy.consentRequired && context.operation === "delete") {
        if (!context.userId) {
          violations.push({
            rule: "consent_required",
            severity: "high",
            description: "Delete operation requires user consent",
            timestamp: new Date().toISOString(),
            context,
          });
        }
      }

      if (violations.length > 0) {
        return {
          allowed: false,
          reason: `Compliance violations: ${violations.map((v) => v.rule).join(", ")}`,
          blocked: violations.some((v) => v.severity === "critical"),
        };
      }

      return { allowed: true, reason: "Policy compliance verified" };
    },

    /**
     * Generates a compliance report
     */
    generateReport(contexts: AuditPathContext[]): ComplianceReport {
      const violations: ComplianceViolation[] = [];

      for (const ctx of contexts) {
        const result = this.checkOperation(ctx);
        if (!result.allowed && ctx) {
          violations.push({
            rule: "policy_violation",
            severity: "high",
            description: result.reason,
            timestamp: new Date().toISOString(),
            context: ctx,
          });
        }
      }

      return {
        passed: violations.length === 0,
        violations,
        timestamp: new Date().toISOString(),
        policySnapshot: { ...policy },
      };
    },

    /**
     * Checks if a privacy level meets the policy requirement
     */
    meetsPrivacyRequirement(level: PrivacyLevel): boolean {
      const levels: PrivacyLevel[] = ["public", "private", "confidential"];
      const required = levels.indexOf(policy.privacyLevel);
      const provided = levels.indexOf(level);
      return provided >= required;
    },
  };
}

/**
 * Generates audit trail entries for compliance
 */
export function generateAuditEntry(
  context: AuditPathContext,
  policy: GovernancePolicy,
  result: AuditPathResult
): Record<string, unknown> {
  return {
    kind: result.allowed ? "compliance_passed" : "policy_violation",
    operation: context.operation,
    targetPath: context.targetPath,
    targetId: context.targetId,
    actor: context.userId,
    timestamp: context.timestamp,
    policy: {
      retentionDays: policy.retentionDays,
      privacyLevel: policy.privacyLevel,
      auditLog: policy.auditLog,
      consentRequired: policy.consentRequired,
    },
    result: {
      allowed: result.allowed,
      reason: result.reason,
      blocked: result.blocked || false,
    },
  };
}