import type { DiffHunk, ImpactAssessment } from "../types.ts";

const CRITICAL_PATHS = [
	/auth/i,
	/security/i,
	/config/i,
	/env/i,
	/secret/i,
	/password/i,
	/token/i,
	/session/i,
	/middleware/i,
	/route/i,
	/api/i,
	/\.env/i,
	/permission/i,
	/privilege/i,
	/admin/i,
	/root/i,
];

export function calculateImpact(hunks: DiffHunk[]): ImpactAssessment {
	const fileSet = new Set<string>();
	let linesAdded = 0;
	let linesRemoved = 0;
	const highImpactFiles: string[] = [];
	const criticalPaths: string[] = [];

	for (const hunk of hunks) {
		fileSet.add(hunk.file);

		const contentLines = hunk.content.split("\n");
		for (const line of contentLines) {
			if (line.startsWith("+") && !line.startsWith("+++")) linesAdded++;
			if (line.startsWith("-") && !line.startsWith("---")) linesRemoved++;
		}
	}

	// Check for critical paths
	for (const file of fileSet) {
		if (CRITICAL_PATHS.some((re) => re.test(file))) {
			criticalPaths.push(file);
		}
	}

	// Large changes are high impact
	const filesChanged = fileSet.size;
	const totalChanges = linesAdded + linesRemoved;
	const filesByChanges = new Map<string, number>();

	for (const hunk of hunks) {
		const contentLines = hunk.content.split("\n");
		let changes = 0;
		for (const line of contentLines) {
			if (line.startsWith("+") || line.startsWith("-")) changes++;
		}
		filesByChanges.set(hunk.file, (filesByChanges.get(hunk.file) ?? 0) + changes);
	}

	// Files with > 50 lines changed are high impact
	for (const [file, count] of filesByChanges) {
		if (count > 50) {
			highImpactFiles.push(file);
		}
	}

	// Critical path files are also high impact
	for (const file of criticalPaths) {
		if (!highImpactFiles.includes(file)) {
			highImpactFiles.push(file);
		}
	}

	return {
		filesChanged,
		linesAdded,
		linesRemoved,
		highImpactFiles,
		criticalPaths,
	};
}

export function formatImpact(impact: ImpactAssessment): string {
	const lines: string[] = [];
	lines.push(`📊 **Impact Assessment**`);
	lines.push(`- Files changed: ${impact.filesChanged}`);
	lines.push(`- Lines added: +${impact.linesAdded}`);
	lines.push(`- Lines removed: -${impact.linesRemoved}`);

	if (impact.criticalPaths.length > 0) {
		lines.push(`- ⚠️ Critical paths: ${impact.criticalPaths.join(", ")}`);
	}

	if (impact.highImpactFiles.length > 0) {
		lines.push(`- 🔥 High impact files: ${impact.highImpactFiles.join(", ")}`);
	}

	return lines.join("\n");
}
