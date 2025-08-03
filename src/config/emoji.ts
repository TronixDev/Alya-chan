export const emoji = {
	// EMOJIS //
	yes: "<:yes:1401244343129604260>",
	no: "<:no:1401244330601218131>",
	link: "<:link:1273914828020387960>",
	party: "<:party:1273909957988712510>",
	artist: "<:artist:1286590660887056394>",
	clock: "<:clock:1273914816125472789>",
	user: "<:user:1273908906007072780>",
	play: "<:play:1300845442044657797>",
	pause: "<:pause:1300845454719975484>",
	loop: "<:loop:1401400063447662712>",
	shuffle: "<:shuffle:1401400308298420254>",
	previous: "<:previous:1401401511183126569>",
	rewind: "<:rewind:1401398878217175140>",
	forward: "<:forward:1401401717140095126>",
	skip: "<:skip:1401401549690896634>",
	stop: "<:stop:1401401947059392593>",
	trash: "<:trash:1274311828188692511>",
	volUp: "<:volup:1401402730349723700>",
	volDown: "<:voldown:1401402719083954247>",
	list: "<:list:1401402952240861325>",
	info: "<:info:1273909949151449170>",
	music: "<:music:1273908919323983962>",
	warn: "<:warn:1274285534138601474>",
	home: "<:home:1273914783720149023>",
	globe: "<:globe:1273914775281074258>",
	slash: "<:slash:1273914793690005556>",
	ping: "<:ping:1273914804293206127>",
	question: "<:question:1273914765650952212>",
	pencil: "<:pencil:1273997442106261605>",
	think: "<a:think:1383156714404188260>",
	heart: "<:heart:1401403108579344415>",
	folder: "<:folder:1274002519609311367>",

	// NODE EMOJIS //
	nodeOn: "<:g_:1273675155805044736>",
	nodeOff: "<:r_:1273675144589475964>",
} as const;

export type EmojiConfig = typeof emoji;
export type Emoji = keyof EmojiConfig;

/*
 * Alya-chan - The versatile bot with everything you need!
 
 * Credits:
 * - Contributed by: iaMJ
 * - Developed by: Tronix Development
 * - Country: Indonesia

 * Discord:
 * - Tronix Development: https://discord.gg/pTbFUFdppU
  
 * Libraries & Technologies:
 * - Seyfert - Core Discord API framework
 * - lavalink-client - Lavalink client for music streaming
 * - Lavalink - Audio player backend
 * - Bun - Runtime environment

 * Copyright © 2024 Tronix Development
 * All rights reserved. This bot and its source code are under licensed by Tronix Development and copyright law on Indonesia.
 * For permission to use this bot commercially, please contact Tronix Development at https://discord.gg/pTbFUFdppU
 */
