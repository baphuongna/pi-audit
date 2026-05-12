import type { ReviewFinding, ReviewReport, ReviewSummary, ReportOptions, DiffHunk, Severity } from "../types.ts";
import { loadConfig, DEFAULT_CONFIG } from "../config.ts";
import { classifyChanges, allHunks, type ParsedDiff } from "../diff/change-analysis.ts";
import { SEVERITY_ORDER } from "../types.ts";
import { findingsByFile, buildSummary } from "./finding.ts";

/** Severity level map for sorting. Higher = more severe. */
const SEVERITY_LEVELS: Record<string, number> = {
	info: 0,
	"nice-to-have": 1,
	"should-fix": 2,
	"must-fix": 3,
};

interface ReviewPerspective {
	name: string;
	checklist: string[];
	defaultSeverity: Severity;
	enabled: boolean;
}

interface ReviewOptions {
	base?: string;
	head?: string;
	perspectives?: string[];
	maxFiles?: number;
}

function resolvePerspectives(cwd: string): ReviewPerspective[] {
	const { config } = loadConfig(cwd);
	const enabled = Object.entries(config.perspectives)
		.filter(([, p]) => p.enabled)
		.map(([name]) => name);

	const allPerspectives: ReviewPerspective[] = [
		{
			name: "security",
			checklist: [
				"SQL injection — parameterized queries used",
				"XSS — output encoded/escaped properly",
				"Hardcoded credentials — use env vars",
				"Input validation — all user input validated/sanitized",
				"Auth & permission checks — protected routes",
				"Dependency vulnerabilities — audited",
				"Secrets management — no hardcoded keys",
			],
			defaultSeverity: "must-fix",
			enabled: enabled.includes("security"),
		},
		{
			name: "performance",
			checklist: [
				"N+1 queries — avoid loops with database calls",
				"Async/await — no blocking calls in async context",
				"Caching — computed results cached appropriately",
				"Lazy loading — defer non-critical loading",
				"Bundle size — no unnecessary dependencies",
				"Memory leaks — cleanup subscriptions/listeners",
			],
			defaultSeverity: "should-fix",
			enabled: enabled.includes("performance"),
		},
		{
			name: "maintainability",
			checklist: [
				"Function size — < 50 lines, single responsibility",
				"Naming conventions — descriptive names",
				"Magic numbers — extract to named constants",
				"Code duplication — DRY, extract shared logic",
				"Cyclomatic complexity — low, readable conditionals",
				"Dead code — remove unused functions/variables",
			],
			defaultSeverity: "should-fix",
			enabled: enabled.includes("maintainability"),
		},
		{
			name: "testing",
			checklist: [
				"Test coverage — key paths covered",
				"Assertions specific — use toEqual/toContain not toBeTruthy",
				"Edge cases — null/undefined/empty handled",
				"No flaky tests — deterministic, no sleeps",
				"Arrange-Act-Assert — clear test structure",
				"One concept per test — single assertion focus",
			],
			defaultSeverity: "should-fix",
			enabled: enabled.includes("testing"),
		},
	];

	return allPerspectives.filter((p) => p.enabled);
}

/** Expand a list of perspective names to full perspective objects. */
/** Return a sanitized env object with dangerous vars removed for git subprocesses. */
function cleanGitEnv(): Record<string, string> {
	const DANGEROUS_VARS = [
		"GITHUB_TOKEN", "GITHUB_USER", "GIT_ASKPASS", "GIT_TERMINAL_PROMPT",
		"GIT_REDIRECT_STDERR", "GIT_SSH", "GIT_SSH_COMMAND",
		"SSH_AUTH_SOCK", "SSH_AGENT_PID",
		"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN",
		"LD_PRELOAD", "LD_LIBRARY_PATH", "DYLD_INSERT_LIBRARIES",
	];
	const cleanEnv: Record<string, string> = {};
	for (const [k, v] of Object.entries(process.env)) {
		if (!DANGEROUS_VARS.includes(k)) cleanEnv[k] = v ?? "";
	}
	return cleanEnv;
}

function expandPerspectives(names: string[] | undefined, cwd: string): ReviewPerspective[] {
	const all = resolvePerspectives(cwd);
	if (!names || names.length === 0) return all;
	return all.filter((p) => names.includes(p.name));
}

export class ReviewOrchestrator {
	private cwd: string;

	/** Create orchestrator with a working directory. Perspectives are loaded from config. */
	constructor(cwd: string) {
		this.cwd = cwd;
	}

