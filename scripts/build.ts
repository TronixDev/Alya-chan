#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, mkdirSync } from "node:fs";

const targets = {
	linux: "bun-linux-x64",
	windows: "bun-windows-x64",
	macos: "bun-darwin-x64",
};

const outputDir = "dist/executables";

// Create output directory
if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

console.log("🚀 Building Alya-chan executables...");

// Build for each target
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
