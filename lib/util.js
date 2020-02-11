const totalist = require('totalist');

exports.glob = async function (dir) {
	const output = [];
	await totalist(dir, (name, abs) => output.push({ name, abs }));
	return output.sort((a, b) => a.name.localeCompare(b.name)); // ~rand order
}

exports.diff = function (prevs, nexts) {
	let i=0, ran, tmp, out=[];
	for (; i < nexts.length; i++) {
		tmp = nexts[i]; // file
		ran = prevs[i]; // <name>

		if (!ran) out.push(tmp);
		else if (tmp.name === ran.name) continue; // match
		else throw new Error(`Cannot run "${tmp.name}" after "${ran.name}" has been applied`);
	}
	return out;
}

exports.pluck = function (prevs, nexts) {
	let i=0, j=0, ran, tmp, out=[];
	outer: for (; i < prevs.length; i++) {
		ran = prevs[i]; // <name>
		for (j=i; j < nexts.length; j++) {
			tmp = nexts[j]; // file
			if (tmp.name === ran.name) {
				out.push(tmp);
				continue outer;
			}
		}
		throw new Error(`Cannot find "${ran.name}" migration file`);
	}
	return out;
}

exports.exists = function (dep, paths) {
	try {
		return !!require.resolve(dep, { paths });
	} catch (err) {
		return false;
	}
}

// TODO: mysql?
exports.detect = async function (cwd) {
	return ['postgres', 'pg'].find(x => exports.exists(x, [cwd]));
}

exports.MigrationError = class MigrationError extends Error {
	constructor(err, file) {
		super(err.message);
		const details = err.stack.replace(/^(.*?)(?:[\n\r])/, '');
		Error.captureStackTrace(err, MigrationError);
		this.stack += '\n' + details;
		Object.assign(this, err);
		this.migration = file;
	}
}
