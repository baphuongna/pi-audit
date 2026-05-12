import type { PerspectiveDefinition } from "../types.ts";
import { registry } from "./registry.ts";

export const PERFORMANCE_CHECKLIST = [
	"N+1 queries — batched database calls?",
	"Memory — large objects cleaned up?",
	"Async — blocking calls in async context?",
	"Caching — repeated computations cached?",
	"Bundle size — unnecessary imports?",
	"Algorithm complexity — optimal data structures?",
	"Resource cleanup — file handles, connections closed?",
	"Concurrency — race conditions possible?",
];

export const PERFORMANCE_PERSPECTIVE: PerspectiveDefinition = {
	name: "performance",
	label: "Performance",
	description: "Review for performance issues including memory, CPU, I/O, and concurrency problems.",
	checklist: PERFORMANCE_CHECKLIST,
	defaultSeverity: "should-fix",
};

registry.register(PERFORMANCE_PERSPECTIVE);
