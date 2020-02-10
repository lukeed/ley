const $ = require('kleur');

const LEY = $.bold('[ley]');
const SPACER = ' '.repeat(6); // "[ley] "

function print(color, msg) {
	console.log($[color](LEY), msg.includes('\n') ? msg.replace(/(\r?\n)/g, '$1' + SPACER) : msg);
}

exports.log = print.bind(null, 'white');
exports.info = print.bind(null, 'cyan');
exports.success = print.bind(null, 'green');
exports.warn = print.bind(null, 'yellow');
exports.error = print.bind(null, 'red');

exports.bail = msg => {
	exports.error(msg);
	process.exit(1);
};
