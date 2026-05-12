import type { ReviewFinding } from "../types.ts";

export function validateFindingsHaveEvidence(findings: ReviewFinding[]): {
	valid: ReviewFinding[];
	invalid: ReviewFinding[];
} {
	const valid: ReviewFinding[] = [];
	const invalid: ReviewFinding[] = [];

	for (const finding of findings) {
		if (finding.evidence && typeof finding.evidence === "string" && finding.evidence.trim().length > 0) {
			valid.push(finding);
		} else {
			invalid.push(finding);
		}
	}

	return { valid, invalid };
}

export function formatEvidenceError(finding: ReviewFinding): string {
	return `Finding "${finding.title}" in ${finding.file}:${finding.line} is missing required evidence field.`;
}
