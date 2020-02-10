export namespace Options {
	export interface Base {
		cwd?: string;
		client?: string;
		dir?: string;
	}

	export interface Up extends Base {
		single?: boolean;
	}

	export interface Down extends Base {
		all?: boolean;
	}
}

export function up(opts?: Options.Up): Promise<void>;
export function down(opts?: Options.Down): Promise<void>;
