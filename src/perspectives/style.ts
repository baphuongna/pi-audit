import type { PerspectiveDefinition } from "../types.ts";
import { registry } from "./registry.ts";

export const STYLE_CHECKLIST = [
	"Consistent formatting — follows project style guide?",
	"Import ordering — grouped and sorted?",
	"Naming conventions — consistent casing (camelCase, PascalCase, snake_case)?",
	"File organization — logical file/folder structure?",
	"Unused imports — removed?",
	"Trailing whitespace — cleaned up?",
	"Line length — within project limits?",
	"Consistent quote style — single or double quotes?",
];

export const STYLE_PERSPECTIVE: PerspectiveDefinition = {
	name: "style",
	label: "Style & Conventions",
	description: "Review for coding style consistency and convention adherence.",
	checklist: STYLE_CHECKLIST,
	defaultSeverity: "nice-to-have",
};

registry.register(STYLE_PERSPECTIVE);
