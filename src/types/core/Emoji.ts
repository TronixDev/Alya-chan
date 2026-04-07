import type { emoji } from "#alya/config";

export type EmojiConfig = typeof emoji;
export type Emoji = keyof EmojiConfig;
