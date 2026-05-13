import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerPiReview } from "./src/extension/register.ts";

export default function (pi: ExtensionAPI): void {
	registerPiReview(pi);
}

// Category audit exports
export { createCategoryAnalyzer, type CategorizedFinding, type CategorySummary, type AuditCategory } from './review/category-audit.js';
