const { cyan, green, yellow, underline, red, dim } = require('kleur');
const { MigrationError } = require('./util');

exports.info = msg => {
	console.log(cyan('[ley] ') + msg);
}

exports.done = (type, arr) => {
	let msg = '';

	if (type === 'new') {
		msg += 'Created ' + green('1') + ' file:';
		msg += green().dim('\n    ⌁ ') + underline().grey(arr);
	} else if (arr.length > 0) {
		let i=0, len=arr.length;
		let arrow = type === 'down' ? '↓' : '↑';
		let cc = type === 'status' ? yellow : green;
		msg += (type === 'status' ? 'Awaiting ' : 'Migrated ');
		msg += cc(len) + (len > 1 ? ' files:' : ' file:');
		for (; i < len; i++) msg += (cc().dim(`\n    ${arrow} `) + underline().grey(arr[i]));
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
