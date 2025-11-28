// src/lavalink/events.ts

import { LavalinkEventTypes } from "#alya/types";
import {
	createLavalinkEvent,
	createNowPlayingEmbed,
	PlayerSaver,
} from "#alya/utils";

export default createLavalinkEvent({
	name: "trackStart",
	type: LavalinkEventTypes.Manager,
	async run(client, player, track) {
		if (!(player.textChannelId && player.voiceChannelId)) return;
		if (!track) return;
		try {
			player.set("me", {
				...client.me,
				tag: client.me.username,
			});

			const playerSaver = new PlayerSaver(client.logger);

			// Store locale string for lyrics
			const localeString = await client.database.getLocale(player.guildId);
			player.set("localeString", localeString);

			const lyricsData = await playerSaver.getLyricsData(player.guildId);
			if (lyricsData) {
				if (lyricsData.lyricsEnabled) {
					player.set("lyricsEnabled", lyricsData.lyricsEnabled);
				}
				if (lyricsData.lyricsId) {
					player.set("lyricsId", lyricsData.lyricsId);
				}
				if (lyricsData.lyrics) {
					player.set("lyrics", lyricsData.lyrics);
				}
			}

			// Clear disconnect timeout jika ada
			const disconnectTimeout = player.get<NodeJS.Timeout | undefined>(
				"disconnectTimeout",
			);
			if (disconnectTimeout) {
				clearTimeout(disconnectTimeout);
				player.set("disconnectTimeout", undefined);
			}

			const voice = await client.channels.fetch(player.voiceChannelId);
			if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

			// Buat embed now playing
			const nowPlaying = await createNowPlayingEmbed(client, player, track);

			const sentMessage = await client.messages.write(
				player.textChannelId,
				nowPlaying,
			);
			player.set("messageId", sentMessage.id);

			// Simpan messageId dan channelId ke database
			await playerSaver.setLastNowPlayingMessage(
				player.guildId,
				sentMessage.id,
				player.textChannelId,
			);

			// Save player state using PlayerSaver
			const playerData = player.toJSON();
			const safeData = playerSaver.extractSafePlayerData(
				playerData as unknown as Record<string, unknown>,
			);
			safeData.messageId = sentMessage.id;
			await playerSaver.savePlayer(player.guildId, safeData);
			client.logger.info(`[Music] Saved player for guild ${player.guildId}`);
		} catch (err) {
			client.logger.error(
				"[Music] Failed to send trackStart message or save player state:",
				err,
			);
		}
	},
});
