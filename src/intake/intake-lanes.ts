/**
 * Feature Intake Lanes
 * 
 * Pattern from harness-experimental (Round 43 research)
 * 
 * Hard gate classification at intake with 3 lanes:
 * - tiny: Quick reviews, small changes, low risk
 * - normal: Standard reviews, balanced approach
 * - high-risk: Deep analysis, extended review workflow
 */

import type { ReviewDiffParams, ReviewFileParams } from "../types.ts";

// ─── Lane Definitions ─────────────────────────────────────────────────────────

export type IntakeLane = "tiny" | "normal" | "high-risk";

export interface LaneConfig {
	id: IntakeLane;
	label: string;
	description: string;
	maxFiles: number;
	maxPerspectives: number;
	includeSuggestions: boolean;
	defaultPerspectives: string[];
	escalationThreshold: number; // Findings above this trigger escalation
}

export const INTAKE_LANES: Record<IntakeLane, LaneConfig> = {
	tiny: {
		id: "tiny",
		label: "Tiny",
		description: "Quick review for small, low-risk changes",
		maxFiles: 3,
		maxPerspectives: 2,
		includeSuggestions: false,
		defaultPerspectives: ["security", "style"],
		escalationThreshold: 2,
	},
	normal: {
		id: "normal",
		label: "Normal",
		description: "Standard review for balanced analysis",
		maxFiles: 20,
		maxPerspectives: 6,
		includeSuggestions: true,
		defaultPerspectives: ["security", "performance", "maintainability", "style", "testing", "production"],
		escalationThreshold: 10,
	},
	"high-risk": {
		id: "high-risk",
		label: "High Risk",
		description: "Deep analysis for critical changes",
		maxFiles: 100,
		maxPerspectives: 6,
		includeSuggestions: true,
		defaultPerspectives: ["security", "performance", "maintainability", "style", "testing", "production"],
		escalationThreshold: 25,
	},
};

// ─── Risk Classification ────────────────────────────────────────────────────────

export interface IntakeMetadata {
	lane: IntakeLane;
	changeSize: "micro" | "small" | "medium" | "large" | "xlarge";
	riskSignals: string[];
	justification: string;
	canaryMode?: boolean;
}

export interface IntakeRequest {
	files?: string[];
	base?: string;
	head?: string;
	explicitLane?: IntakeLane;
	overrideMaxFiles?: number;
	userDescription?: string;
}

/**
 * Hard gate classification - determines lane based on intake signals
 * This is the primary classification function
 */
export function classifyIntake(request: IntakeRequest): IntakeMetadata {
	const signals = analyzeRiskSignals(request);
	
	// Determine lane based on signals
	const lane = determineLane(signals, request.explicitLane);
	const changeSize = determineChangeSize(signals, request);
	
	return {
		lane,
		changeSize,
		riskSignals: signals,
		justification: buildJustification(lane, signals),
		canaryMode: signals.includes("production-critical") || signals.includes("security-sensitive"),
	};
}

/**
 * Analyze risk signals from the intake request
 */
