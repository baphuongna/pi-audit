import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import {
	classifyIntake,
	selectWorkflow,
	applyIntakeWorkflow,
	evaluateEscalation,
	INTAKE_LANES,
	listLanes,
	isValidLane,
	formatLaneDisplay,
	getLaneConfig,
	type IntakeLane,
	type IntakeRequest,
	type IntakeMetadata,
} from "../../src/intake/intake-lanes.ts";

// ─── classifyIntake Tests ────────────────────────────────────────────────────

describe("classifyIntake", () => {
	it("classifies micro changes as tiny lane", () => {
		const request: IntakeRequest = { files: ["src/utils.ts"] };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "tiny");
		assert.equal(result.changeSize, "micro");
	});

	it("classifies small changes as tiny lane", () => {
		const request: IntakeRequest = { files: ["src/a.ts", "src/b.ts"] };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "tiny");
		assert.ok(["micro", "small"].includes(result.changeSize));
	});

	it("classifies medium changes as normal lane", () => {
		const request: IntakeRequest = { files: ["src/a.ts", "src/b.ts", "src/c.ts", "src/d.ts", "src/e.ts", "src/f.ts", "src/g.ts", "src/h.ts"] };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "normal");
		assert.equal(result.changeSize, "medium");
	});

	it("classifies security files as high-risk lane", () => {
		const request: IntakeRequest = { files: ["src/security/auth.ts"] };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "high-risk");
		assert.ok(result.riskSignals.includes("security-sensitive"));
	});

	it("classifies governance files as high-risk lane", () => {
		const request: IntakeRequest = { files: ["src/governance/policy.ts"] };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "high-risk");
		assert.ok(result.riskSignals.includes("governance-sensitive"));
	});

	it("classifies core library files as high-risk lane", () => {
		const request: IntakeRequest = { files: ["src/lib/core.ts"] };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "high-risk");
		assert.ok(result.riskSignals.includes("core-library"));
	});

	it("respects explicit lane override", () => {
		const request: IntakeRequest = { 
			files: ["src/utils.ts"], 
			explicitLane: "high-risk" 
		};
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "high-risk");
	});

	it("detects production description as risk signal", () => {
		const request: IntakeRequest = { 
			files: ["src/test.ts"],
			userDescription: "production hotfix"
		};
		const result = classifyIntake(request);
		
		assert.ok(result.riskSignals.includes("production-critical"));
		assert.ok(result.canaryMode === true);
	});

	it("detects security description as risk signal", () => {
		const request: IntakeRequest = { 
			files: ["src/test.ts"],
			userDescription: "security vulnerability fix"
		};
		const result = classifyIntake(request);
		
		assert.ok(result.riskSignals.includes("security-sensitive"));
		assert.ok(result.canaryMode === true);
	});

	it("handles no files specified", () => {
		const request: IntakeRequest = {};
		const result = classifyIntake(request);
		
		assert.ok(result.riskSignals.includes("no-files-specified"));
	});

	it("classifies xlarge changes as high-risk", () => {
		const files = Array.from({ length: 35 }, (_, i) => `src/file${i}.ts`);
		const request: IntakeRequest = { files };
		const result = classifyIntake(request);
		
		assert.equal(result.lane, "high-risk");
	});
});

// ─── selectWorkflow Tests ────────────────────────────────────────────────────

describe("selectWorkflow", () => {
	it("returns tiny workflow for tiny lane", () => {
		const metadata: IntakeMetadata = {
			lane: "tiny",
			changeSize: "micro",
			riskSignals: ["micro-change"],
			justification: "Quick review",
		};
		const workflow = selectWorkflow(metadata);
		
		assert.equal(workflow.lane, "tiny");
		assert.equal(workflow.maxFiles, 3);
		assert.ok(!workflow.includeSuggestions);
	});

	it("returns normal workflow for normal lane", () => {
		const metadata: IntakeMetadata = {
			lane: "normal",
			changeSize: "medium",
			riskSignals: ["medium-change"],
			justification: "Standard review",
		};
		const workflow = selectWorkflow(metadata);
		
		assert.equal(workflow.lane, "normal");
		assert.equal(workflow.maxFiles, 20);
		assert.ok(workflow.includeSuggestions);
	});

	it("returns high-risk workflow for high-risk lane", () => {
		const metadata: IntakeMetadata = {
			lane: "high-risk",
			changeSize: "large",
			riskSignals: ["security-sensitive"],
			justification: "Deep review",
		};
		const workflow = selectWorkflow(metadata);
		
		assert.equal(workflow.lane, "high-risk");
		assert.equal(workflow.maxFiles, 100);
		assert.ok(workflow.includeSuggestions);
	});

	it("enables escalation for high signal count", () => {
		const metadata: IntakeMetadata = {
			lane: "normal",
			changeSize: "medium",
			riskSignals: ["a", "b", "c", "d"],
			justification: "Multiple signals",
		};
		const workflow = selectWorkflow(metadata);
		
		assert.ok(workflow.escalationNeeded);
	});

	it("uses canary mode perspectives when canary enabled", () => {
		const metadata: IntakeMetadata = {
			lane: "normal",
			changeSize: "medium",
			riskSignals: ["production-critical"],
			justification: "Canary mode",
			canaryMode: true,
		};
		const workflow = selectWorkflow(metadata);
		
		assert.ok(workflow.perspectives.length > 6); // Has extra security
	});
});

