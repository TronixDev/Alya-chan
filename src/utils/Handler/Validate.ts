import { Logger } from "seyfert";
import { InvalidEnvValue } from "#alya/utils";

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

	const createMessage = (variable: string) =>
		`The variable: '${variable}' in the '.env' cannot be empty or undefined.`;

	if (!Bun.env.TOKEN) throw new InvalidEnvValue(createMessage("TOKEN"));
	if (!Bun.env.DATABASE_URL)
		throw new InvalidEnvValue(createMessage("DATABASE_URL"));
	if (!Bun.env.DATABASE_PASSWORD)
		throw new InvalidEnvValue(createMessage("DATABASE_PASSWORD"));

	return logger.info("All required environment variables are present.");
}
