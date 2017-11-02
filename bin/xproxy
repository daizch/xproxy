#!/usr/bin/env node
const child_process = require('child_process');
const spawn = require('child_process').spawn;
const path = require('path');

const root = path.join(__dirname, '..');

if (process.argv.length < 3) {
    throw new Error('参数输入有误,至少需要一个参数');
}

var bin = path.join(require.resolve('node-dev'), '../..', 'bin/node-dev');
var cmds = [path.join(root, 'index.js')].concat(process.argv.slice(2));
var ps = spawn('node', [bin].concat(cmds), {
    cwd: process.cwd(),
    env: Object.assign({'FORCE_COLOR': 1},process.env) //for chalk
});

ps.stderr.on('data', function (data) {
    console.error('[error] : ', data.toString());
});

ps.on('exit', function (code) {
    ps.kill(code);
});


process.on('exit', function (err) {
    ps.kill(0);
});

ps.stdout.pipe(process.stdout);