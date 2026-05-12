import { spawn } from "node:child_process";

export interface GitDiffOptions {
	base?: string;
	head?: string;
	cwd: string;
	maxFiles?: number;
}

export async function extractDiff(options: GitDiffOptions): Promise<string> {
	const { cwd, base, head, maxFiles = 20 } = options;

	const args = ["diff", "--unified=5"];
	if (base && head) {
		args.push(`${base}...${head}`);
	} else if (base) {
		args.push(base);
	} else {
		// Default: staged + unstaged changes vs HEAD
		args.push("HEAD");
	}

	const result = await runGit(args, cwd);

	if (result.exitCode !== 0 && !result.stdout) {
		throw new Error(`git diff failed (exit ${result.exitCode}): ${result.stderr}`);
	}

	// Limit files if needed
	if (maxFiles > 0) {
		return limitFiles(result.stdout, maxFiles);
	}

	return result.stdout;
}

export async function extractFileDiff(cwd: string, file: string, base?: string): Promise<string> {
	const args = ["diff", "--unified=5"];
	if (base) {
		args.push(base);
	} else {
		args.push("HEAD");
	}
	args.push("--", file);

	const result = await runGit(args, cwd);
	return result.stdout;
}

function limitFiles(diff: string, maxFiles: number): string {
	const files: string[] = [];
	const lines = diff.split("\n");
	const output: string[] = [];
	let currentFileOutput: string[] = [];
	let inFile = false;

	for (const line of lines) {
		if (line.startsWith("diff --git")) {
			if (inFile && files.length < maxFiles) {
				output.push(...currentFileOutput);
			}
			if (files.length >= maxFiles) {
				output.push(`\n... (truncated: showing first ${maxFiles} files)`);
				return output.join("\n");
			}
			const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
			if (match) {
				files.push(match[2]!);
			}
			currentFileOutput = [line];
			inFile = true;
		} else if (inFile) {
			currentFileOutput.push(line);
		}
	}

	if (inFile && files.length <= maxFiles) {
		output.push(...currentFileOutput);
	}

	return output.join("\n");
}

function runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return new Promise((resolve) => {
		const proc = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
		const stdoutChunks: Buffer[] = [];
		const stderrChunks: Buffer[] = [];

		proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
		proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

		proc.on("close", (code) => {
			resolve({
				stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
				stderr: Buffer.concat(stderrChunks).toString("utf-8"),
				exitCode: code ?? 0,
			});
		});

		proc.on("error", (err) => {
			resolve({ stdout: "", stderr: err.message, exitCode: 1 });
		});
	});
}
