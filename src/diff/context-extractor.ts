import * as fs from "node:fs";
import * as path from "node:path";
import type { DiffHunk, ExtractedContext } from "../types.ts";

export function extractContext(
	file: string,
	hunks: DiffHunk[],
	cwd: string,
	linesBefore = 5,
	linesAfter = 5,
): ExtractedContext[] {
	const filePath = path.resolve(cwd, file);

	if (!fs.existsSync(filePath)) {
		return [];
	}

	let fileContent: string;
	try {
		fileContent = fs.readFileSync(filePath, "utf-8");
	} catch {
		return [];
	}

	const fileLines = fileContent.split("\n");
	const results: ExtractedContext[] = [];

	for (let i = 0; i < hunks.length; i++) {
		const hunk = hunks[i]!;
		const hunkStart = hunk.newStart;
		const hunkEnd = hunkStart + hunk.newCount - 1;

		// Extract context lines
		const beforeStart = Math.max(0, hunkStart - 1 - linesBefore);
		const beforeEnd = Math.max(0, hunkStart - 1);
		const afterStart = Math.min(fileLines.length, hunkEnd);
		const afterEnd = Math.min(fileLines.length, hunkEnd + linesAfter);

		const beforeLines = fileLines.slice(beforeStart, beforeEnd);
		const hunkLines = fileLines.slice(Math.max(0, hunkStart - 1), Math.min(fileLines.length, hunkEnd));
		const afterLines = fileLines.slice(afterStart, afterEnd);

		results.push({
			file,
			hunkIndex: i,
			beforeLines,
			hunkLines,
			afterLines,
			startLine: beforeStart + 1,
		});
	}

	return results;
}
