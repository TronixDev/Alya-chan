import "@dotenvx/dotenvx/config";
import { Logger } from "seyfert";
import { APIServer } from "#alya/api";
import Alya from "#alya/client";
import { preloadAllModels, validateModelFiles } from "#alya/models";
import { AlyaLogger, validateEnv } from "#alya/utils";

Logger.customize(AlyaLogger);

validateEnv();

await validateModelFiles();
await preloadAllModels();

const client = new Alya();
APIServer(client);

export default client;
