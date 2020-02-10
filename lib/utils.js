const { resolve } = require('path');
const totalist = require('totalist');

exports.glob = async function (dir, cwd) {
	const migrations = [];
	await totalist(resolve(cwd || '.', dir), (name, abs) => {
		migrations.push({ name, abs });
	});
	// not always in order for some reason
	return migrations.sort((a, b) => a.name.localeCompare(b.name));
}

exports.diff = function (prevs, nexts) {
	let i=0, ran, tmp, out=[];
	for (; i < nexts.length; i++) {
		tmp = nexts[i]; // file
		ran = prevs[i]; // name

		if (!ran) out.push(tmp);
		else if (tmp.name === ran.name) continue; // match
		else throw new Error('out of order');
	}
	return out;
}
