import type { DiffHunk, ChangeType } from "../types.ts";

const DIFF_HEADER_RE = /^diff --git a\/(.+?) b\/(.+)$/;
const HUNK_HEADER_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
const NEW_FILE_RE = /^new file mode /;
const DELETED_FILE_RE = /^deleted file mode /;
const RENAME_FROM_RE = /^rename from (.+)$/;
const RENAME_TO_RE = /^rename to (.+)$/;

export interface ParsedDiff {
	file: string;
	oldFile: string;
	changeType: ChangeType;
	hunks: DiffHunk[];
}

export function classifyChanges(diff: string): ParsedDiff[] {
	if (!diff || !diff.trim()) return [];

	const results: ParsedDiff[] = [];
	let current: ParsedDiff | undefined;
	let currentHunk: DiffHunk | undefined;
	let hunkContent: string[] = [];

	const lines = diff.split("\n");

	for (const line of lines) {
		const headerMatch = line.match(DIFF_HEADER_RE);
		if (headerMatch) {
			// Save previous hunk
			if (currentHunk) {
				currentHunk.content = hunkContent.join("\n");
				current!.hunks.push(currentHunk);
			}
			if (current) {
				results.push(current);
			}

			const oldFile = headerMatch[1]!;
			const newFile = headerMatch[2]!;
			current = {
				file: newFile,
				oldFile,
				changeType: "modified",
				hunks: [],
			};
			hunkContent = [];
			currentHunk = undefined;
			continue;
		}

		if (!current) continue;

		// Detect change type from metadata
		if (NEW_FILE_RE.test(line)) {
			current!.changeType = "new";
		} else if (DELETED_FILE_RE.test(line)) {
			current!.changeType = "deleted";
		} else if (RENAME_FROM_RE.test(line) || RENAME_TO_RE.test(line)) {
			current!.changeType = "renamed";
		}

		// Parse hunk headers
		const hunkMatch = line.match(HUNK_HEADER_RE);
		if (hunkMatch) {
			// Save previous hunk
			if (currentHunk) {
				currentHunk.content = hunkContent.join("\n");
				current!.hunks.push(currentHunk);
			}

			hunkContent = [];
			currentHunk = {
				file: current!.file,
				changeType: current!.changeType,
				oldStart: parseInt(hunkMatch[1]!, 10),
				oldCount: parseInt(hunkMatch[2] ?? "1", 10),
				newStart: parseInt(hunkMatch[3]!, 10),
				newCount: parseInt(hunkMatch[4] ?? "1", 10),
				content: "",
				header: hunkMatch[5]?.trim() ?? "",
			};
			continue;
		}

		// Collect hunk content
		if (currentHunk && current && (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ") || line.startsWith("\\ "))) {
			hunkContent.push(line);
		}
	}

	// Save last hunk
	if (currentHunk && current) {
		currentHunk.content = hunkContent.join("\n");
		current.hunks.push(currentHunk);
	}
	if (current) {
		results.push(current);
	}

	return results;
}

export function allHunks(parsed: ParsedDiff[]): DiffHunk[] {
	return parsed.flatMap((p) => p.hunks);
}
