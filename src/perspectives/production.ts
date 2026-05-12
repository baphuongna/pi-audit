import type { PerspectiveDefinition } from "../types.ts";
import { registry } from "./registry.ts";

export const PRODUCTION_CHECKLIST = [
	"Feature flags — new features behind flag?",
	"Migration — database changes reversible?",
	"Monitoring — metrics/alerts for new code?",
	"Documentation — README updated?",
	"Configuration — new config documented?",
	"Rollback — can this change be safely rolled back?",
	"Logging — sufficient for debugging?",
	"Performance — load tested?",
];

export const PRODUCTION_PERSPECTIVE: PerspectiveDefinition = {
	name: "production",
	label: "Production Readiness",
	description: "Review for production deployment readiness including monitoring, rollback, and documentation.",
	checklist: PRODUCTION_CHECKLIST,
	defaultSeverity: "should-fix",
};

registry.register(PRODUCTION_PERSPECTIVE);
