import type { PerspectiveDefinition } from "../types.ts";
import { registry } from "./registry.ts";

export const SECURITY_CHECKLIST = [
	"Input validation — all user inputs sanitized?",
	"Authentication — no hardcoded credentials?",
	"Authorization — proper permission checks?",
	"SQL injection — parameterized queries?",
	"XSS — output encoded?",
	"CSRF — tokens present?",
	"Secrets — no API keys in source?",
	"Error handling — no sensitive data in error messages?",
	"Dependencies — known vulnerabilities?",
	"File operations — path traversal prevented?",
	"Rate limiting — abuse prevention?",
	"Logging — sensitive data excluded from logs?",
];

export const OWASP_TOP_10: Record<string, string[]> = {
	"A01 - Broken Access Control": [
		"Check for missing authorization checks",
		"Verify role-based access controls",
		"Ensure proper resource ownership validation",
	],
	"A02 - Cryptographic Failures": [
		"Check for hardcoded secrets or keys",
		"Verify TLS/HTTPS usage for data in transit",
		"Ensure sensitive data is encrypted at rest",
	],
	"A03 - Injection": [
		"Check for SQL injection in database queries",
		"Verify command injection prevention",
		"Check for XSS in template rendering",
	],
	"A04 - Insecure Design": [
		"Verify threat modeling was performed",
		"Check for secure design patterns",
		"Ensure proper trust boundaries",
	],
	"A05 - Security Misconfiguration": [
		"Check for default credentials",
		"Verify error handling doesn't expose stack traces",
		"Ensure security headers are set",
	],
	"A06 - Vulnerable Components": [
		"Check dependency versions for known CVEs",
		"Verify pinned dependencies",
	],
	"A07 - Auth Failures": [
		"Check for brute-force protection",
		"Verify session management",
		"Ensure proper password policies",
	],
	"A08 - Data Integrity Failures": [
		"Verify input validation",
		"Check for deserialization vulnerabilities",
	],
	"A09 - Logging Failures": [
		"Ensure security events are logged",
		"Verify logs don't contain sensitive data",
	],
	"A10 - SSRF": [
		"Check for server-side request forgery",
		"Verify URL validation",
	],
};

export const STRIDE: Record<string, string[]> = {
	Spoofing: [
		"Verify authentication mechanisms",
		"Check for identity impersonation risks",
	],
	Tampering: [
		"Check for data integrity protections",
		"Verify input validation",
	],
	Repudiation: [
		"Ensure audit logging exists",
		"Verify non-repudiation controls",
	],
	"Information Disclosure": [
		"Check for sensitive data exposure",
		"Verify access controls on data",
	],
	"Denial of Service": [
		"Check for resource exhaustion risks",
		"Verify rate limiting and quotas",
	],
	"Elevation of Privilege": [
		"Check for privilege escalation paths",
		"Verify least privilege principles",
	],
};

export const SECURITY_PERSPECTIVE: PerspectiveDefinition = {
	name: "security",
	label: "Security",
	description: "Review for security vulnerabilities using OWASP Top 10 and STRIDE threat model.",
	checklist: SECURITY_CHECKLIST,
	defaultSeverity: "must-fix",
	threatModel: { ...OWASP_TOP_10, ...STRIDE },
};

registry.register(SECURITY_PERSPECTIVE);
