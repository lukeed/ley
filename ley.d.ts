declare namespace Options {
	declare type Config = Record<string, unknown>;
	declare type Resolver = Promise<Config> | () => Config;

	declare interface Base {
		cwd?: string;
		client?: string;
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
	}
}

declare class MigrationError extends Error {
	readonly migration: Record<'name'|'abs', string>;
}

export function up(opts?: Options.Up): Promise<string[]>;
export function down(opts?: Options.Down): Promise<string[]>;

declare function n(opts?: Options.New): Promise<string>;
export { n as new };
