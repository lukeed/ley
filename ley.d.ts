declare namespace Options {
	declare interface Base {
		cwd?: string;
		client?: string;
		dir?: string;
	}

	declare interface Up extends Base {
		single?: boolean;
	}

	declare interface Down extends Base {
		all?: boolean;
	}
}

declare class MigrationError extends Error {
	readonly migration: Record<'name'|'abs', string>;
}

export function up(opts?: Options.Up): Promise<void>;
export function down(opts?: Options.Down): Promise<void>;
