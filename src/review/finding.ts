import type { ReviewFinding, Severity, ReviewSummary } from "../types.ts";

export function createFinding(
	file: string,
	line: number,
	severity: Severity,
	category: string,
	title: string,
	description: string,
	evidence: string,
	suggestion: string,
): ReviewFinding {
	return { file, line, severity, category, title, description, evidence, suggestion };
}

export function validateFinding(finding: ReviewFinding): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!finding.file || typeof finding.file !== "string") {
		errors.push("Finding must have a non-empty 'file' field.");
	}
	if (typeof finding.line !== "number" || finding.line < 0) {
		errors.push("Finding must have a non-negative 'line' number.");
	}
	if (!finding.severity || !["must-fix", "should-fix", "nice-to-have", "info"].includes(finding.severity)) {
		errors.push(`Finding has invalid severity: '${finding.severity}'.`);
	}
	if (!finding.category || typeof finding.category !== "string") {
		errors.push("Finding must have a non-empty 'category' field.");
	}
	if (!finding.title || typeof finding.title !== "string") {
		errors.push("Finding must have a non-empty 'title' field.");
	}
	if (!finding.description || typeof finding.description !== "string") {
		errors.push("Finding must have a non-empty 'description' field.");
	}
	if (!finding.evidence || typeof finding.evidence !== "string") {
		errors.push("Finding must have a non-empty 'evidence' field.");
	}
	if (!finding.suggestion || typeof finding.suggestion !== "string") {
		errors.push("Finding must have a non-empty 'suggestion' field.");
	}

	return { valid: errors.length === 0, errors };
}

export function findingsByFile(findings: ReviewFinding[]): Record<string, ReviewFinding[]> {
	const map: Record<string, ReviewFinding[]> = {};
	for (const f of findings) {
		if (!map[f.file]) map[f.file] = [];
		map[f.file]!.push(f);
	}
	return map;
}

export function findingsBySeverity(findings: ReviewFinding[]): Record<Severity, ReviewFinding[]> {
	const map: Record<Severity, ReviewFinding[]> = {
		"must-fix": [],
		"should-fix": [],
		"nice-to-have": [],
		info: [],
	};
	for (const f of findings) {
		if (map[f.severity]) {
			map[f.severity]!.push(f);
		}
	}
	return map;
}

export function findingsByCategory(findings: ReviewFinding[]): Record<string, ReviewFinding[]> {
	const map: Record<string, ReviewFinding[]> = {};
	for (const f of findings) {
		if (!map[f.category]) map[f.category] = [];
		map[f.category]!.push(f);
	}
	return map;
}

export function buildSummary(findings: ReviewFinding[], perspectives: string[]): ReviewSummary {
	const bySeverity: Record<Severity, number> = { "must-fix": 0, "should-fix": 0, "nice-to-have": 0, info: 0 };
	const byCategory: Record<string, number> = {};
	const byFile: Record<string, number> = {};

	for (const f of findings) {
		bySeverity[f.severity]++;
		byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
		byFile[f.file] = (byFile[f.file] ?? 0) + 1;
	}

	return {
		total: findings.length,
		bySeverity,
		byCategory,
		byFile,
	};
}
