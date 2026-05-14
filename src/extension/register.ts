import type { ExtensionAPI, ExtensionContext, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "../config.ts";
import { registerReviewTools } from "./tool-registry.ts";
import {
  DEFAULT_POLICY,
  createDeletePathGuard,
  createConsentVerifier,
  createComplianceChecker,
  generateAuditEntry,
  type GovernancePolicy,
} from "../governance/index.ts";

// Governance state for the session
let activePolicy: GovernancePolicy = DEFAULT_POLICY;
let deletePathGuard = createDeletePathGuard(DEFAULT_POLICY);
let consentVerifier = createConsentVerifier(DEFAULT_POLICY);
let complianceChecker = createComplianceChecker(DEFAULT_POLICY);

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

		// Initialize governance with config settings if available
		if (config.governance) {
			const {
				retentionDays = DEFAULT_POLICY.retentionDays,
				privacyLevel = DEFAULT_POLICY.privacyLevel,
				auditLog = DEFAULT_POLICY.auditLog,
				consentRequired = DEFAULT_POLICY.consentRequired,
			} = config.governance;
			activePolicy = { retentionDays, privacyLevel, auditLog, consentRequired };
			deletePathGuard = createDeletePathGuard(activePolicy);
			consentVerifier = createConsentVerifier(activePolicy);
			complianceChecker = createComplianceChecker(activePolicy);
		}

		// Register review tools
		registerReviewTools(pi);

		// Register slash commands
		registerReviewCommands(pi, ctx);
	});
}

/**
 * Governance helper functions exported for use by other modules
 */
export function getDeletePathGuard() {
	return deletePathGuard;
}

export function getConsentVerifier() {
	return consentVerifier;
}

export function getComplianceChecker() {
	return complianceChecker;
}

export function getActivePolicy(): GovernancePolicy {
	return activePolicy;
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
