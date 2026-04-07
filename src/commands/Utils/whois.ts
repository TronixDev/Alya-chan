import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	LocalesT,
	Options,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import {
	AlyaOptions,
	normalizeWhoisQuery,
	performWhoisLookup,
	presentTable,
} from "#alya/utils";

const option = {
	query: createStringOption({
		description: "The domain name, IP address or ASN to lookup",
		required: true,
		locales: {
			name: "cmd.whois.options.query.name",
			description: "cmd.whois.options.query.description",
		},
	}),
};

@Declare({
	name: "whois",
	description: "Perform a WHOIS lookup for a domain, IP or ASN",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.whois.name", "cmd.whois.description")
@Options(option)
@AlyaOptions({ category: AlyaCategory.Utils, cooldown: 5 })
export default class WhoisCommand extends Command {
	public async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;

		const { cmd } = await ctx.getLocale();

		const rawQuery = String(options.query || "").trim();
		const query = normalizeWhoisQuery(rawQuery);

		if (!query) {
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: client.config.color.no,
						description: cmd.whois.run.invalid_query,
					},
				],
			});
			return;
		}

		// WHOIS lookup can take some time (multiple network calls). Defer first
		// to avoid Discord interaction token expiration (SeyfertError 10062).
		await ctx.deferReply();

		let data: Awaited<ReturnType<typeof performWhoisLookup>> | null = null;
		try {
			const timeoutMs = 10_000;
			data = await Promise.race([
				performWhoisLookup(query),
				new Promise<null>((resolve) =>
					setTimeout(() => resolve(null), timeoutMs),
				),
			]);
		} catch {
			data = null;
		}

		if (!data) {
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: client.config.color.no,
						description: cmd.whois.run.no_data,
					},
				],
			});
			return;
		}

		const preferredOrder = [
			"registrar",
			"registrant",
			"registration",
			"expiration",
			"abuse",
			"cidr",
			"asn",
			"handle",
			"name",
		] as const;

		const preferredIndex = new Map<string, number>(
			preferredOrder.map((k, i) => [k, i]),
		);

		const excludedKeys = new Set(["status", "nameservers", "raw"]);

		const entries = Object.entries(data)
			.filter(([key, value]) => {
				if (value === undefined || value === null) return false;
				return !excludedKeys.has(key.toLowerCase());
			})
			.map(([key, value]) => {
				const label =
					key.toLowerCase() === "asn" || key.toLowerCase() === "cidr"
						? key.toUpperCase()
						: (key[0]?.toUpperCase() ?? "") + key.slice(1).toLowerCase();
				return {
					keyLower: key.toLowerCase(),
					label,
					value: value instanceof Date ? value.toUTCString() : String(value),
				};
			});

		const preferred = entries
			.filter((e) => preferredIndex.has(e.keyLower))
			.sort(
				(a, b) =>
					(preferredIndex.get(a.keyLower) ?? 0) -
					(preferredIndex.get(b.keyLower) ?? 0),
			);
		const rest = entries
			.filter((e) => !preferredIndex.has(e.keyLower))
			.sort((a, b) => a.keyLower.localeCompare(b.keyLower));

		const fields = [...preferred, ...rest].map((e) => [e.label, e.value]);

		const table = presentTable([["", ""], ...fields])
			.split("\n")
			.slice(1)
			.join("\n");
		const title = query.replace(/^([0-9]+)$/, "AS$1");

		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.primary,
					title: cmd.whois.run.title,
					description: `\`\`\`\n${title}\n${table}\n\`\`\``,
					footer: { text: cmd.requested_by({ user: ctx.author.tag }) },
					timestamp: new Date().toISOString(),
				},
			],
		});
	}
}
