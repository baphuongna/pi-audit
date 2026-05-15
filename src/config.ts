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

/** Recursively merge `override` into `base`, handling nested objects.
 * Does not mutate either argument.
 */
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const bv = base[key];
		const ov = override[key];
		if (
			bv !== undefined && ov !== undefined &&
			typeof bv === "object" && !Array.isArray(bv) &&
			typeof ov === "object" && !Array.isArray(ov)
		) {
			result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>);
		} else {
			result[key] = ov;
		}
	}
	return result;
}

export { deepMerge };

export function loadConfig(cwd: string): { config: ReviewExtensionConfig; source: "file" | "defaults" } {
	const configPath = path.join(cwd, ".pi", "pi-audit.json");

	if (!fs.existsSync(configPath)) {
		return { config: structuredClone(DEFAULT_CONFIG), source: "defaults" };
	}

	try {
		const raw = fs.readFileSync(configPath, "utf-8");
		const parsed = JSON.parse(raw);

		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			return { config: structuredClone(DEFAULT_CONFIG), source: "defaults" };
		}

		const config = deepMerge(
			structuredClone(DEFAULT_CONFIG) as unknown as Record<string, unknown>,
			parsed as Record<string, unknown>,
		) as unknown as ReviewExtensionConfig;

		return { config, source: "file" };
	} catch {
		return { config: structuredClone(DEFAULT_CONFIG), source: "defaults" };
	}
}