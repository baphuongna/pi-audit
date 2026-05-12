import type { ReviewFinding } from "../types.ts";

export const GENERIC_PHRASES = [
	"looks good to me",
	"LGTM",
	"seems fine",
	"nice work",
	"no issues found",
	"code is clean",
	"everything looks correct",
	"i don't see any problems",
	"no comments",
	"ship it",
];

export function isGenericReview(reviewText: string): boolean {
	const normalized = reviewText.toLowerCase().trim();
	return GENERIC_PHRASES.some((phrase) => normalized.includes(phrase.toLowerCase()))
		&& reviewText.length < 200;
}

export function rejectGenericFindings(findings: ReviewFinding[]): {
	valid: ReviewFinding[];
	rejected: ReviewFinding[];
} {
	const valid: ReviewFinding[] = [];
	const rejected: ReviewFinding[] = [];

	for (const finding of findings) {
		const text = `${finding.title} ${finding.description}`;
		if (isGenericReview(text)) {
			rejected.push(finding);
		} else {
			valid.push(finding);
		}
	}

	return { valid, rejected };
}
