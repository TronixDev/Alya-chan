import {
	Command,
	type CommandContext,
	createBooleanOption,
	createStringOption,
	Declare,
	LocalesT,
	Options,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import {
	AlyaOptions,
	buildDnsEmbedBody,
	DNS_PROVIDERS,
	normalizeDomain,
	performLookup,
	VALID_TYPES,
} from "#alya/utils";

const option = {
	domain: createStringOption({
		description: "The domain to lookup",
		required: true,
		locales: {
			name: "cmd.dig.options.domain.name",
			description: "cmd.dig.options.domain.description",
		},
	}),
	type: createStringOption({
		description: "DNS record type to lookup",
		required: false,
		locales: {
			name: "cmd.dig.options.type.name",
			description: "cmd.dig.options.type.description",
		},
		choices: VALID_TYPES.slice(0, 25).map((type: string) => ({
			name: `${type} records`,
			value: type,
		})),
	}),
	short: createBooleanOption({
		description: "Display results in short form",
		required: false,
		locales: {
			name: "cmd.dig.options.short.name",
			description: "cmd.dig.options.short.description",
		},
	}),
	cdflag: createBooleanOption({
		description: "Disable DNSSEC checking",
		required: false,
		locales: {
			name: "cmd.dig.options.cdflag.name",
			description: "cmd.dig.options.cdflag.description",
		},
	}),
	provider: createStringOption({
		description: "DNS provider to use",
		required: false,
		locales: {
			name: "cmd.dig.options.provider.name",
			description: "cmd.dig.options.provider.description",
		},
		choices: DNS_PROVIDERS.map((p) => ({ name: p.name, value: p.name })),
	}),
};

@Declare({
	name: "dig",
	description: "Perform a DNS over Discord lookup",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.dig.name", "cmd.dig.description")
@Options(option)
@AlyaOptions({ category: AlyaCategory.Utils, cooldown: 5 })
export default class DigCommand extends Command {
	public async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, options } = ctx;

		const { cmd } = await ctx.getLocale();

		const domainInput = String(options.domain || "").trim();
		const typeInput = String(options.type || "A")
			.trim()
			.toUpperCase();
		const short = options.short ?? false;
		const cdflag = options.cdflag ?? false;
		const providerName = String(options.provider || "").trim();

		const domain = normalizeDomain(domainInput);
		if (!domain) {
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: client.config.color.no,
						description: cmd.dig.run.invalid_domain,
					},
				],
			});
			return;
		}

		const type = VALID_TYPES.includes(typeInput) ? typeInput : "A";
		const provider =
			DNS_PROVIDERS.find((item) => item.name === providerName) ??
			DNS_PROVIDERS[0];
		if (!provider) {
			await ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						color: client.config.color.no,
						description: cmd.dig.run.no_provider,
					},
				],
			});
			return;
		}

		const lookup = await performLookup(domain, type, provider, cdflag);

		const queryParts = [domain, type, `@${provider.dig}`, "+noall", "+answer"];
		if (short) queryParts.push("+short");
		if (cdflag) queryParts.push("+cdflag");
		const header = `\`${queryParts.join(" ")}\``;
		const body = buildDnsEmbedBody(lookup, header, short);

		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.primary,
					title: cmd.dig.run.title({ type }),
					description: `${header}\n\n\`\`\`\n${body}\n\`\`\``,
					footer: { text: cmd.requested_by({ user: ctx.author.tag }) },
					timestamp: new Date().toISOString(),
				},
			],
		});
	}
}