	/**
	 * Review a git diff between base and head refs.
	 * @param cwd working directory for git commands
	 * @param options review options (base, head, perspectives, maxFiles)
	 */
	async reviewDiff(cwd: string, options: ReviewOptions = {}): Promise<ReviewReport> {
		const base = options.base ?? "HEAD~1";
		const head = options.head ?? "HEAD";
		const perspectives = expandPerspectives(options.perspectives, cwd);
		const maxFiles = options.maxFiles ?? 20;

		// Get git diff — strip dangerous env vars to prevent credential leakage
		const cleanEnv = cleanGitEnv();
		const { spawnSync } = await import("node:child_process");
		const diffResult = spawnSync("git", ["diff", base, head, `--max-count=${maxFiles}`], {
			cwd,
			encoding: "utf8",
			env: cleanEnv,
		});
		if (diffResult.status !== 0) {
			return this.emptyReport(perspectives.map((p) => p.name));
		}

		const parsed = classifyChanges(diffResult.stdout as string);
		const hunks = allHunks(parsed).slice(0, maxFiles * 10); // reasonable cap

		return this.review(hunks, perspectives);
	}

	/**
	 * Review a single file (full content or diff against git).
	 * @param cwd working directory
	 * @param file relative file path
	 * @param options review options (perspectives, context)
	 */
	async reviewFile(cwd: string, file: string, options: { file?: string; perspectives?: string[]; context?: "full" | "changed-only" } = {}): Promise<ReviewReport> {
		const perspectives = expandPerspectives(options.perspectives ?? [], cwd);
		const context = options.context ?? "full";

		if (context === "changed-only") {
			// Use git diff for this file — use clean env
			const env = cleanGitEnv();
			const { spawnSync } = await import("node:child_process");
			const diffResult = spawnSync("git", ["diff", "HEAD", "--", file], {
				cwd,
				encoding: "utf8",
				env,
			});
			if (diffResult.status === 0 && (diffResult.stdout as string).trim()) {
				const parsed = classifyChanges(diffResult.stdout as string);
				const hunks = allHunks(parsed).filter((h) => h.file === file);
				return this.review(hunks, perspectives);
			}
		}

		// Full file review — create a synthetic hunk
		const fs = await import("node:fs");
		const path = await import("node:path");
		let content = "";
		try {
			const fullPath = path.join(cwd, file);
			content = fs.readFileSync(fullPath, "utf-8");
		} catch {
			// File not readable, return empty
		}

		const lines = content.split("\n");
		const hunk: DiffHunk = {
			file,
			changeType: "modified",
			oldStart: 1,
			oldCount: lines.length,
			newStart: 1,
			newCount: lines.length,
			content: lines.map((l) => ` ${l}`).join("\n"),
			header: `review ${file}`,
		};

		return this.review([hunk], perspectives);
	}

	/**
	 * Generate a formatted review report from existing findings.
	 * @param findings array of findings
	 * @param options report formatting options
	 */
	generateFormattedReport(
		findings: ReviewFinding[],
		options: ReportOptions,
	): ReviewReport {
		const perspectives = [...new Set(findings.map((f) => f.category))];
		const summary = buildSummary(findings, perspectives);

		return {
			findings,
			summary,
			timestamp: new Date().toISOString(),
			perspectives,
			options,
		};
	}

	private emptyReport(perspectives: string[]): ReviewReport {
		return {
			findings: [],
			summary: { total: 0, bySeverity: { "must-fix": 0, "should-fix": 0, "nice-to-have": 0, info: 0 }, byCategory: {}, byFile: {} },
			timestamp: new Date().toISOString(),
			perspectives,
			options: { format: "markdown", groupBy: "file", includeSuggestions: true },
		};
	}

	/**
	 * Core review — analyze hunks against given perspectives.
	 * @param hunks diff hunks to review
	 * @param perspectives (optional) perspective list, loaded from config if not given
	 */
	async review(hunks: DiffHunk[], perspectives?: ReviewPerspective[]): Promise<ReviewReport> {
		if (perspectives === undefined) {
			perspectives = resolvePerspectives(this.cwd).map((p) => ({
				...p,
				defaultSeverity: p.defaultSeverity as Severity,
			}));
		}

		const findings: ReviewFinding[] = [];
		const maxFindings = 50;

		for (const perspective of perspectives) {
			if (!perspective.enabled) continue;

			for (const hunk of hunks) {
				const perspectiveFindings = this.reviewHunkWithPerspective(hunk, perspective);
				findings.push(...perspectiveFindings);

				if (findings.length >= maxFindings) {
					break;
				}
			}
		}

		findings.sort((a, b) => {
			const aLevel = SEVERITY_LEVELS[a.severity] ?? 0;
			const bLevel = SEVERITY_LEVELS[b.severity] ?? 0;
			return bLevel - aLevel;
		});

		return {
			findings,
			summary: this.generateSummary(findings),
			timestamp: new Date().toISOString(),
			perspectives: perspectives.filter((p) => p.enabled).map((p) => p.name),
			options: { format: "markdown", groupBy: "file", includeSuggestions: true },
		};
	}

	private reviewHunkWithPerspective(hunk: DiffHunk, perspective: ReviewPerspective): ReviewFinding[] {
		const findings: ReviewFinding[] = [];

		for (const checklistItem of perspective.checklist) {
			const finding = this.evaluateChecklistItem(
				perspective.name,
				checklistItem,
				hunk.file,
				hunk.oldStart,
				hunk.content,
				perspective.defaultSeverity,
			);
			if (finding) {
				findings.push(finding);
			}
		}

		return findings;
	}

