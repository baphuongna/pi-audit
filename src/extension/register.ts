import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.ts";
import { registerReviewTools } from "./tool-registry.ts";

// Import perspectives to trigger registration side effects
import "../perspectives/security.ts";
import "../perspectives/performance.ts";
import "../perspectives/maintainability.ts";
import "../perspectives/style.ts";
import "../perspectives/testing.ts";
import "../perspectives/production.ts";

export function registerPiReview(pi: ExtensionAPI): void {
	pi.on("session_start", (_event, ctx: ExtensionContext) => {
		const { config } = loadConfig(ctx.cwd);

		if (!config.enabled) return;

		// Register review tools
		registerReviewTools(pi);

		// Register slash commands
		registerReviewCommands(pi, ctx);
	});
}

function registerReviewCommands(pi: ExtensionAPI, ctx: ExtensionContext): void {
	// /review — review recent changes
	pi.registerCommand("review", {
		description: "Review code changes. Subcommands: security, performance, diff, report, file <path>",
		async handler(args: string, cmdCtx: ExtensionCommandContext) {
			const arg = args?.trim().toLowerCase() ?? "";
			const { ReviewOrchestrator } = await import("../review/orchestrator.ts");
			const orchestrator = new ReviewOrchestrator(ctx.cwd);
			const { formatReport } = await import("../review/report.ts");

			let output: string;

			if (arg === "security") {
				const report = await orchestrator.reviewDiff(ctx.cwd, { perspectives: ["security"] });
				output = formatReport(report);
			} else if (arg === "performance") {
				const report = await orchestrator.reviewDiff(ctx.cwd, { perspectives: ["performance"] });
				output = formatReport(report);
			} else if (arg === "diff") {
				const report = await orchestrator.reviewDiff(ctx.cwd);
				output = formatReport(report);
			} else if (arg === "report") {
				const diffReport = await orchestrator.reviewDiff(ctx.cwd);
				const report = orchestrator.generateFormattedReport(diffReport.findings, {
					format: "summary",
					groupBy: "severity",
					includeSuggestions: true,
				});
				output = formatReport(report);
			} else if (arg.startsWith("file ")) {
				const file = arg.slice(5).trim();
				if (!file) {
					output = "Usage: /review file <path>";
				} else {
					const report = await orchestrator.reviewFile(ctx.cwd, file, { file });
					output = formatReport(report);
				}
			} else {
				// Default: full review
				const report = await orchestrator.reviewDiff(ctx.cwd);
				output = formatReport(report);
			}

			cmdCtx.ui.notify(output);
		},
	});
}
