import { LimitedCollection } from "seyfert";
import { Configuration } from "#alya/config";
import type { guild } from "#alya/db";
import { AlyaKeys } from "#alya/types";

interface Cache {
	[AlyaKeys.Locale]: typeof guild.$inferSelect;
	[AlyaKeys.Player]: typeof guild.$inferSelect;
	[AlyaKeys.Prefix]: typeof guild.$inferSelect;
}

/**
 * Main Alya cache class.
 */
export class AlyaCache {
	/**
	 * The internal cache.
	 * @readonly
	 */
	readonly internal: LimitedCollection<
		string,
		LimitedCollection<AlyaKeys, unknown>
	> = new LimitedCollection({
		limit: Configuration.cache.size,
	});

	/**
	 * Get the data from the cache.
	 * @param guildId The guild id.
	 * @param key The key.
	 * @returns
	 */
	public get<T extends keyof Cache>(
		guildId: string,
		key: T,
	): Cache[T] | undefined {
		return this.internal.get(guildId)?.get(key) as Cache[T] | undefined;
	}

	/**
	 * Delete the data in the cache.
	 * @param guildId The guild id.
	 * @returns
	 */
	public delete(guildId: string): boolean {
		return this.internal.delete(guildId);
	}

	/**
	 * Delete the data in the cache.
	 * @param guildId The guild id.
	 * @param key The key.
	 * @returns
	 */
	public deleteKey<T extends keyof Cache>(guildId: string, key: T): boolean {
		return this.internal.get(guildId)?.delete(key) ?? false;
	}

	/**
	 * Set the data to the cache.
	 * @param guildId The guild id.
	 * @param key The key.
	 * @param data The data.
	 * @returns
	 */
	public set<T extends keyof Cache>(
		guildId: string,
		key: T,
		data: Cache[T],
	): void {
		if (this.internal.has(guildId) && !this.internal.get(guildId)?.has(key)) {
			this.internal.get(guildId)?.set(key, data);
			return;
		}

		const collection = new LimitedCollection<AlyaKeys, unknown>();
		collection.set(key, data);
		this.internal.set(guildId, collection);
	}
}
