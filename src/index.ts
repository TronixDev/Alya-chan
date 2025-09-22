import "@dotenvx/dotenvx/config";
import Alya from "#alya/client";
import { Logger } from "seyfert";
import { APIServer } from "#alya/api";
import { AlyaLogger, validateEnv } from "#alya/utils";
import { preloadAllModels, validateModelFiles } from "#alya/models";

Logger.customize(AlyaLogger);

validateEnv();

await validateModelFiles();
await preloadAllModels();

const client = new Alya();
APIServer(client);

export default client;
