import "@dotenvx/dotenvx/config";
import Alya from "#alya/client";
import { Logger } from "seyfert";
import { AlyaLogger, validateEnv } from "#alya/utils";
import { APIServer } from "#alya/api";

Logger.customize(AlyaLogger);

validateEnv();

const client = new Alya();
(async () => {
	await APIServer(client);
})();

export default client;
