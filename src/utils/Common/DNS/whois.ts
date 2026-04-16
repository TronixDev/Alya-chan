import ky from "ky";

interface WhoisResult {
	[key: string]: string | Date | number | undefined;
}

type WhoisFields = {
	name?: string;
	registrant?: string;
	asn?: string;
	registrar?: string;
	registration?: Date;
	expiration?: Date;
	cidr?: string;
	abuse?: string;
};

export function normalizeWhoisQuery(input: string): string {
	return input
		.trim()
		.replace(/^as([0-9]+)$/i, "$1")
		.replace(/^[a-z][a-z0-9+.-]+:\/\/(.+)$/i, "$1")
		.replace(/^([0-9]{1,3}(?:\.[0-9]{1,3}){3}):[0-9]+$/, "$1");
}

function trimmed(item: unknown): string | undefined {
	if (item === undefined || item === null) return undefined;
	const s = `${item}`.trim();
	return s || undefined;
}

function uniqueCommaSep(arr: unknown[]): string | undefined {
	const set = new Set<string>();
	for (const item of arr) {
		const s = trimmed(item);
		if (s) set.add(s);
	}
	const joined = [...set].join(", ");
	return joined || undefined;
}

function consistentResultObj(data: Partial<WhoisFields>): WhoisFields {
	return {
		name: trimmed(data.name),
		registrant: trimmed(data.registrant),
		asn: trimmed(data.asn),
		registrar: trimmed(data.registrar),
		registration: data.registration,
		expiration: data.expiration,
		cidr: trimmed(data.cidr),
		abuse: trimmed(data.abuse),
	};
}

function consistentResult(data: WhoisFields): WhoisFields | null {
	return Object.values(data).every((x) => x === undefined) ? null : data;
}

function combineResults(
	rdap: WhoisFields | null,
	whois: WhoisFields | null,
	cfwho: WhoisFields | null,
): WhoisResult | null {
	const result: Partial<WhoisFields> = {};
	for (const src of [rdap, whois, cfwho]) {
		if (!src) continue;
		for (const [key, value] of Object.entries(src)) {
			if (
				value !== undefined &&
				result[key as keyof WhoisFields] === undefined
			) {
				result[key as keyof WhoisFields] = value as never;
			}
		}
	}
	return consistentResult(consistentResultObj(result)) as WhoisResult | null;
}