// ─── applyIntakeWorkflow Tests ────────────────────────────────────────────────

describe("applyIntakeWorkflow", () => {
	it("caps maxFiles based on workflow", () => {
		const workflow = selectWorkflow({
			lane: "tiny",
			changeSize: "small",
			riskSignals: ["small-change"],
			justification: "Test",
		});
		
		const result = applyIntakeWorkflow(
			{ maxFiles: 50 },
			workflow
		);
		
		assert.equal(result.maxFiles, 3); // Capped to tiny lane max
	});

	it("applies default perspectives when not specified", () => {
		const workflow = selectWorkflow({
			lane: "normal",
			changeSize: "medium",
			riskSignals: [],
			justification: "Test",
		});
		
		const result = applyIntakeWorkflow(
			{},
			workflow
		) as { perspectives: string[] };
		
		assert.ok(result.perspectives.length > 0);
		assert.ok(result.perspectives.includes("security"));
	});

	it("preserves user-specified perspectives", () => {
		const workflow = selectWorkflow({
			lane: "normal",
			changeSize: "medium",
			riskSignals: [],
			justification: "Test",
		});
		
		const result = applyIntakeWorkflow(
			{ perspectives: ["security"] },
			workflow
		) as { perspectives: string[] };
		
		assert.deepEqual(result.perspectives, ["security"]);
	});
});

// ─── evaluateEscalation Tests ────────────────────────────────────────────────

describe("evaluateEscalation", () => {
	it("escalates from tiny when threshold exceeded", () => {
		const metadata: IntakeMetadata = {
			lane: "tiny",
			changeSize: "micro",
			riskSignals: ["micro-change"],
			justification: "Test",
		};
		const workflow = selectWorkflow(metadata);
		
		const decision = evaluateEscalation(5, metadata, workflow); // Exceeds tiny threshold of 2
		
		assert.ok(decision.shouldEscalate);
		assert.equal(decision.targetLane, "normal");
	});

	it("escalates from normal to high-risk when threshold exceeded", () => {
		const metadata: IntakeMetadata = {
			lane: "normal",
			changeSize: "medium",
			riskSignals: [],
			justification: "Test",
		};
		const workflow = selectWorkflow(metadata);
		
		const decision = evaluateEscalation(15, metadata, workflow); // Exceeds normal threshold of 10
		
		assert.ok(decision.shouldEscalate);
		assert.equal(decision.targetLane, "high-risk");
	});

	it("does not escalate when below threshold", () => {
		const metadata: IntakeMetadata = {
			lane: "normal",
			changeSize: "medium",
			riskSignals: [],
			justification: "Test",
		};
		const workflow = selectWorkflow(metadata);
		
		const decision = evaluateEscalation(5, metadata, workflow); // Below normal threshold of 10
		
		assert.ok(!decision.shouldEscalate);
	});

	it("high-risk lane findings do not escalate further", () => {
		const metadata: IntakeMetadata = {
			lane: "high-risk",
			changeSize: "large",
			riskSignals: [],
			justification: "Test",
		};
		const workflow = selectWorkflow(metadata);
		
		const decision = evaluateEscalation(50, metadata, workflow);
		
		// High-risk is already max lane, no further escalation possible
		assert.ok(!decision.shouldEscalate);
		assert.equal(decision.targetLane, undefined);
	});
});

// ─── Lane Utilities Tests ────────────────────────────────────────────────────

describe("Lane utilities", () => {
	it("INTAKE_LANES contains all three lanes", () => {
		assert.ok(INTAKE_LANES.tiny);
		assert.ok(INTAKE_LANES.normal);
		assert.ok(INTAKE_LANES["high-risk"]);
	});

	it("listLanes returns all lanes", () => {
		const lanes = listLanes();
		
		assert.equal(lanes.length, 3);
		assert.ok(lanes.some(l => l.id === "tiny"));
		assert.ok(lanes.some(l => l.id === "normal"));
		assert.ok(lanes.some(l => l.id === "high-risk"));
	});

	it("getLaneConfig returns correct config", () => {
		const config = getLaneConfig("tiny");
		
		assert.equal(config.id, "tiny");
		assert.equal(config.maxFiles, 3);
	});

	it("isValidLane validates correctly", () => {
		assert.ok(isValidLane("tiny"));
		assert.ok(isValidLane("normal"));
		assert.ok(isValidLane("high-risk"));
		assert.ok(!isValidLane("invalid"));
	});

	it("formatLaneDisplay returns formatted string", () => {
		const display = formatLaneDisplay("tiny");
		
		assert.ok(display.includes("Tiny"));
		assert.ok(display.includes("Quick review"));
	});

	it("each lane has correct thresholds", () => {
		assert.equal(INTAKE_LANES.tiny.escalationThreshold, 2);
		assert.equal(INTAKE_LANES.normal.escalationThreshold, 10);
		assert.equal(INTAKE_LANES["high-risk"].escalationThreshold, 25);
	});

	it("each lane has correct maxFiles", () => {
		assert.equal(INTAKE_LANES.tiny.maxFiles, 3);
		assert.equal(INTAKE_LANES.normal.maxFiles, 20);
		assert.equal(INTAKE_LANES["high-risk"].maxFiles, 100);
	});
});