	private evaluateChecklistItem(
		perspectiveName: string,
		checklistItem: string,
		file: string,
		line: number,
		hunkContent: string,
		defaultSeverity: string,
	): ReviewFinding | null {
		const allLines = hunkContent.split("\n");
		const codeText = allLines.join("\n").toLowerCase();
		const checklistLower = checklistItem.toLowerCase();

		let found = false;
		let severity = defaultSeverity;
		let description = "";

		switch (perspectiveName) {
			case "security": {
				if (checklistLower.includes("sql injection") || checklistLower.includes("parameterized")) {
					if (/`.*select.*from.*where/i.test(hunkContent) && !/\$\{|prepare|parameterized/i.test(codeText)) {
						found = true; severity = "must-fix";
						description = "Potential SQL injection: raw SQL string detected. Use parameterized queries.";
					}
				} else if (checklistLower.includes("xss") || checklistLower.includes("output encoded")) {
					if (/(innerhtml|innerHTML|\.html\(|dangerouslysetinnerhtml)/i.test(hunkContent) && !/(encode|escape|sanitize)/i.test(codeText)) {
						found = true; severity = "must-fix";
						description = "Potential XSS: direct HTML injection without encoding.";
					}
				} else if (checklistLower.includes("hardcoded") && checklistLower.includes("credentials")) {
					if (/(password|apikey|secret|token).*=['"][^'"]+['"]/i.test(hunkContent)) {
						found = true; severity = "must-fix";
						description = "Hardcoded credential detected. Use environment variables.";
					}
				} else if (checklistLower.includes("input validation") || checklistLower.includes("sanitized")) {
					if (/req\.(body|query|params)/.test(hunkContent) && !/(validate|sanitize|parse)/i.test(codeText)) {
						found = true; severity = "should-fix";
						description = "User input used without validation.";
					}
				} else if (checklistLower.includes("auth") && checklistLower.includes("permission")) {
					if (/router\.(post|get|put|delete)/.test(hunkContent) && !/(auth|permission|authorize|middleware)/i.test(codeText)) {
						found = true; severity = "should-fix";
						description = "Route may lack authorization check.";
					}
				}
				break;
			}
			case "performance": {
				if (checklistLower.includes("n+1") || checklistLower.includes("database call")) {
					if (/(foreach|for\s*\(|map\()\s*.*\n.*(query|db\.|sql|execute)/i.test(codeText)) {
						found = true; severity = "should-fix";
						description = "Potential N+1 query: loop contains database call.";
					}
				} else if (checklistLower.includes("async") && checklistLower.includes("blocking")) {
					if (/(await|\.then\()/.test(hunkContent) && /sync|readfilesync|readdirsync/i.test(hunkContent)) {
						found = true; severity = "should-fix";
						description = "Blocking call inside async context.";
					}
				}
				break;
			}
			case "maintainability": {
				if (checklistLower.includes("cyclomatic") || checklistLower.includes("function size")) {
					const funcLines = hunkContent.split("\n").length;
					if (funcLines > 50) {
						found = true; severity = "should-fix";
						description = `Function exceeds 50 lines (${funcLines} lines). Consider splitting.`;
					}
				} else if (checklistLower.includes("magic number")) {
					if (/\b\d{2,}\b/.test(hunkContent) && !/(timeout|port|limit|size|count|max|min)/i.test(hunkContent)) {
						found = true; severity = "nice-to-have";
						description = "Magic number detected. Extract to named constant.";
					}
				}
				break;
			}
			case "testing": {
				if (checklistLower.includes("test") && (checklistLower.includes("assertion") || checklistLower.includes("specific"))) {
					if (/\.(toBeTruthy|toBeFalsy)\(\)/.test(hunkContent)) {
						found = true; severity = "should-fix";
						description = "Weak assertion. Use specific assertions like toEqual, toContain.";
					}
				}
				break;
			}
		}

		if (!found) return null;

		return {
			file,
			line,
			severity: severity as ReviewFinding["severity"],
			category: perspectiveName,
			title: `[${perspectiveName}] ${checklistItem}`,
			description,
			evidence: `Line ${line}: ${hunkContent.slice(0, 120)}`,
			suggestion: "Review and fix this issue.",
		};
	}

	private generateSummary(findings: ReviewFinding[]): ReviewSummary {
		const bySeverity: Record<Severity, number> = { "must-fix": 0, "should-fix": 0, "nice-to-have": 0, info: 0 };
		const byCategory: Record<string, number> = {};
		const byFile: Record<string, number> = {};

		for (const f of findings) {
			bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
			byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
			byFile[f.file] = (byFile[f.file] ?? 0) + 1;
		}

		return { total: findings.length, bySeverity, byCategory, byFile };
	}
}