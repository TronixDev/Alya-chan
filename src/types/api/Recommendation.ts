/** Normalized track row from Last.fm geo charts (see `getTopTracksByCountry`). */
export interface RecommendationTrack {
	name: string;
	artist: string;
	listeners: number;
}
