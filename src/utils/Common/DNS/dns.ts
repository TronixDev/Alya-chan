import { Buffer } from "node:buffer";
import {
	CHECKING_DISABLED,
	decode,
	encode,
	RECURSION_DESIRED,
	type RecordType,
} from "dns-packet";
import ky from "ky";
import type { DNSProvider } from "#alya/types";
import { extractDomainFromInput, presentTable, VALID_TYPES } from "#alya/utils";

interface DNSAnswer {
	name: string;
	type: number;
	ttl: number;
	data: string;
}

interface DNSLookupResult {
	name: string;
	flags: { cd: boolean };
	message?: string;
	answer: DNSAnswer[];
}

const DNS_RCODES: Record<number, string> = {
	0: "No error",
	1: "A format error [1 - FormErr] occurred when looking up the domain",
	2: "An unexpected server failure [2 - ServFail] occurred when looking up the domain",
	3: "A non-existent domain [3 - NXDomain] was requested and could be found",
	4: "A request was made that is not implemented [4 - NotImp] by the resolver",
	5: "The query was refused [5 - Refused] by the DNS resolver",
};

const DNSSEC_DISABLED_WARNING =
	":warning: cd bit set, DNSSEC validation disabled";

// Account for the ```\n...\n``` code block wrapper (8 chars)
const MAX_BODY_LENGTH = 4096 - 8;

export function normalizeDomain(input: string): string | null {
	const domain = extractDomainFromInput(input);
	if (!domain) return null;
	return domain.toLowerCase();
}

/**
 * Builds the text body for a DNS embed description, handling truncation and
 * the DNSSEC cd-bit warning. Wrap the result in a code block before embedding.
 */
export function buildDnsEmbedBody(
	lookup: DNSLookupResult,
	header: string,
	short: boolean,
): string {
	const headerLen = header ? header.length + 2 : 0; // account for "\n\n" after header

	if (lookup.message) return lookup.message;

	if (!lookup.answer?.length) {
		const base = "No records found";
		return lookup.flags.cd ? `${base}\n\n${DNSSEC_DISABLED_WARNING}` : base;
	}

	const cdSuffix = lookup.flags.cd ? `\n${DNSSEC_DISABLED_WARNING}` : "";
	const maxBodyLen = MAX_BODY_LENGTH - cdSuffix.length - headerLen;
	const truncLabel = (n: number) =>
		n ? `\n...(${n.toLocaleString()} row${n === 1 ? "" : "s"} truncated)` : "";

	if (short) {
		const rows = lookup.answer.map((r) => r.data);
		const included: string[] = [];
		for (const row of rows) {
			const next = [...included, row];
			const trunc = truncLabel(rows.length - next.length);
			if (`${next.join("\n")}${trunc}`.length > maxBodyLen) break;
			included.push(row);
		}
		const trunc = truncLabel(rows.length - included.length);
		return `${included.join("\n")}${trunc}${cdSuffix}`;
	}

	const rows = lookup.answer;
	let included: DNSAnswer[] = [];
	for (const row of rows) {
		const next = [...included, row];
		const trunc = truncLabel(rows.length - next.length);
		const table = presentTable([
			["NAME", "TTL", "DATA"],
			...next.map((r) => [r.name, `${r.ttl}s`, r.data]),
		]);
		if (`${table}${trunc}`.length > maxBodyLen) break;
		included = next;
	}
	const trunc = truncLabel(rows.length - included.length);
	const table = presentTable([
		["NAME", "TTL", "DATA"],
		...included.map((r) => [r.name, `${r.ttl}s`, r.data]),
	]);
	return `${table}${trunc}${cdSuffix}`;
}

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toRcodeLocal(code: unknown): number {
	if (typeof code === "number") return code;
	const s = String(code).toUpperCase();
	switch (s) {
		case "NOERROR":
			return 0;
		case "FORMERR":
			return 1;
		case "SERVFAIL":
			return 2;
		case "NXDOMAIN":
			return 3;
		case "NOTIMP":
			return 4;
		case "REFUSED":
			return 5;
		case "YXDOMAIN":
			return 6;
		case "YXRRSET":
			return 7;
		case "NXRRSET":
			return 8;
		case "NOTAUTH":
			return 9;
		case "NOTZONE":
			return 10;
		default: {
			const n = Number(s);
			return Number.isFinite(n) ? n : 0;
		}
	}
}

