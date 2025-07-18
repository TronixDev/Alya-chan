/**
 * Error thrown when an invalid environment value is provided.
 * @class InvalidEnvValue
 * @extends {Error}
 */
export class InvalidEnvValue extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidEnvValue]";
	}
}

/**
 * Error thrown when an invalid component run is provided.
 * @class InvalidComponentRun
 * @extends {Error}
 */
export class InvalidComponentRun extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidComponentRun]";
	}
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidEmbedsLength extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidEmbedsLength]";
	}
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidMessage extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidMessage]";
	}
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidPageNumber extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidPageNumber]";
	}
}

/**
 * Error thrown when the nodes has a session id, but the session id is resolved.
 * @class InvalidNodeSession
 * @extends {Error}
 */
export class InvalidNodeSession extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidSession]";
	}
}

/**
 * Error thrown when an invalid component is provided.
 * @class InvalidRow
 * @extends {Error}
 */
export class InvalidRow extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidRow]";
	}
}

/**
 * Error thrown when an invalid component type is provided.
 * @class InvalidComponentType
 * @extends {Error}
 */
export class InvalidComponentType extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidComponentType]";
	}
}

/**
 * Error thrown when an invalid queue store is provided.
 * @class InvalidQueue
 * @extends {Error}
 */
export class InvalidQueue extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Alya [InvalidQueue]";
	}
}
