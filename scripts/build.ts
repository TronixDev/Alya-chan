#!/usr/bin/env bun
import { existsSync, mkdirSync } from "node:fs";
import { $ } from "bun";

const targets = {
	linux: "bun-linux-x64",
	windows: "bun-windows-x64",
	macos: "bun-darwin-x64",
};

const outputDir = "dist/executables";

if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

console.log("🚀 Building Alya-chan executables...");

for (const [platform, target] of Object.entries(targets)) {
	const extension = platform === "windows" ? ".exe" : "";
	const outputFile = `${outputDir}/alya-chan-${platform}${extension}`;

	console.log(`📦 Building for ${platform}...`);

	try {
		await $`bun build src/index.ts --compile --target=${target} --outfile=${outputFile}`;
		console.log(`✅ Built: ${outputFile}`);
	} catch (error) {
		console.error(`❌ Failed to build for ${platform}:`, error);
	}
}

console.log("🎉 Build complete!");