function processData(recordType: string, data: unknown): string {
	if (Array.isArray(data))
		return data.map((item) => processData(recordType, item)).join(" ");
	if (Buffer.isBuffer(data)) return data.toString();

	if (typeof data === "object" && data !== null) {
		const obj = data as Record<string, unknown>;
		if (recordType === "SRV" && "port" in obj && "target" in obj)
			return `${String(obj.priority)} ${String(obj.weight)} ${String(obj.port)} ${String(obj.target)}`;
		if (recordType === "HINFO" && "cpu" in obj && "os" in obj)
			return `${String(obj.cpu)} ${String(obj.os)}`;
		if (recordType === "SOA" && "mname" in obj && "rname" in obj)
			return `${String(obj.mname)} ${String(obj.rname)} ${String(obj.serial)} ${String(obj.refresh)} ${String(obj.retry)} ${String(obj.expire)} ${String(obj.minimum)}`;
		if (
			recordType === "CAA" &&
			"flags" in obj &&
			"tag" in obj &&
			"value" in obj
		)
			return `${String(obj.flags || 0)} ${String(obj.tag)} "${String(obj.value)}"`;
		if (recordType === "MX" && "exchange" in obj && "preference" in obj)
			return `${String(obj.preference)} ${String(obj.exchange)}`;
	}

	if (typeof data !== "string") return String(data);

	// Handle hex rdata like "\# <len> <hex...>"
	if (data.startsWith("\\#")) {
		const words = data.split(" ");
		const length = words.length > 1 ? Number(words[1]) : 0;
		words.splice(0, 2);
		words.splice(length);

		if (recordType === "CAA" && words.length > 1) {
			const flags = Number(words[0]);
			const tagLength = Number(words[1]);
			words.splice(0, 2);
			const tag = words
				.splice(0, tagLength)
				.map((part) => String.fromCharCode(parseInt(part, 16)))
				.join("")
				.trim()
				.replace(/[^a-z0-9]/gi, "");
			const value = words
				.map((part) => String.fromCharCode(parseInt(part, 16)))
				.join("")
				.trim();
			return `${flags} ${tag} "${value}"`;
		}

		return words
			.map((part) => String.fromCharCode(parseInt(part, 16)))
			.join("")
			.trim();
	}

	return data;
}

export async function performLookup(
	domain: string,
	type: string,
	provider: DNSProvider,
	cdflag: boolean,
): Promise<DNSLookupResult> {
	const recordType = VALID_TYPES.includes(type.toUpperCase())
		? type.toUpperCase()
		: "A";

	if (provider.doh.type === "dns") {
		const packet = encode({
			type: "query",
			id: randInt(1, 65534),
			flags: RECURSION_DESIRED | (cdflag ? CHECKING_DISABLED : 0),
			questions: [{ name: domain, type: recordType as unknown as RecordType }],
		});

		const url = new URL(provider.doh.endpoint);
		url.searchParams.set("dns", packet.toString("base64").replace(/=+$/, ""));

		const res = await ky.get(url.toString(), {
			headers: { Accept: "application/dns-message" },
			throwHttpErrors: false,
		});

		if (!res.ok) {
			return {
				name: domain,
				flags: { cd: cdflag },
				message: `DNS provider request failed (${res.status})`,
				answer: [],
			};
		}

		const buffer = Buffer.from(await res.arrayBuffer());
		const decoded = decode(buffer) as unknown as {
			rcode?: unknown;
			flags?: number;
			questions?: Array<{ name: string; type: number }>;
			answers?: Array<{
				name: string;
				type: number;
				ttl?: number;
				TTL?: number;
				data: unknown;
			}>;
			flag_cd?: boolean;
		};

		const rawRcode =
			decoded.rcode ??
			(typeof decoded.flags === "number" ? decoded.flags & 0x0f : 0);
		const status = toRcodeLocal(rawRcode);
		const question = decoded.questions?.[0];
		const rawAnswer = decoded.answers ?? [];

		if (status !== 0) {
			return {
				name: question?.name ?? domain,
				flags: { cd: !!decoded.flag_cd },
				message: DNS_RCODES[status] ?? `DNS error code ${status}`,
				answer: [],
			};
		}

		return {
			name: question?.name ?? domain,
			flags: { cd: !!decoded.flag_cd },
			answer: rawAnswer.map((item) => ({
				name: item.name,
				type: item.type,
				ttl: item.TTL ?? item.ttl ?? 0,
				data: processData(type.toUpperCase(), item.data),
			})),
		};
	}

	// JSON DoH endpoint
	const url = new URL(provider.doh.endpoint);
	url.searchParams.set("name", domain);
	url.searchParams.set("type", recordType);
	url.searchParams.set("cd", cdflag ? "1" : "0");

	const res = await ky.get(url.toString(), {
		headers: { Accept: "application/dns-json" },
		throwHttpErrors: false,
	});

	if (!res.ok) {
		return {
			name: domain,
			flags: { cd: cdflag },
			message: `DNS provider request failed (${res.status})`,
			answer: [],
		};
	}

	const json = (await res.json()) as {
		Status?: number;
		Question?: Array<{ name: string; type: number }>;
		Answer?: Array<{
			name: string;
			ttl?: number;
			TTL?: number;
			type?: number;
			data: string;
		}>;
		CD?: boolean;
	};

	const status = json.Status ?? 0;
	const question = json.Question?.[0];
	const answer = (json.Answer ?? []).map((item) => ({
		name: item.name,
		type: item.type ?? 0,
		ttl: item.TTL ?? item.ttl ?? 0,
		data: item.data,
	}));

	if (status !== 0) {
		return {
			name: question?.name ?? domain,
			flags: { cd: !!json.CD },
			message: DNS_RCODES[status] ?? `DNS error code ${status}`,
			answer: [],
		};
	}

	return {
		name: question?.name ?? domain,
		flags: { cd: !!json.CD },
		answer,
	};
}
