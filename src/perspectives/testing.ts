import type { PerspectiveDefinition } from "../types.ts";
import { registry } from "./registry.ts";

export const TESTING_CHECKLIST = [
	"New code has tests?",
	"Tests cover happy path?",
	"Tests cover error paths?",
	"Tests cover edge cases?",
	"Tests are deterministic (no flaky)?",
	"Tests are isolated (no interdependency)?",
	"Mock usage is appropriate?",
	"Test naming is descriptive?",
	"Assertions are specific (not `toBeTruthy`)?",
];

export const TESTING_PERSPECTIVE: PerspectiveDefinition = {
	name: "testing",
	label: "Testing",
	description: "Review for test coverage, test quality, and testing best practices.",
	checklist: TESTING_CHECKLIST,
	defaultSeverity: "should-fix",
};

registry.register(TESTING_PERSPECTIVE);
