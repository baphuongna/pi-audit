/**
 * Boil the Lake — Completeness Validation for pi-audit
 * 
 * Pattern from gstack ethos: "AI-assisted coding makes the marginal cost of 
 * completeness near-zero. When the complete implementation costs minutes more 
 * than the shortcut — do the complete thing. Every time."
 * 
 * @see research-findings/18-gstack-gsd2-patterns.md
 */

import type { ReviewDiffParams, ReviewFileParams } from "../types.ts";

/**
 * Input requirements for a thorough review
 */
export interface CompletenessChecklist {
  hasBase: boolean;
  hasHead: boolean;
  hasPerspectives: boolean;
  hasMaxFiles: boolean;
  maxFilesReasonable: boolean;
}

/**
 * Result of a completeness validation
 */
export interface CompletenessResult {
  isComplete: boolean;
  checklist: CompletenessChecklist;
  warnings: string[];
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Validate diff review inputs for completeness
 */
export function validateDiffReview(params: ReviewDiffParams): CompletenessResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check base ref
  const hasBase = Boolean(params.base);

  // Check head ref  
  const hasHead = Boolean(params.head);

  // Check perspectives
  const hasPerspectives = Boolean(params.perspectives && params.perspectives.length > 0);

  // Check max files
  const hasMaxFiles = params.maxFiles !== undefined;
  const maxFilesReasonable = params.maxFiles !== undefined && params.maxFiles >= 10;

  // Calculate score
  let score = 0;
  if (hasBase) score += 20;
  if (hasHead) score += 20;
  if (hasPerspectives) score += 25;
  if (hasMaxFiles) score += 15;
  if (maxFilesReasonable) score += 20;

  // Warnings for incomplete inputs
  if (!hasBase) {
    warnings.push("No base ref specified — using default (HEAD~1 or main). Results may include unintended changes.");
  }
  if (!hasHead) {
    warnings.push("No head ref specified — comparing against HEAD. Review may miss uncommitted work.");
  }
  if (!hasPerspectives) {
    warnings.push("No perspectives specified — running all perspectives. Consider narrowing for faster feedback.");
  }
  if (!hasMaxFiles) {
    recommendations.push("Consider setting maxFiles to focus review on most critical changes.");
  }
  if (params.maxFiles !== undefined && params.maxFiles < 10) {
    warnings.push(`maxFiles=${params.maxFiles} may miss important changes. Consider 10-20 for comprehensive review.`);
  }

  // Boil the lake: recommend thoroughness when cost is low
  if (score >= 60) {
    recommendations.push("Review inputs are sufficient. For deeper analysis, consider adding --perspectives security,performance");
  }

  return {
    isComplete: score >= 75,
    checklist: { hasBase, hasHead, hasPerspectives, hasMaxFiles, maxFilesReasonable },
    warnings,
    recommendations,
    score,
  };
}

/**
 * Validate file review inputs for completeness
 */
export function validateFileReview(params: ReviewFileParams): CompletenessResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // File is always required
  const hasFile = Boolean(params.file);
  const hasPerspectives = Boolean(params.perspectives && params.perspectives.length > 0);
  const hasContext = Boolean(params.context);

  let score = 0;
  if (hasFile) score += 35;
  if (hasPerspectives) score += 35;
  if (hasContext) score += 30;

  if (!hasPerspectives) {
    warnings.push("No perspectives specified — running all perspectives. This is fine for comprehensive review.");
  }

  // Boil the lake: always recommend security perspective
  recommendations.push("For production code, add perspective 'security' to catch vulnerabilities early.");

  return {
    isComplete: score >= 70,
    checklist: {
      hasBase: hasFile, // reusing field for file existence check
      hasHead: hasContext,
      hasPerspectives,
      hasMaxFiles: false,
      maxFilesReasonable: false,
    },
    warnings,
    recommendations,
    score,
  };
}

/**
 * Format completeness result as human-readable text
 */
export function formatCompletenessReport(result: CompletenessResult, reviewType: "diff" | "file"): string {
  const lines: string[] = [
    `## Completeness Check (${reviewType} review)`,
    ``,
    `**Score:** ${result.score}/100 ${result.isComplete ? "✅" : "⚠️"}`,
    ``,
  ];

  if (result.warnings.length > 0) {
    lines.push("### Warnings");
    for (const w of result.warnings) {
      lines.push(`- ⚠️ ${w}`);
    }
    lines.push("");
  }

  if (result.recommendations.length > 0) {
    lines.push("### Recommendations");
    for (const r of result.recommendations) {
      lines.push(`- 💡 ${r}`);
    }
    lines.push("");
  }

  lines.push("### Checklist");
  const check = result.checklist;
  lines.push(`- Base ref: ${check.hasBase ? "✅" : "❌"}`);
  lines.push(`- Head ref: ${check.hasHead ? "✅" : "❌"}`);
  lines.push(`- Perspectives: ${check.hasPerspectives ? "✅" : "❌"}`);
  if (reviewType === "diff") {
    lines.push(`- Max files set: ${check.hasMaxFiles ? "✅" : "❌"}`);
    lines.push(`- Max files reasonable: ${check.maxFilesReasonable ? "✅" : "❌"}`);
  }

  return lines.join("\n");
}

/**
 * Get default thresholds for "Boil the Lake" recommendations
 */
export const COMPLETENESS_THRESHOLDS = {
  minimum: 50,
  recommended: 75,
  thorough: 90,
} as const;

/**
 * Determine if a review should be considered thorough based on score
 */
export function isReviewThorough(score: number): boolean {
  return score >= COMPLETENESS_THRESHOLDS.recommended;
}