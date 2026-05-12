import type { PerspectiveDefinition } from "../types.ts";
import { registry } from "./registry.ts";

export const MAINTAINABILITY_CHECKLIST = [
	"Naming — clear, consistent, self-documenting?",
	"Function size — <50 lines per function?",
	"Cyclomatic complexity — <10 per function?",
	"DRY — no duplicated logic?",
	"SOLID — single responsibility?",
	"Error handling — all error paths covered?",
	"Types — proper TypeScript types (no `any`)?",
	"Comments — complex logic explained?",
	"Dead code — removed?",
	"Magic numbers — extracted to constants?",
];

export const MAINTAINABILITY_PERSPECTIVE: PerspectiveDefinition = {
	name: "maintainability",
	label: "Maintainability",
	description: "Review for code quality, readability, and long-term maintainability.",
	checklist: MAINTAINABILITY_CHECKLIST,
	defaultSeverity: "should-fix",
};

registry.register(MAINTAINABILITY_PERSPECTIVE);
