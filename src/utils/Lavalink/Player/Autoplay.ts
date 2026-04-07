import ky from "ky";
import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import type { ClientUser } from "seyfert";
import { Environment } from "#alya/config";

const MAX_SAME_ARTIST_IN_ROW = 3;

const LASTFM_API_KEYS = (Environment.LastFM || "")
	.split(",")
	.map((k) => k.trim())
	.filter(Boolean);
let lastfmKeyIndex = 0;
function getNextLastFmKey() {
	if (LASTFM_API_KEYS.length === 0) return undefined;
	const key = LASTFM_API_KEYS[lastfmKeyIndex];
	lastfmKeyIndex = (lastfmKeyIndex + 1) % LASTFM_API_KEYS.length;
	return key;
}

type ResolvableTrack = Track | UnresolvedTrack;

interface LastFmTrack {
	name: string;
	artist: {
		name: string;
	};
}

interface LastFmSimilarResponse {
	similartracks: {
		track: LastFmTrack[];
	};
	error?: string;
}

/**
 * Filter tracks that have already been played
 * @param player The player instance
 * @param lastTrack The last played track
 * @param tracks Array of tracks to filter
 * @returns Filtered array of tracks
 */
const filterTracks = (
	player: Player,
	lastTrack: Track,
	tracks: ResolvableTrack[],
) =>
	tracks.filter(
		(track) =>
			!(
				player.queue.previous.some(
					(t) => t.info.identifier === track.info.identifier,
				) || lastTrack.info.identifier === track.info.identifier
			),
	) as Track[];

/**
 * Check if artist would exceed consecutive play limit
 * @param player The player instance
 * @param artistName The artist name to check
 * @returns boolean
 */
const wouldExceedArtistLimit = (
	player: Player,
	artistName: string | undefined,
): boolean => {
	if (!artistName) return false;

	const recentTracks = player.queue.previous.slice(
		0,
		MAX_SAME_ARTIST_IN_ROW - 1,
	);
	const consecutiveArtists = recentTracks
		.map((track) => track.info.author)
		.filter((author): author is string => typeof author === "string")
		.map((author) => author.toLowerCase());

	return (
		consecutiveArtists.length === MAX_SAME_ARTIST_IN_ROW - 1 &&
		consecutiveArtists.every((artist) => artist === artistName.toLowerCase())
	);
};

/**
 * Main autoplay function that handles track recommendations
 * @param player The player instance
 * @param lastTrack The last track that was played
 * @returns Promise<void>
 */
export async function autoPlayFunction(
	player: Player,
	lastTrack?: Track,
): Promise<void> {
	if (!lastTrack) return;
	if (!player.get("enabledAutoplay")) return;

	if (
		!player.queue.previous.some(
			(t) => t.info.identifier === lastTrack.info.identifier,
		)
	) {
		player.queue.previous.unshift(lastTrack);
		await player.queue.utils.save();
	}

	const me = player.get<ClientUser | undefined>("me");
	if (!me) return;

	if (LASTFM_API_KEYS.length > 0) {
		await handleLastFmRecommendations(player, lastTrack, me);
	} else {
		await handleSpotifyRecommendations(player, lastTrack, me);
	}
}

/**
 * Handle Spotify-based recommendations
 * @param player The player instance
 * @param lastTrack The last played track
 * @param me The client user
 * @returns Promise<void>
 */
async function handleSpotifyRecommendations(
	player: Player,
	lastTrack: Track,
	me: ClientUser,
): Promise<void> {
	const { author, title } = lastTrack.info;
	const searchQuery = `${author} ${title}`;

	const res = await player.search({ query: searchQuery }, { requester: me });

	if (res.tracks.length >= 4) {
		const eligibleTracks = res.tracks.filter(
			(track) => !wouldExceedArtistLimit(player, track.info.author),
		);
		if (eligibleTracks.length === 0) return;

		const selectedIndex = Math.min(
			Math.random() < 0.5 ? 1 : 3,
			eligibleTracks.length - 1,
		);
		const track = eligibleTracks[selectedIndex];
		if (track) {
			track.requester = { id: me.id, username: me.username };
			await player.queue.add(track);
		}
	}
}

/**
 * Handle Last.fm-based recommendations
 * @param player The player instance
 * @param lastTrack The last played track
 * @param me The client user
 * @returns Promise<void>
 */
async function handleLastFmRecommendations(
	player: Player,
	lastTrack: Track,
	me: ClientUser,
): Promise<void> {
	try {
		const { author, title } = lastTrack.info;
		if (!(author && title)) return;

		const apiKey = getNextLastFmKey();
		if (!apiKey) {
			me.client.logger.warn(
				"[AUTO_PLAY] No Last.fm API key available, falling back to Spotify recommendations.",
			);
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}
		const url = `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar&artist=${encodeURIComponent(author)}&track=${encodeURIComponent(title)}&limit=10&autocorrect=1&api_key=${apiKey}&format=json`;
		const data = await ky.get(url).json<LastFmSimilarResponse>();

		if (!data?.similartracks?.track || data.similartracks.track.length === 0) {
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}

		const tracks = data.similartracks.track;

		const eligibleTracks = tracks.filter(
			(track) => !wouldExceedArtistLimit(player, track.artist.name),
		);

		if (eligibleTracks.length === 0) {
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}

		const similarTrack =
			eligibleTracks[Math.floor(Math.random() * eligibleTracks.length)];

		if (!(similarTrack?.artist?.name && similarTrack?.name)) {
			await handleSpotifyRecommendations(player, lastTrack, me);
			return;
		}

		const searchQuery = `${similarTrack.artist.name} - ${similarTrack.name}`;
		const searchResult = await player.search(
			{ query: searchQuery },
			{ requester: me },
		);

		if (searchResult.tracks.length) {
			const filteredTracks = filterTracks(
				player,
				lastTrack,
				searchResult.tracks,
			);
			const firstTrack = filteredTracks[0];
			if (firstTrack) {
				firstTrack.requester = { id: me.id, username: me.username };
				await player.queue.add(firstTrack);
			}
		}
	} catch (error) {
		if (me?.client?.logger?.error) {
			me.client.logger.error("Error in Last.fm recommendations:", error);
		} else {
			console.error("[AUTO_PLAY] Error in Last.fm recommendations:", error);
		}

		await handleSpotifyRecommendations(player, lastTrack, me);
	}
}
