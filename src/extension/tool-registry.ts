import type { ExtensionAPI, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { ReviewOrchestrator } from "../review/orchestrator.ts";
import { generateReport, formatReport } from "../review/report.ts";
import { calculateImpact } from "../diff/impact-calculator.ts";
import { classifyChanges, allHunks } from "../diff/change-analysis.ts";
import { classifyIntake, selectWorkflow, applyIntakeWorkflow } from "../intake/intake-lanes.ts";

interface ReviewToolResult {
	content: Array<{ type: "text"; text: string }>;
	details: { tool: string; status: "ok" | "error" };
	isError?: boolean;
}

function reviewResult(text: string, isError = false): ReviewToolResult {
	return {
		content: [{ type: "text", text }],
		details: { tool: "pi-audit", status: isError ? "error" : "ok" },
		...(isError ? { isError: true as const } : {}),
	};
}

export function registerReviewTools(pi: ExtensionAPI): void {
	// review_diff
	pi.registerTool({
		name: "review_diff",
		label: "Review Diff",
		description: "Review git diff with multi-perspective analysis. Returns findings categorized by security, performance, maintainability, testing, and production readiness.",
		parameters: Type.Object({
			base: Type.Optional(Type.String({ description: "Git base ref (default: HEAD~1 or main)." })),
			head: Type.Optional(Type.String({ description: "Git head ref (default: HEAD)." })),
			perspectives: Type.Optional(Type.Array(Type.String(), { description: "Review perspectives to use. Default: all enabled." })),
			maxFiles: Type.Optional(Type.Number({ description: "Maximum files to review. Default: 20." })),
			lane: Type.Optional(Type.String({ description: "Intake lane: 'tiny', 'normal', or 'high-risk'. Auto-detected if not specified." })),
		}) as never,
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const p = params as { base?: string; head?: string; perspectives?: string[]; maxFiles?: number; lane?: string };
			try {
				// Apply intake lane classification
				const metadata = classifyIntake({
					files: undefined,
					base: p.base,
					head: p.head,
					explicitLane: p.lane as "tiny" | "normal" | "high-risk" | undefined,
					userDescription: undefined,
				});
				const workflow = selectWorkflow(metadata);

				const orchestrator = new ReviewOrchestrator(ctx.cwd);
				const reviewParams = applyIntakeWorkflow({
					base: p.base,
					head: p.head,
					perspectives: p.perspectives,
					maxFiles: p.maxFiles,
				}, workflow);
				const report = await orchestrator.reviewDiff(ctx.cwd, reviewParams);
				const formatted = formatReport(report);

				// Add intake metadata to result if high-risk or canary mode
				if (metadata.lane !== "normal" || metadata.canaryMode) {
					const laneInfo = `[${metadata.lane.toUpperCase()}] ${metadata.justification}`;
					return reviewResult(`${laneInfo}\n\n${formatted}`);
				}
				return reviewResult(formatted);
			} catch (error) {
				return reviewResult(error instanceof Error ? error.message : String(error), true);
			}
		},
	} satisfies ToolDefinition);

	// review_file
	pi.registerTool({
		name: "review_file",
		label: "Review File",
		description: "Review a single file with multi-perspective analysis. Use 'full' context for complete file review or 'changed-only' for diff-based review.",
		parameters: Type.Object({
			file: Type.String({ description: "File path to review." }),
			perspectives: Type.Optional(Type.Array(Type.String(), { description: "Review perspectives to use." })),
			context: Type.Optional(Type.String({ description: "'full' for complete file or 'changed-only' for diff. Default: full." })),
			lane: Type.Optional(Type.String({ description: "Intake lane: 'tiny', 'normal', or 'high-risk'. Auto-detected if not specified." })),
		}) as never,
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const p = params as { file: string; perspectives?: string[]; context?: string; lane?: string };
			try {
				// Apply intake lane classification
				const metadata = classifyIntake({
					files: [p.file],
					explicitLane: p.lane as "tiny" | "normal" | "high-risk" | undefined,
					userDescription: undefined,
				});
				const workflow = selectWorkflow(metadata);

				const orchestrator = new ReviewOrchestrator(ctx.cwd);
				const reviewParams = applyIntakeWorkflow({
					file: p.file,
					perspectives: p.perspectives,
					context: p.context === "changed-only" ? "changed-only" : "full",
				}, workflow);
				const report = await orchestrator.reviewFile(ctx.cwd, p.file, reviewParams);
				const formatted = formatReport(report);

				// Add intake metadata to result if high-risk or canary mode
				if (metadata.lane !== "normal" || metadata.canaryMode) {
					const laneInfo = `[${metadata.lane.toUpperCase()}] ${metadata.justification}`;
					return reviewResult(`${laneInfo}\n\n${formatted}`);
				}
				return reviewResult(formatted);
			} catch (error) {
				return reviewResult(error instanceof Error ? error.message : String(error), true);
			}
		},
	} satisfies ToolDefinition);

	// review_report
	pi.registerTool({
		name: "review_report",
		label: "Review Report",
		description: "Generate a formatted review report from findings. Supports markdown, JSON, and summary formats.",
		parameters: Type.Object({
			format: Type.Optional(Type.String({ description: "Output format: 'markdown', 'json', or 'summary'. Default: markdown." })),
			includeSuggestions: Type.Optional(Type.Boolean({ description: "Include fix suggestions. Default: true." })),
			groupBy: Type.Optional(Type.String({ description: "Group findings by: 'file', 'perspective', or 'severity'. Default: file." })),
		}) as never,
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const p = params as { format?: string; includeSuggestions?: boolean; groupBy?: string };
			try {
				const orchestrator = new ReviewOrchestrator(ctx.cwd);

				// Run a diff review first to get current findings
				const diffReport = await orchestrator.reviewDiff(ctx.cwd);
				const report = orchestrator.generateFormattedReport(
					diffReport.findings,
					{
						format: (p.format === "json" ? "json" : p.format === "summary" ? "summary" : "markdown") as "markdown" | "json" | "summary",
						groupBy: (p.groupBy === "perspective" ? "perspective" : p.groupBy === "severity" ? "severity" : "file") as "file" | "perspective" | "severity",
						includeSuggestions: p.includeSuggestions !== false,
					},
				);
				const formatted = formatReport(report);
				return reviewResult(formatted);
			} catch (error) {
				return reviewResult(error instanceof Error ? error.message : String(error), true);
			}
		},
	} satisfies ToolDefinition);
}
