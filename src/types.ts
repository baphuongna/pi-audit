// ─── Severity ─────────────────────────────────────────────────────────────────

export type Severity = "must-fix" | "should-fix" | "nice-to-have" | "info";

export const SEVERITY_ORDER: Record<Severity, number> = {
	"must-fix": 4,
	"should-fix": 3,
	"nice-to-have": 2,
	info: 1,
};

export const SEVERITY_BADGES: Record<Severity, string> = {
	"must-fix": "🔴",
	"should-fix": "🟠",
	"nice-to-have": "🟡",
	info: "ℹ️",
};

// ─── Change Classification ────────────────────────────────────────────────────

export type ChangeType = "new" | "modified" | "deleted" | "renamed";

// ─── Diff ─────────────────────────────────────────────────────────────────────

export interface DiffHunk {
	file: string;
	changeType: ChangeType;
	oldStart: number;
	oldCount: number;
	newStart: number;
	newCount: number;
	content: string;
	header: string;
}

export interface ImpactAssessment {
	filesChanged: number;
	linesAdded: number;
	linesRemoved: number;
	highImpactFiles: string[];
	criticalPaths: string[];
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface ReviewFinding {
	file: string;
	line: number;
	severity: Severity;
	category: string;
	title: string;
	description: string;
	evidence: string;
	suggestion: string;
}

export interface ReviewReport {
	findings: ReviewFinding[];
	summary: ReviewSummary;
	timestamp: string;
	perspectives: string[];
	options: ReportOptions;
}

export interface ReviewSummary {
	total: number;
	bySeverity: Record<Severity, number>;
	byCategory: Record<string, number>;
	byFile: Record<string, number>;
}

export type ReportFormat = "markdown" | "json" | "summary";
export type GroupBy = "file" | "perspective" | "severity";

export interface ReportOptions {
	format: ReportFormat;
	groupBy: GroupBy;
	includeSuggestions: boolean;
}

// ─── Perspectives ─────────────────────────────────────────────────────────────

export interface PerspectiveConfig {
	enabled: boolean;
	severity: Severity;
}

export interface PerspectiveDefinition {
	name: string;
	label: string;
	description: string;
	checklist: string[];
	defaultSeverity: Severity;
	threatModel?: Record<string, string[]>;
}

// ─── Configuration ────────────────────────────────────────────────────────────

export interface QualityConfig {
	rejectGeneric: boolean;
	requireEvidence: boolean;
	minFindingsPerFile: number;
}

export interface AutoReviewConfig {
	onEdit: boolean;
	onCommit: boolean;
	onPR: boolean;
}

export interface ReviewExtensionConfig {
	enabled: boolean;
	perspectives: Record<string, PerspectiveConfig>;
	quality: QualityConfig;
	autoReview: AutoReviewConfig;
	governance?: GovernanceConfig;
}

export interface GovernanceConfig {
	retentionDays?: number;
	privacyLevel?: 'strict' | 'standard' | 'permissive';
	auditLog?: boolean;
	consentRequired?: boolean;
}

// ─── Tool Parameters ──────────────────────────────────────────────────────────

export interface ReviewDiffParams {
	base?: string;
	head?: string;
	perspectives?: string[];
	maxFiles?: number;
}

export interface ReviewFileParams {
	file: string;
	perspectives?: string[];
	context?: "full" | "changed-only";
}

export interface ReviewReportParams {
	format: ReportFormat;
	includeSuggestions: boolean;
	groupBy: GroupBy;
}

// ─── Context Extraction ───────────────────────────────────────────────────────

export interface ExtractedContext {
	file: string;
	hunkIndex: number;
	beforeLines: string[];
	hunkLines: string[];
	afterLines: string[];
	startLine: number;
}
