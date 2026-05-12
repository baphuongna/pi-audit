import type { ReviewFinding } from "../types.ts";

export function scoreSpecificity(finding: ReviewFinding): number {
	let score = 0;

	// Evidence length (0-0.3)
	const evidenceLen = finding.evidence.trim().length;
	if (evidenceLen > 0) score += 0.1;
	if (evidenceLen > 20) score += 0.1;
	if (evidenceLen > 50) score += 0.1;

	// Code snippet presence (0-0.3)
	if (containsCodeSnippet(finding.evidence)) score += 0.15;
	if (containsCodeSnippet(finding.suggestion)) score += 0.15;

	// Line reference (0-0.2)
	if (finding.line > 0) score += 0.1;
	if (finding.description.includes(`line ${finding.line}`)) score += 0.1;

	// Description depth (0-0.2)
	if (finding.description.length > 30) score += 0.1;
	if (finding.description.length > 100) score += 0.1;

	return Math.min(1, score);
}

export function isSpecificEnough(finding: ReviewFinding, threshold = 0.3): boolean {
	return scoreSpecificity(finding) >= threshold;
}

function containsCodeSnippet(text: string): boolean {
	// Check for common code indicators
	return /`[^`]+`/.test(text)
		|| /\bfunction\b/.test(text)
		|| /\bconst\b/.test(text)
		|| /\bclass\b/.test(text)
		|| /\bimport\b/.test(text)
		|| /=>/.test(text)
		|| /\(\)/.test(text)
		|| /\{[^}]{5,}\}/.test(text);
}
