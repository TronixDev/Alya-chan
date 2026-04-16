import ky from "ky";
import { createEvent, Embed } from "seyfert";

export default createEvent({
	data: { name: "guildDelete" },
	run: async (guild, client) => {
		if (guild.unavailable) return;

		if (!("name" in guild)) return;

		const cachedGuild = client.cache.guilds?.get(guild.id);
		const guildData = cachedGuild || guild;

		const guildIcon = guildData.icon
			? `https://cdn.discordapp.com/icons/${guildData.id}/${guildData.icon}.png`
			: "";

		const owner = await guild.fetchOwner();

		const embed = new Embed()
			.setColor(client.config.color.no)
			.setTitle("Server Left")
			.setDescription(
				"`👋` A guild removed me... I hope I was helpful during my stay!",
			)
			.setThumbnail(guildIcon)
			.addFields(
				{
					name: "`📜` Server Name",
					value: `\`${guildData.name}\``,
					inline: false,
				},
				{ name: "`🏮` Server ID", value: `\`${guildData.id}\``, inline: false },
				{
					name: "`👤` Owner",
					value: owner
						? `\`${owner.displayName ?? owner.username}\` (\`${owner.id}\`)`
						: `\`Unknown\` (\`${guildData.ownerId}\`)`,
					inline: false,
				},
				{
					name: "`👥` Members",
					value: `\`${guildData.memberCount ?? "Unknown"}\``,
					inline: false,
				},
				{
					name: "`📅` Created At",
					value: `<t:${Math.floor(guildData.createdTimestamp / 1000)}:R>`,
					inline: false,
				},
				{
					name: "`🤖` Server Count",
					value: `\`${client.cache.guilds?.count?.()}\``,
					inline: false,
				},
			)
			.setTimestamp();

		await ky
			.post(client.config.webhooks.guildLog, {
				json: {
					username: "Server Logs",
					embeds: [embed.toJSON()],
				},
				throwHttpErrors: false,
			})
			.catch((error) =>
				client.logger.error("Failed to send webhook message:", error),
			);
	},
});