function analyzeRiskSignals(request: IntakeRequest): string[] {
	const signals: string[] = [];
	
	// File count signals
	const fileCount = request.files?.length ?? 0;
	
	if (fileCount === 0) {
		signals.push("no-files-specified");
	} else if (fileCount <= 2) {
		signals.push("micro-change");
	} else if (fileCount <= 5) {
		signals.push("small-change");
	} else if (fileCount <= 15) {
		signals.push("medium-change");
	} else if (fileCount <= 30) {
		signals.push("large-change");
	} else {
		signals.push("xlarge-change");
	}
	
	// Check for high-risk file patterns
	const highRiskPatterns = [
		{ pattern: /^\/?src\/lib\//, signal: "core-library" },
		{ pattern: /^\/?src\/agent/, signal: "agent-code" },
		{ pattern: /^\/?src\/security/, signal: "security-sensitive" },
		{ pattern: /^\/?src\/governance/, signal: "governance-sensitive" },
		{ pattern: /^\/?src\/core\//, signal: "core-component" },
		{ pattern: /^\/?src\/config\//, signal: "configuration" },
		{ pattern: /^\/?\.github\/workflows?\//, signal: "ci-change" },
		{ pattern: /^\/?docker/i, signal: "infrastructure" },
		{ pattern: /\.test\.|spec\./, signal: "test-only" },
	];
	
	if (request.files) {
		for (const file of request.files) {
			for (const { pattern, signal } of highRiskPatterns) {
				if (pattern.test(file)) {
					signals.push(signal);
				}
			}
		}
	}
	
	// Check for production-related signals
	if (request.userDescription) {
		const desc = request.userDescription.toLowerCase();
		if (desc.includes("production") || desc.includes("prod")) {
			signals.push("production-critical");
		}
		if (desc.includes("security") || desc.includes("vulnerability")) {
			signals.push("security-sensitive");
		}
		if (desc.includes("urgent") || desc.includes("hotfix")) {
			signals.push("hotfix");
		}
	}
	
	// Git diff size estimation
	if (request.base && request.head) {
		signals.push("git-diff-specified");
		// Large diffs indicate higher risk
		signals.push("diff-review");
	}
	
	return Array.from(new Set(signals)); // Deduplicate
}

/**
 * Determine lane based on signals and explicit override
 */
function determineLane(signals: string[], explicitLane?: IntakeLane): IntakeLane {
	// Explicit lane takes priority
	if (explicitLane && INTAKE_LANES[explicitLane]) {
		return explicitLane;
	}
	
	// High-risk signals force high-risk lane
	const highRiskSignals = [
		"security-sensitive",
		"governance-sensitive",
		"production-critical",
		"core-library",
		"core-component",
	];
	
	if (highRiskSignals.some(s => signals.includes(s))) {
		return "high-risk";
	}
	
	// Micro/small changes with no high-risk signals go to tiny lane
	if (signals.includes("micro-change") || signals.includes("small-change")) {
		// But only if no security or core signals
		if (!signals.some(s => highRiskSignals.includes(s))) {
			return "tiny";
		}
	}
	
	// Xlarge changes need high-risk
	if (signals.includes("xlarge-change")) {
		return "high-risk";
	}
	
	// Everything else goes to normal
	return "normal";
}

/**
 * Determine the change size category
 */
function determineChangeSize(signals: string[], request: IntakeRequest): IntakeMetadata["changeSize"] {
	for (const signal of signals) {
		if (signal === "micro-change") return "micro";
		if (signal === "small-change") return "small";
		if (signal === "medium-change") return "medium";
		if (signal === "large-change") return "large";
		if (signal === "xlarge-change") return "xlarge";
	}
	
	// Default based on file count
	const count = request.files?.length ?? 0;
	if (count <= 1) return "micro";
	if (count <= 5) return "small";
	if (count <= 15) return "medium";
	if (count <= 30) return "large";
	return "xlarge";
}

/**
 * Build justification string for the classification
 */
function buildJustification(lane: IntakeLane, signals: string[]): string {
	const signalCount = signals.length;
	
	const laneMessages: Record<IntakeLane, string> = {
		tiny: `Quick review: ${signalCount} signal(s) detected, all low-risk.`,
		normal: `Standard review: ${signalCount} signal(s) detected, balanced risk profile.`,
		"high-risk": `Deep review: ${signalCount} signal(s) detected, elevated risk signals present.`,
	};
	
	return laneMessages[lane];
}

// ─── Workflow Selection ────────────────────────────────────────────────────────

export interface IntakeWorkflow {
	lane: IntakeLane;
	config: LaneConfig;
	perspectives: string[];
	maxFiles: number;
	includeSuggestions: boolean;
	escalationNeeded: boolean;
}

/**
 * Select the appropriate workflow based on intake classification
 */
export function selectWorkflow(metadata: IntakeMetadata): IntakeWorkflow {
	const config = INTAKE_LANES[metadata.lane];
	
	// Adjust perspectives based on canary mode
	const perspectives = metadata.canaryMode
		? [...config.defaultPerspectives, "security"]
		: config.defaultPerspectives;
	
	return {
		lane: metadata.lane,
		config,
		perspectives,
		maxFiles: config.maxFiles,
		includeSuggestions: config.includeSuggestions,
		escalationNeeded: metadata.riskSignals.length > 3,
	};
}

/**
 * Transform review params based on intake workflow
 */
export function applyIntakeWorkflow(
	params: ReviewDiffParams | ReviewFileParams,
	workflow: IntakeWorkflow
): ReviewDiffParams | ReviewFileParams {
	// Apply lane constraints to parameters
	const applied = { ...params };
	
	// Cap max files based on lane
	if ("maxFiles" in applied) {
		applied.maxFiles = Math.min(applied.maxFiles ?? Infinity, workflow.maxFiles);
	}
	
	// Apply default perspectives if not specified
	if (!applied.perspectives || applied.perspectives.length === 0) {
		applied.perspectives = workflow.perspectives;
	}
	
	return applied;
}

// ─── Escalation Logic ─────────────────────────────────────────────────────────

export interface EscalationDecision {
	shouldEscalate: boolean;
	reason: string;
	targetLane?: IntakeLane;
}

/**
 * Determine if findings warrant lane escalation
 */
export function evaluateEscalation(
	findingCount: number,
	metadata: IntakeMetadata,
	workflow: IntakeWorkflow
): EscalationDecision {
	const threshold = workflow.config.escalationThreshold;
	
	// High-risk lane is already at max, no further escalation possible
	if (metadata.lane === "high-risk") {
		return {
			shouldEscalate: false,
			reason: `Already at maximum lane (high-risk), findings logged for awareness.`,
		};
	}
	
	// Check if finding count exceeds threshold
	if (findingCount > threshold) {
		// Determine escalation target
		let targetLane: IntakeLane = "high-risk";
		
		if (metadata.lane === "tiny") {
			targetLane = "normal";
		} else if (metadata.lane === "normal") {
			targetLane = "high-risk";
		}
		
		return {
			shouldEscalate: true,
			reason: `Finding count (${findingCount}) exceeds threshold (${threshold})`,
			targetLane,
		};
	}
	
	return {
		shouldEscalate: false,
		reason: `Finding count (${findingCount}) within threshold (${threshold})`,
	};
}

// ─── Lane Utilities ────────────────────────────────────────────────────────────

/**
 * Get lane configuration
 */
export function getLaneConfig(lane: IntakeLane): LaneConfig {
	return INTAKE_LANES[lane];
}

/**
 * List all available lanes
 */
export function listLanes(): LaneConfig[] {
	return Object.values(INTAKE_LANES);
}

/**
 * Check if a lane is valid
 */
export function isValidLane(lane: string): lane is IntakeLane {
	return lane in INTAKE_LANES;
}

/**
 * Format lane for display
 */
export function formatLaneDisplay(lane: IntakeLane): string {
	const config = INTAKE_LANES[lane];
	return `[${config.label}] ${config.description}`;
}