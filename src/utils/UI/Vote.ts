import type { KyResponse } from "ky";
import ky from "ky";
import { Embed, type User, type UsingClient } from "seyfert";

/**
 * Sends a vote notification through Discord webhook
 * @param client - The Alya client instance
 * @param voter - The user who voted
 * @returns Webhook HTTP response from ky.
 */
export async function sendVoteWebhook(
	client: UsingClient,
	voter: User,
): Promise<KyResponse> {
	client.logger.info(
		`[Vote] Processed vote from ${voter.username} (${voter.id})`,
	);
	// Add premium access for 12 hours
	await client.database.addUserVote(voter.id);

	const avatarUrl = voter.avatar
		? `https://cdn.discordapp.com/avatars/${voter.id}/${voter.avatar}.webp`
		: `https://cdn.discordapp.com/embed/avatars/${Number(voter.discriminator) % 5}.png`;

	const voteEmbed = new Embed()
		.setColor(client.config.color.primary)
		.setAuthor({
			name: `${voter.name}`,
			iconUrl: avatarUrl,
		})
		.setThumbnail(avatarUrl)
		.setDescription(
			[
				`${client.config.emoji.user} **${voter.username}** \`(${voter.id})\` just rocked the vote for Alya on [Top.gg](${client.config.info.voteLink})!\n`,
				"You're awesome for choosing us! May your day be filled with fantastic tunes and good vibes. Let's keep the music playing!",
			].join("\n"),
		)
		.setFooter({ text: "Thanks for choosing Alya!" })
		.setTimestamp();

	return ky.post(client.config.webhooks.voteLog, {
		headers: {
			"Content-Type": "application/json",
		},
		json: {
			username: client.me.name,
			avatar_url: client.me.avatar,
			content: `<@${voter.id}>`,
			embeds: [voteEmbed.toJSON()],
		},
		throwHttpErrors: false,
	});
}
