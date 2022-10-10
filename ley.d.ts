declare namespace Options {
	declare type Config = Record<string, unknown>;
	declare type Resolver = Promise<Config> | (() => Config);

	declare interface Base {
		cwd?: string;
		driver?: string | Driver;
		require?: string | string[];
		config?: Config | Resolver;
		dir?: string;
	}

	declare interface Up extends Base {
		single?: boolean;
	}

	declare interface Down extends Base {
		all?: boolean;
	}

	declare interface New extends Base {
		filename: string;
		timestamp?: boolean;
		length?: number;
		esm?: boolean;
	}
}

declare class MigrationError extends Error {
	readonly migration: Record<'name'|'abs', string>;
}

declare namespace Migration {
	type Method = 'up' | 'down';

	type Existing = Pick<File, 'name'>;

	interface File {
		/** The absolute file path */
		abs: string;
		/** The relative file path from `opts.dir` */
		name: string;
	}
}

export declare class Driver<Client = unknown> {
	/**
	 * Create a new Client connection using supplied options/config.
	 * @important Must return the `Client` for further usage.
	 */
	connect<Client>(config: Options.Config): Promise<Client> | Client;
	/**
	 * Create `migrations` table and query for existing/applied migrations.
	 * @note You may `require('ley/lib/text')` for premade SQL-like queries.
	 * @important Must return the `name` of any existing migrations.
	 */
	setup(client: Client): Promise<Migration.Existing[]>;
	/**
	 * Loop `files` and apply the target `method` action.
	 * @note Whenever possible, *all* files should partake in the same transaction.
	 */
	loop(client: Client, files: Migration.File[], method: Migration.Method): Promise<void>;
	/**
	 * Gracefully terminate your client.
	 * Runs after *all* migrations have been applied, or after an error is thrown.
	 */
	end(client: Client): Promise<void> | void;
}

export function up(opts?: Options.Up): Promise<string[]>;
export function down(opts?: Options.Down): Promise<string[]>;
export function status(opts?: Options.Base): Promise<string[]>;

declare function n(opts?: Options.New): Promise<string>;
export { n as new };
