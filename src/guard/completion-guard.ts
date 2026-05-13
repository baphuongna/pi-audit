/**
 * Completion Guard - Pattern from pi-crew completion-guard.ts
 * 
 * Detects when tasks claim success but made no observable mutations.
 */

const MUTATING_TOOLS = new Set([
  "edit", "write", "multi_edit", "apply_patch",
  "replace_in_file", "insert", "delete_files",
  "create_file", "overwrite", "patch", "bash"
]);

const MUTATING_COMMANDS = /\b(rm\s+-|del\s+|mv\s+|cp\s+|mkdir\b|git\s+(add|commit|push)|npm\s+(install|publish))\b/i;

export interface MutationCheckResult {
  expectsMutation: boolean;
  observedMutation: boolean;
  observedTools: string[];
}

export function isMutatingToolCall(tool: string, args?: string): boolean {
  const normalized = tool.toLowerCase();
  
  // Check args for bash/shell commands
  if ((normalized === "bash" || normalized === "shell") && args) {
    return MUTATING_COMMANDS.test(args);
  }
  
  // For other tools, check the mutating tools list
  if (MUTATING_TOOLS.has(normalized)) return true;
  
  return false;
}

export function evaluateMutationGuard(
  role: string,
  transcriptText: string
): MutationCheckResult {
  const mutatingRoles = new Set(["executor", "test-engineer", "implementer"]);
  const expectsMutation = mutatingRoles.has(role);
  const observedTools: string[] = [];
  let observedMutation = false;

  // Parse JSON events from transcript
  for (const line of transcriptText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    try {
      const event = JSON.parse(trimmed);
      const tool = event.toolName ?? event.name ?? event.tool;
      if (typeof tool === "string") {
        observedTools.push(tool);
        if (isMutatingToolCall(tool, event.args)) {
          observedMutation = true;
        }
      }
    } catch {
      // Not JSON, skip
    }
  }

  return { expectsMutation, observedMutation, observedTools };
}

/**
 * Check if a review task expected mutation but found none
 */
export function checkReviewMutationResult(
  reviewOutput: string,
  options?: { strict?: boolean }
): { passed: boolean; message: string } {
  // Look for indicators of mutation
  const mutationIndicators = [
    /edit|write|create|modify|patch|delete/i,
    /\+\+\+|\-\-\-|diff/i,
    /#?\s*(fixed|updated|changed|added|removed)/i,
  ];

  const hasMutation = mutationIndicators.some(pattern => pattern.test(reviewOutput));
  
  if (options?.strict && !hasMutation) {
    return {
      passed: false,
      message: "Review output suggests no file changes were made"
    };
  }

  return { passed: true, message: "Mutation check passed" };
}
