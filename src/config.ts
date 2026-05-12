import * as fs from "node:fs";
import * as path from "node:path";
import type { ReviewExtensionConfig, PerspectiveConfig, QualityConfig, AutoReviewConfig, Severity } from "./types.ts";

const DEFAULT_PERSPECTIVE_SEVERITY: Record<string, Severity> = {
	security: "must-fix",
	performance: "should-fix",
	maintainability: "should-fix",
	style: "nice-to-have",
	testing: "should-fix",
	production: "should-fix",
};

function defaultPerspectives(): Record<string, PerspectiveConfig> {
	const entries = Object.entries(DEFAULT_PERSPECTIVE_SEVERITY);
	const result: Record<string, PerspectiveConfig> = {};
	for (const [name, severity] of entries) {
		result[name] = { enabled: name !== "production", severity };
	}
	return result;
}

const DEFAULT_QUALITY: QualityConfig = {
	rejectGeneric: true,
	requireEvidence: true,
	minFindingsPerFile: 1,
};

const DEFAULT_AUTO_REVIEW: AutoReviewConfig = {
	onEdit: false,
	onCommit: true,
	onPR: true,
};

export const DEFAULT_CONFIG: ReviewExtensionConfig = {
	enabled: true,
	perspectives: defaultPerspectives(),
	quality: { ...DEFAULT_QUALITY },
	autoReview: { ...DEFAULT_AUTO_REVIEW },
};

export function loadConfig(cwd: string): { config: ReviewExtensionConfig; source: "file" | "defaults" } {
	const configPath = path.join(cwd, ".pi", "pi-audit.json");

	if (!fs.existsSync(configPath)) {
		return { config: structuredClone(DEFAULT_CONFIG), source: "defaults" };
	}

	try {
		const raw = fs.readFileSync(configPath, "utf-8");
		const parsed: unknown = JSON.parse(raw);

		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			return { config: structuredClone(DEFAULT_CONFIG), source: "defaults" };
		}

		const user = parsed as Record<string, unknown>;
		const config = structuredClone(DEFAULT_CONFIG);

		if (typeof user.enabled === "boolean") {
			config.enabled = user.enabled;
		}

		if (typeof user.perspectives === "object" && user.perspectives !== null && !Array.isArray(user.perspectives)) {
			const perspectives = user.perspectives as Record<string, unknown>;
			for (const [name, value] of Object.entries(perspectives)) {
				if (typeof value === "object" && value !== null && !Array.isArray(value)) {
					const p = value as Record<string, unknown>;
					config.perspectives[name] = {
						enabled: typeof p.enabled === "boolean" ? p.enabled : true,
						severity: typeof p.severity === "string" ? (p.severity as Severity) : DEFAULT_PERSPECTIVE_SEVERITY[name] ?? "should-fix",
					};
				}
			}
		}

		if (typeof user.quality === "object" && user.quality !== null && !Array.isArray(user.quality)) {
			const q = user.quality as Record<string, unknown>;
			if (typeof q.rejectGeneric === "boolean") config.quality.rejectGeneric = q.rejectGeneric;
			if (typeof q.requireEvidence === "boolean") config.quality.requireEvidence = q.requireEvidence;
			if (typeof q.minFindingsPerFile === "number") config.quality.minFindingsPerFile = q.minFindingsPerFile;
		}

		if (typeof user.autoReview === "object" && user.autoReview !== null && !Array.isArray(user.autoReview)) {
			const a = user.autoReview as Record<string, unknown>;
			if (typeof a.onEdit === "boolean") config.autoReview.onEdit = a.onEdit;
			if (typeof a.onCommit === "boolean") config.autoReview.onCommit = a.onCommit;
			if (typeof a.onPR === "boolean") config.autoReview.onPR = a.onPR;
		}

		return { config, source: "file" };
	} catch {
		return { config: structuredClone(DEFAULT_CONFIG), source: "defaults" };
	}
}
