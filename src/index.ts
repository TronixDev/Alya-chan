import "@dotenvx/dotenvx/config";
import Alya from "#alya/client";
import { Logger } from "seyfert";
import { AlyaLogger, validateEnv } from "#alya/utils";
import { APIServer } from "#alya/api";
import { preloadAllModels, validateModelFiles } from "#alya/models";

Logger.customize(AlyaLogger);

validateEnv();

const client = new Alya();
(async () => {
	// Validate and preload language models
	console.log("🔍 Validating language model files...");
	const validation = await validateModelFiles();

	if (!validation.valid) {
		console.warn(
			"⚠️  Some language model files are missing:",
			validation.missing,
		);
		console.warn("Bot will continue but some languages may not work properly.");
	} else {
		console.log("✅ All language model files validated successfully");
	}

	// Preload all models for better performance
	console.log("📚 Preloading language models...");
	await preloadAllModels();

	await APIServer(client);
})();

export default client;
