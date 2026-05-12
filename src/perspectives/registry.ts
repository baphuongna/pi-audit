import type { PerspectiveDefinition, DiffHunk } from "../types.ts";

class PerspectiveRegistry {
	private perspectives = new Map<string, PerspectiveDefinition>();

	register(definition: PerspectiveDefinition): void {
		this.perspectives.set(definition.name, definition);
	}

	get(name: string): PerspectiveDefinition | undefined {
		return this.perspectives.get(name);
	}

	list(): PerspectiveDefinition[] {
		return [...this.perspectives.values()];
	}

	names(): string[] {
		return [...this.perspectives.keys()];
	}

	filterByNames(names?: string[]): PerspectiveDefinition[] {
		if (!names || names.length === 0) {
			return this.list();
		}
		return names
			.map((n) => this.perspectives.get(n))
			.filter((p): p is PerspectiveDefinition => p !== undefined);
	}

	buildPromptContext(perspective: PerspectiveDefinition, hunks: DiffHunk[]): string {
		const lines: string[] = [];
		lines.push(`## ${perspective.label} Review (${perspective.name})`);
		lines.push(perspective.description);
		lines.push("");
		lines.push("### Checklist:");
		for (const item of perspective.checklist) {
			lines.push(`- [ ] ${item}`);
		}
		if (perspective.threatModel) {
			lines.push("");
			lines.push("### Threat Model:");
			for (const [category, items] of Object.entries(perspective.threatModel)) {
				lines.push(`**${category}:**`);
				for (const item of items) {
					lines.push(`  - ${item}`);
				}
			}
		}
		if (hunks.length > 0) {
			lines.push("");
			lines.push("### Changed Files:");
			const files = [...new Set(hunks.map((h) => h.file))];
			for (const file of files) {
				const fileHunks = hunks.filter((h) => h.file === file);
				lines.push(`- ${file} (${fileHunks.length} hunks)`);
			}
		}
		return lines.join("\n");
	}

	clear(): void {
		this.perspectives.clear();
	}
}

// Singleton registry
export const registry = new PerspectiveRegistry();

// Re-export class for testing
export { PerspectiveRegistry };
