import { SEVERITY_ORDER, SEVERITY_BADGES, type Severity } from "../types.ts";

export function compareSeverity(a: Severity, b: Severity): number {
	return SEVERITY_ORDER[b] - SEVERITY_ORDER[a];
}

export function severityBadge(severity: Severity): string {
	return `${SEVERITY_BADGES[severity]} ${severity}`;
}

export function severityLabel(severity: Severity): string {
	return `${SEVERITY_BADGES[severity]} ${severity.toUpperCase()}`;
}

export function sortSeverities(severities: Severity[]): Severity[] {
	return [...severities].sort(compareSeverity);
}

export function isHighSeverity(severity: Severity): boolean {
	return SEVERITY_ORDER[severity] >= 3;
}

export function allSeverities(): Severity[] {
	return ["must-fix", "should-fix", "nice-to-have", "info"];
}