async function rdapLookup(q: string): Promise<WhoisFields | null> {
	try {
		const resp = await ky.get(
			`https://rdap.cloud/api/v1/${encodeURIComponent(q)}`,
			{ throwHttpErrors: false },
		);
		if (!resp.ok) return null;

		const rawData: unknown = await resp.json().catch(() => null);
		const container = (rawData as { results?: Record<string, unknown> } | null)
			?.results?.[q];
		if (!container || typeof container !== "object") return null;

		const success = (container as { success?: unknown }).success;
		const data = (container as { data?: unknown }).data;
		if (success !== true || !data || typeof data !== "object") return null;

		const rd = data as Record<string, unknown>;

		const getEntities = (): unknown[] =>
			Array.isArray(rd.entities) ? (rd.entities as unknown[]) : [];

		const filterByRole = (pool: unknown[], role: string): unknown[] =>
			pool.filter((e) => {
				const roles = (e as Record<string, unknown>)?.roles;
				return (Array.isArray(roles) ? roles : [])
					.map((r) => String(r).trim().toLowerCase())
					.includes(role);
			});

		const entityVcard = (
			entity: unknown,
			field: string,
		): string | undefined => {
			const vcardArray = (entity as Record<string, unknown> | undefined)
				?.vcardArray;
			if (!Array.isArray(vcardArray) || vcardArray.length <= 1)
				return undefined;
			const cards = vcardArray[1];
			if (!Array.isArray(cards)) return undefined;
			const card = cards.find((c) => Array.isArray(c) && c[0] === field);
			if (!Array.isArray(card) || card.length <= 3) return undefined;
			return trimmed(card[3]);
		};

		const findEntityNames = (
			role: string,
			pool = getEntities(),
		): string | undefined => {
			const ents = filterByRole(pool, role);
			if (!ents.length) return undefined;
			const parts = ents
				.map(
					(e) =>
						entityVcard(e, "fn") ??
						trimmed((e as Record<string, unknown>)?.handle),
				)
				.filter((x): x is string => typeof x === "string");
			return uniqueCommaSep(parts);
		};

		const findEntityEmail = (
			role: string,
			pool = getEntities(),
		): string | undefined => {
			const ents = filterByRole(pool, role);
			if (!ents.length) return undefined;
			const parts = ents
				.map((e) => entityVcard(e, "email"))
				.filter((x): x is string => typeof x === "string");
			return uniqueCommaSep(parts);
		};

		const findEventDate = (action: string): Date | undefined => {
			if (!Array.isArray(rd.events)) return undefined;
			for (const ev of rd.events as unknown[]) {
				const evObj = ev as Record<string, unknown>;
				if (typeof evObj?.eventAction !== "string") continue;
				if (evObj.eventAction.trim().toLowerCase() !== action) continue;
				if (typeof evObj.eventDate !== "string") continue;
				const d = new Date(evObj.eventDate);
				if (!Number.isNaN(d.getTime())) return d;
			}
			return undefined;
		};

		const findAsn = (): string | undefined => {
			const arr = rd.arin_originas0_originautnums;
			if (!Array.isArray(arr)) return undefined;
			return uniqueCommaSep(arr.map((x) => trimmed(x) ?? String(x)));
		};

		const findCidr = (): string | undefined => {
			if (!Array.isArray(rd.cidr0_cidrs)) return undefined;
			const out = (rd.cidr0_cidrs as unknown[])
				.map((c) => {
					if (!c || typeof c !== "object") return undefined;
					const obj = c as Record<string, unknown>;
					const prefix =
						typeof obj.v4prefix === "string"
							? obj.v4prefix
							: typeof obj.v6prefix === "string"
								? obj.v6prefix
								: undefined;
					if (!prefix || obj.length == null || obj.length === "")
						return undefined;
					return `${prefix}/${String(obj.length)}`;
				})
				.filter((x): x is string => typeof x === "string");
			return uniqueCommaSep(out);
		};

		const findAbuseEmail = (): string | undefined => {
			const direct = findEntityEmail("abuse");
			if (direct) return direct;
			// Check abuse contacts nested inside registrar entities
			const nested: unknown[] = [];
			for (const ent of filterByRole(getEntities(), "registrar")) {
				const inner = (ent as Record<string, unknown>)?.entities;
				if (Array.isArray(inner)) nested.push(...inner);
			}
			return findEntityEmail("abuse", nested);
		};

		return consistentResult(
			consistentResultObj({
				name: typeof rd.name === "string" ? rd.name : undefined,
				registrant: findEntityNames("registrant"),
				asn: findAsn(),
				registrar: findEntityNames("registrar"),
				registration: findEventDate("registration"),
				expiration: findEventDate("expiration"),
				cidr: findCidr(),
				abuse: findAbuseEmail(),
			}),
		);
	} catch {
		return null;
	}
}

