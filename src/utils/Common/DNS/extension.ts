import { toASCII } from "node:punycode";
import ky from "ky";

const IANA_TLD_URL = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";
const TLD_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours

let cachedTlds: Set<string> | null = null;
let lastTldFetchAt = 0;

async function loadTlds(): Promise<Set<string>> {
	const now = Date.now();
	if (cachedTlds && now - lastTldFetchAt < TLD_CACHE_MS) return cachedTlds;

	const text = await ky
		.get(IANA_TLD_URL, { timeout: 10_000 })
		.text()
		.catch(() => "");

	if (!text) {
		// If fetching fails, don't block lookups: fall back to previous cache if available
		return cachedTlds ?? new Set<string>();
	}

	const lines = text.trim().split("\n").slice(1);

	cachedTlds = new Set(lines.map((line) => line.toLowerCase()));
	lastTldFetchAt = now;
	return cachedTlds;
}

export function extractDomainFromInput(input: string): string | null {
	let raw = input.trim();
	if (!raw) return null;

	raw = raw.replace(/^[a-z][a-z0-9+.-]+:\/\/(.+)$/i, "$1");

	if (raw.includes("/")) raw = raw.split("/")[0] ?? "";

	if (raw.includes(":")) raw = raw.split(":")[0] ?? "";

	if (raw.toLowerCase().startsWith("www.")) raw = raw.slice(4);

	raw = raw.replace(/\.$/, "").trim();

	if (!raw) return null;
	return raw;
}

/**
 * Check whether a URL/domain has a valid and IANA-registered domain extension (TLD).
 *
 * - Supports IDN / punycode TLDs (e.g. `.香港`, `.онлайн`, etc.)
 * - Accepts inputs with or without protocol (`https://`, `http://`, `www.`)
 *
 * NOTE: This only validates the extension, not the full domain structure.
 */
export async function isValidDomainExtension(
	input: string | null | undefined,
): Promise<boolean> {
	if (!input || typeof input !== "string") return false;

	const domain = extractDomainFromInput(input);
	if (!domain) return false;

	const extension = domain.split(".").pop()?.toLowerCase() ?? "";
	if (!extension) return false;

	const tlds = await loadTlds();
	if (!tlds.size) return false;

	let formatted: string;
	try {
		formatted = toASCII(extension);
	} catch {
		formatted = extension;
	}

	return tlds.has(formatted);
}
