import type { AlyaCategory } from "#alya/types";
export type NonCommandOptions = Omit<Options, "category">;

export interface Options {
	/**
	 *
	 * The cooldown.
	 * @default 3
	 */
	cooldown?: number;
	/**
	 *
	 * Only the bot developer can use the command.
	 * And sent the command to developer(s) guild(s).
	 * @default false
	 */
	onlyDeveloper?: boolean;
	/**
	 *
	 * Only the guild owner cam use the command.
	 * @default false
	 */
	onlyGuildOwner?: boolean;
	/**
	 *
	 * The command category.
	 * @default AlyaCategory.Unknown
	 */
	category?: AlyaCategory;
	/**
	 *
	 * The command premium.
	 * @default false
	 */
	premium?: boolean;
}
