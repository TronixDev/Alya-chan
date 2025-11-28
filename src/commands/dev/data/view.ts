import {
	type CommandContext,
	createStringOption,
	Declare,
	Options,
	SubCommand,
} from "seyfert";
import { MessageFlags } from "seyfert/lib/types";
import { AlyaCategory } from "#alya/types";
import { AlyaOptions } from "#alya/utils";

const options = {
	type: createStringOption({
		description: "Type of data to view",
		required: true,
		choices: [
			{ name: "Votes", value: "votes" },
			{ name: "Playlists", value: "playlists" },
			{ name: "Premium", value: "premium" },
			{ name: "Stats", value: "stats" },
			{ name: "All", value: "all" },
		],
	}),
	user_id: createStringOption({
		description: "User ID or mention",
		required: true,
	}),
};

@Declare({
	name: "view",
	description: "View database statistics",
})
@Options(options)
@AlyaOptions({
	cooldown: 5,
	category: AlyaCategory.Developers,
	onlyDeveloper: true,
})
export default class ViewDatabaseCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>) {
		const { client } = ctx;
		const type = ctx.options.type;
		// Clean up user ID from mention format if present
		const userId = ctx.options.user_id.replace(/[<@!>]/g, "");
		const startTime = Date.now();
		const stats: string[] = [];

		try {
			switch (type) {
				case "votes": {
					const voteStats = await client.database.getVoteStats(userId);
					if (userId) {
						stats.push(`Active Votes: ${voteStats.total}`);
						stats.push(`Active Premium from Votes: ${voteStats.active}`);
					} else {
						stats.push(`Total Votes: ${voteStats.total}`);
						stats.push(`Active Premium Users: ${voteStats.active}`);
					}
					break;
				}

				case "premium": {
					const premiumStats = await client.database.getPremiumStats(userId);
					if (userId) {
						if (premiumStats.active) {
							stats.push("Premium Status: Active");
							stats.push(
								`Expires At: ${premiumStats.expiresAt?.toLocaleString()}`,
							);
						} else {
							stats.push("Premium Status: Inactive");
						}
					} else {
						stats.push(
							`Active Premium Users: ${premiumStats.totalActiveUsers}`,
						);
						stats.push(`- Regular Premium: ${premiumStats.activeRegularUsers}`);
						stats.push(`- Vote Premium: ${premiumStats.activeVoteUsers}`);
					}
					break;
				}

				case "all": {
					if (userId) {
						const [voteStats] = await Promise.all([
							client.database.getVoteStats(userId),
						]);
						stats.push(`Total Votes: ${voteStats.total}`);
					} else {
						const [voteStats] = await Promise.all([
							client.database.getVoteStats(),
						]);
						stats.push(`Total Votes: ${voteStats.total}`);
					}
					break;
				}
			}

			const timeTaken = Date.now() - startTime;
			await ctx.editOrReply({
				embeds: [
					{
						title: "📊 Database Statistics",
						description: stats.join("\n"),
						footer: { text: `Query completed in ${timeTaken}ms` },
						color: client.config.color.primary,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		} catch (error) {
			client.logger.error("Database view error:", error);
			await ctx.editOrReply({
				embeds: [
					{
						description:
							"❌ An error occurred while fetching database statistics",
						color: client.config.color.no,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
