import { Glob } from "bun";

const HEADER_COMMENT = `/*
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

`;

const HEADER_START =
	"/*\n * Alya-chan - The versatile bot with everything you need!";
const TARGET_GLOB = "src/**/*.{ts,tsx}";

async function addHeader() {
	let updatedCount = 0;
	let scannedCount = 0;

	const glob = new Glob(TARGET_GLOB);

	console.log("✅ Scanning TypeScript files under src/ ...");

	for await (const file of glob.scan({ cwd: process.cwd() })) {
		scannedCount++;

		const bunFile = Bun.file(file);
		if (!(await bunFile.exists())) continue;

		const content = await bunFile.text();

		if (content.startsWith(HEADER_START)) continue;

		const next = HEADER_COMMENT + content;
		await Bun.write(file, next);
		console.log(`👍 Added header to: ${file}`);
		updatedCount++;
	}

	console.log(
		`\n🎉 Done. Scanned: ${scannedCount} files. Updated: ${updatedCount} files.`,
	);
}

addHeader().catch((err) => {
	console.error("❌ Error while processing files:", err);
	process.exitCode = 1;
});
