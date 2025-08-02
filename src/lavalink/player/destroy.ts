import { PlayerSaver } from "#alya/utils";
import { LavalinkEventTypes } from "#alya/types";
import { createLavalinkEvent } from "#alya/utils";
import type { Player } from "lavalink-client";

export default createLavalinkEvent({
	name: "playerDestroy",
	type: LavalinkEventTypes.Manager,
	async run(client, player: Player) {
		const playerSaver = new PlayerSaver(client.logger);
		const messageId = player.get("messageId");
		let channelId = "";
		const rawChannel = player.textChannelId;
		if (
			typeof rawChannel === "object" &&
			rawChannel !== null &&
			Object.hasOwn(rawChannel, "id") &&
			typeof (rawChannel as { id: unknown }).id === "string"
		) {
			channelId = (rawChannel as { id: string }).id;
		} else if (typeof rawChannel === "string") {
			channelId = rawChannel;
		}

		await client.messages.delete(messageId as string, channelId);
		player.set("messageId", undefined);
		await playerSaver.clearLastNowPlayingMessage(player.guildId);

		try {
			await playerSaver.delPlayer(player.guildId);
			client.logger.info(`[Music] Deleted player for guild ${player.guildId}`);
		} catch (err) {
			client.logger.error(
				`[Music] Failed to delete player for guild ${player.guildId}:`,
				err,
			);
		}

		const lyricsId = player.get<string | undefined>("lyricsId");
		const lyricsEnabled = player.get<boolean | undefined>("lyricsEnabled");

		if (lyricsEnabled) {
			try {
				await player.unsubscribeLyrics();
				client.logger.info(
					`[Music] Unsubscribed from lyrics for guild ${player.guildId}`,
				);
			} catch (error) {
				client.logger.error(
					`[Music] Failed to unsubscribe from lyrics for guild ${player.guildId}:`,
					error,
				);
			}
		}

		if (lyricsId && player.textChannelId) {
			try {
				await client.messages.delete(lyricsId, player.textChannelId);
				client.logger.info(
					`[Music] Deleted lyrics message for guild ${player.guildId}`,
				);
			} catch (error) {
				client.logger.error(
					`[Music] Failed to delete lyrics message for guild ${player.guildId}:`,
					error,
				);
			}
		}

		player.set("lyricsEnabled", false);
		player.set("lyrics", undefined);
		player.set("lyricsId", undefined);
		player.set("lyricsRequester", undefined);

		await playerSaver.clearLyricsData(player.guildId);
	},
});
