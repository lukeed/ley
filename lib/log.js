const { green, underline, red, dim } = require('kleur');
const { MigrationError } = require('./util');

exports.done = (type, arr) => {
	let msg = '';

	if (arr.length > 0) {
		let i=0, arrow = type === 'up' ? '↑' : '↓';
		msg += ('Migrated ' + green(arr.length) + (arr.length > 1 ? ' files:' : ' file:'));
		for (; i < arr.length; i++) msg += (green().dim(`\n    ${arrow} `) + underline().grey(arr[i]));
	} else {
		msg += 'All caught up! 🎉';
	}

	process.stdout.write('\n' + green('[ley] ') + msg + '\n\n');
}

exports.bail = mix => {
	let msg = mix instanceof MigrationError
		? `Error with "${underline(mix.migration.name)}" migration:`
		: 'An error occurred:';

	if (mix instanceof Error) {
		let key, pfx = `\n      `;
		let [title, ...rest] = mix.stack.split(/[\n\r]+/g);
		msg += '\n\n      ' + red().dim().underline(title);
		rest.forEach(str => msg += dim('\n    ' + str));
		if (!rest.length) pfx += '  ';
		for (key in mix) {
			if (key === 'migration' || mix[key] === void 0) continue;
			msg += pfx + `${key}: ` + dim(mix[key]);
		}
	}

	process.stdout.write('\n' + red('[ley] ') + msg + '\n\n');
	process.exit(1);
};
