import type { ReviewFinding, ReviewReport, ReviewSummary, ReportOptions, Severity } from "../types.ts";
import { SEVERITY_BADGES, SEVERITY_ORDER } from "../types.ts";
import { findingsByFile, findingsBySeverity, findingsByCategory, buildSummary } from "./finding.ts";
import { validateFindingsHaveEvidence, formatEvidenceError } from "../quality/evidence-required.ts";
import { rejectGenericFindings } from "../quality/anti-generic.ts";

export function generateReport(
	findings: ReviewFinding[],
	options: ReportOptions,
	perspectives: string[],
): ReviewReport {
	// Quality enforcement
	let processed = findings;
	processed = rejectGenericFindings(processed).valid;
	processed = validateFindingsHaveEvidence(processed).valid;

	const summary = buildSummary(processed, perspectives);

	return {
		findings: processed,
		summary,
		timestamp: new Date().toISOString(),
		perspectives,
		options,
	};
}

export function formatReport(report: ReviewReport): string {
	switch (report.options.format) {
		case "json":
			return JSON.stringify(report, null, 2);
		case "summary":
			return formatSummary(report);
		case "markdown":
		default:
			return formatMarkdown(report);
	}
}

function formatMarkdown(report: ReviewReport): string {
	const lines: string[] = [];
	lines.push("# Code Review Report");
	lines.push("");
	lines.push(`**Date:** ${report.timestamp}`);
	lines.push(`**Perspectives:** ${report.perspectives.join(", ")}`);
	lines.push("");

	// Summary
	lines.push("## Summary");
	lines.push(`- **Total findings:** ${report.summary.total}`);
	for (const [sev, count] of Object.entries(report.summary.bySeverity)) {
		if (count > 0) {
			lines.push(`- ${SEVERITY_BADGES[sev as Severity]} ${sev}: ${count}`);
		}
	}
	lines.push("");

	// Group findings
	switch (report.options.groupBy) {
		case "file":
			formatByFile(lines, report);
			break;
		case "perspective":
			formatByPerspective(lines, report);
			break;
		case "severity":
			formatBySeverity(lines, report);
			break;
	}

	return lines.join("\n");
}

function formatByFile(lines: string[], report: ReviewReport): void {
	const grouped = findingsByFile(report.findings);
	lines.push("## Findings by File");
	lines.push("");

	for (const [file, findings] of Object.entries(grouped)) {
		lines.push(`### ${file}`);
		for (const f of findings) {
			lines.push("");
			lines.push(`**${SEVERITY_BADGES[f.severity]} [${f.severity}] ${f.title}**`);
			lines.push(`- Line: ${f.line}`);
			lines.push(`- Category: ${f.category}`);
			lines.push(`- ${f.description}`);
			if (f.evidence) {
				lines.push(`- Evidence: \`${f.evidence}\``);
			}
			if (report.options.includeSuggestions && f.suggestion) {
				lines.push(`- Suggestion: ${f.suggestion}`);
			}
		}
		lines.push("");
	}
}

function formatByPerspective(lines: string[], report: ReviewReport): void {
	const grouped = findingsByCategory(report.findings);
	lines.push("## Findings by Perspective");
	lines.push("");

	for (const [category, findings] of Object.entries(grouped)) {
		lines.push(`### ${category}`);
		for (const f of findings) {
			lines.push("");
			lines.push(`**${SEVERITY_BADGES[f.severity]} [${f.severity}] ${f.title}** (${f.file}:${f.line})`);
			lines.push(`- ${f.description}`);
			if (f.evidence) {
				lines.push(`- Evidence: \`${f.evidence}\``);
			}
			if (report.options.includeSuggestions && f.suggestion) {
				lines.push(`- Suggestion: ${f.suggestion}`);
			}
		}
		lines.push("");
	}
}

function formatBySeverity(lines: string[], report: ReviewReport): void {
	const grouped = findingsBySeverity(report.findings);
	lines.push("## Findings by Severity");
	lines.push("");

	const severityOrder: Severity[] = ["must-fix", "should-fix", "nice-to-have", "info"];
	for (const sev of severityOrder) {
		const findings = grouped[sev];
		if (!findings || findings.length === 0) continue;

		lines.push(`### ${SEVERITY_BADGES[sev]} ${sev.toUpperCase()}`);
		for (const f of findings) {
			lines.push("");
			lines.push(`**${f.title}** (${f.file}:${f.line}) [${f.category}]`);
			lines.push(`- ${f.description}`);
			if (f.evidence) {
				lines.push(`- Evidence: \`${f.evidence}\``);
			}
			if (report.options.includeSuggestions && f.suggestion) {
				lines.push(`- Suggestion: ${f.suggestion}`);
			}
		}
		lines.push("");
	}
}

function formatSummary(report: ReviewReport): string {
	const lines: string[] = [];
	lines.push("## Review Summary");
	lines.push("");
	lines.push(`| Severity | Count |`);
	lines.push(`|----------|-------|`);
	for (const [sev, count] of Object.entries(report.summary.bySeverity)) {
		if (count > 0) {
			lines.push(`| ${SEVERITY_BADGES[sev as Severity]} ${sev} | ${count} |`);
		}
	}
	lines.push("");
	lines.push(`**Total:** ${report.summary.total} findings`);

	if (report.findings.length > 0) {
		lines.push("");
		lines.push("### Top Findings:");
		// Show top 10 by severity
		const sorted = [...report.findings].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
		for (const f of sorted.slice(0, 10)) {
			lines.push(`- ${SEVERITY_BADGES[f.severity]} ${f.title} (${f.file}:${f.line})`);
		}
	}

	return lines.join("\n");
}
