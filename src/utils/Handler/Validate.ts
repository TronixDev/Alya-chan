import { Logger } from "seyfert";
import { DEBUG_MODE, DEV_MODE, InvalidEnvValue } from "#alya/utils";

const logger = new Logger({
	name: "[ENV]",
});

/**
 *
 * Validate Alya environment variables.
 * @returns
 */
export function validateEnv() {
	logger.info("Validating '.env' file variables...");

	if (DEBUG_MODE) logger.warn("Running in Debug Mode");
	if (DEV_MODE) logger.warn("Running in Development Mode");
	if (!DEBUG_MODE && !DEV_MODE) logger.info("Running in Production Mode");

	const createMessage = (variable: string) =>
		`The variable: '${variable}' in the '.env' cannot be empty or undefined.`;

	if (!process.env.TOKEN) throw new InvalidEnvValue(createMessage("TOKEN"));
	if (!process.env.DATABASE_URL)
		throw new InvalidEnvValue(createMessage("DATABASE_URL"));
	if (!process.env.DATABASE_PASSWORD)
		throw new InvalidEnvValue(createMessage("DATABASE_PASSWORD"));

	return logger.info("All required environment variables are present.");
}
