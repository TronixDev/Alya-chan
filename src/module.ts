import type Alya from "#alya/client";
import type { LavalinkManager } from "lavalink-client";
import type { ParseClient, ParseLocales, ParseMiddlewares } from "seyfert";
import type { AlyaMiddlewares } from "#alya/middlewares";
import type { AlyaContext } from "#alya/utils";
import type { Options } from "#alya/types";
import type English from "./locales/en-US";

declare module "seyfert" {
	interface Command extends Options {}
	interface SubCommand extends Options {}
	interface ComponentCommand extends Options {}
	interface ModalCommand extends Options {}
	interface ContextMenuCommand extends Options {}
	interface EntryPointCommand extends Options {}

	interface UsingClient extends ParseClient<Alya> {}
	interface ExtendContext extends ReturnType<typeof AlyaContext> {}
	interface RegisteredMiddlewares
		extends ParseMiddlewares<typeof AlyaMiddlewares> {}
	interface GlobalMetadata extends ParseMiddlewares<typeof AlyaMiddlewares> {}
	interface DefaultLocale extends ParseLocales<typeof English> {}

	interface Client {
		lavalink: LavalinkManager;
	}

	interface ExtendedRCLocations {
		lavalink: string;
	}

	interface InternalOptions {
		withPrefix: true;
	}
}