async function whoisLookup(q: string): Promise<WhoisFields | null> {
	try {
		const resp = await ky.get(
			`https://whoisjs.com/api/v1/${encodeURIComponent(q)}`,
			{ throwHttpErrors: false },
		);
		if (!resp.ok) return null;

		const rawData: unknown = await resp.json().catch(() => null);
		if (!rawData || typeof rawData !== "object") return null;
		const success = (rawData as { success?: unknown }).success;
		const raw = (rawData as { raw?: unknown }).raw;
		if (success !== true || typeof raw !== "string" || !raw) return null;

		const normalizeKey = (text: string) =>
			`${text}`.toLowerCase().trim().replace(/[-_]/g, " ");
		const normalizeValue = (text: string) => `${text}`.trim();

		const parseWhois = (
			text: string,
		): Array<{ key: string; value: string }> => {
			const reLinebreak = "\\r\\n";
			const reWhitespace = `[^\\S${reLinebreak}]`;
			const reKeyColon = "([a-zA-Z\\-\\s]+):";
			const reKeyBrackets = "\\[([a-zA-Z\\-\\s登録年月日有効期限]+)\\]";
			const reKey = `(${reKeyColon}|${reKeyBrackets})`;
			const reText = `([^\\s${reLinebreak}][^${reLinebreak}]*)`;
			const reLineStart = `^${reWhitespace}*${reKey}`;
			const reLineEnd = `${reWhitespace}+${reText}$`;

			const reSingleLine = `${reLineStart}${reLineEnd}`;
			const regExpSingleLineGm = new RegExp(reSingleLine, "gm");
			const regExpSingleLine = new RegExp(reSingleLine);
			const reSplitLine = `${reLineStart}[${reLinebreak}]+${reLineEnd}`;
			const regExpSplitLineGm = new RegExp(reSplitLine, "gm");
			const regExpSplitLine = new RegExp(reSplitLine);

			const singleLineMatches = text.match(regExpSingleLineGm) ?? [];
			const splitLineMatches = text.match(regExpSplitLineGm) ?? [];
			const matches: Array<{ key: string; value: string }> = [];

			for (const rawMatch of singleLineMatches) {
				const match = rawMatch.trim().match(regExpSingleLine);
				if (!match) continue;
				const keyRaw = match[2] ?? match[3];
				if (!keyRaw) continue;
				matches.push({
					key: normalizeKey(keyRaw),
					value: normalizeValue(match[4] ?? ""),
				});
			}

			for (const rawMatch of splitLineMatches) {
				if (singleLineMatches.some((single) => rawMatch.includes(single)))
					continue;
				const match = rawMatch.trim().match(regExpSplitLine);
				if (!match) continue;
				const keyRaw = match[2] ?? match[3];
				if (!keyRaw) continue;
				matches.push({
					key: normalizeKey(keyRaw),
					value: normalizeValue(match[4] ?? ""),
				});
			}

			return matches;
		};

		const data = parseWhois(raw);
		if (!data.length) return null;

		const findAttribute = (names: string[]): string | undefined => {
			for (const name of names) {
				const entry = data.find((e) => e.key === name);
				if (entry?.value) return entry.value;
			}
			return undefined;
		};

		const findAttributeDate = (names: string[]): Date | undefined => {
			const value = findAttribute(names);
			if (!value) return undefined;
			const d = new Date(value);
			return Number.isNaN(d.getTime()) ? undefined : d;
		};

		return consistentResult(
			consistentResultObj({
				registrant: findAttribute(["registrant"]),
				registrar: findAttribute(["registrar", "organisation"]),
				registration: findAttributeDate([
					"creation date",
					"created",
					"registered on",
					"登録年月日",
				]),
				expiration: findAttributeDate([
					"registry expiry date",
					"expiry date",
					"有効期限",
				]),
				abuse: findAttribute(["registrar abuse contact email"]),
			}),
		);
	} catch {
		return null;
	}
}

async function cfwhoLookup(q: string): Promise<WhoisFields | null> {
	try {
		const resp = await ky.get(
			`https://cfwho.com/api/v1/${encodeURIComponent(q)}`,
			{ throwHttpErrors: false },
		);
		if (!resp.ok) return null;

		const rawData: unknown = await resp.json().catch(() => null);
		if (!rawData || typeof rawData !== "object") return null;

		const data = (rawData as Record<string, unknown>)[q] as
			| {
					success?: unknown;
					netname?: unknown;
					asn?: unknown;
					network?: unknown;
					contacts?: unknown;
			  }
			| undefined;
		if (!data || data.success !== true) return null;

		const abuseArr =
			data.contacts && typeof data.contacts === "object"
				? (data.contacts as Record<string, unknown>).abuse
				: undefined;
		const abuse = Array.isArray(abuseArr)
			? uniqueCommaSep(abuseArr)
			: undefined;

		return consistentResult(
			consistentResultObj({
				name: typeof data.netname === "string" ? data.netname : undefined,
				asn: typeof data.asn === "string" ? data.asn : undefined,
				cidr: typeof data.network === "string" ? data.network : undefined,
				abuse,
			}),
		);
	} catch {
		return null;
	}
}

export async function performWhoisLookup(
	query: string,
): Promise<WhoisResult | null> {
	const normalized = query.trim();
	if (!normalized) return null;

	// Run all three lookups concurrently for better performance.
	const [rdap, whois, cfwho] = await Promise.all([
		rdapLookup(normalized),
		whoisLookup(normalized),
		cfwhoLookup(normalized),
	]);

	return combineResults(rdap, whois, cfwho);
}
