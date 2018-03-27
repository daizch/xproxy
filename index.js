const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const shelljs = require('shelljs');
const server = require('./lib/server/index');
const pkg = require('./package.json');
const proxyConfig = require('./default.xproxy.conf');
const _ = require('lodash');
const debug = require('debug');
const certUtil = require('./lib/cert/');
var chalk = require('chalk');
var semver = require('semver');

const CWD = process.cwd();
program
  .version(pkg.version, '-v, --version');

program.command('server')
  .description('启动代理服务器')
  .option('-r, --root [value]', 'root directory for serving')
  .option('-p, --port [value]', 'the port for http server to listen')
  .option('-s, --ssl-port [value]', 'the port for https server to listen')
  .option('-S, --silent', 'disable output debug logs')
  .option('-d, --debug', 'set weinre debug mode')
  .action(function (args) {
    var opts = {};
    var cmds = [];
    args.options && args.options.forEach(function (opt) {
      var key = opt.name();
      if (args[key]) {
        opts[key] = args[key];
        cmds.push('--' + key, args[key]);
      }
    });

    if (args.silent) {
      debug.disable('*');
    } else {
      debug.enable('*,-koa-send,-co-urllib,-readall');
    }

    _.extend(opts, proxyConfig);

    if (!opts.root) {
      opts.root = process.cwd();
    }

    server(opts);
  });

program.command('cert [cmd]')
  .description('创建自签名证书')
  .option('-f, --force', '覆盖原有证书')
  .option('-a, --android', '创建安卓的特殊格式证书文件')
  .action(function (cmd, opts) {
    if (!cmd) {
      certUtil.generateCert(opts);
    } else if (cmd === 'init') {
      certUtil.initOpenSSLConfig()
    } else if (cmd === 'ca') {
      certUtil.copyCAFiles()
    }
  });


function isExistFile(filepath) {
  var flag;
  try {
    var stat = fs.statSync(filepath);
    flag = stat.isFile();
  } catch (err) {
    flag = false;
  }

  return flag;
}

program.command('init')
  .description('创建xproxy.conf.js范例')
  .option('-f, --force', '覆盖原有xproxy.conf.js')
  .action(function (opts) {
    var src = path.join(__dirname, 'default.xproxy.conf.js');
    var dest = path.join(CWD, 'xproxy.conf.js');
    try {
      if (isExistFile(dest) && !opts.force) {
        console.log(dest + ' 已存在xproxy.conf.js配置文件', '可执行xproxy init -f 覆盖原有配置');
      } else {
        fs.copySync(src, dest);
        console.log('创建xproxy.conf.js成功');
      }
    } catch (err) {
      console.error(err);
    }
  });

process.on('uncaughtException', function (err) {
  console.log(err);
  checkLatestVersion();
});

function checkLatestVersion() {
  var child = shelljs.exec('npm view xproxy version', {silent: true, async: true});
  child.stdout.on('data', function (result) {
    var latestVersion = semver.clean(result);
    if (latestVersion && semver.lt(pkg.version, latestVersion)) {
      console.log(chalk.green(`xproxy最新版本是${latestVersion}，请尽快升级 $ npm i -g xproxy`));
    }
  });

  setTimeout(function () {
    child.kill();
  }, 3e3);
}

program
  .command('*')
  .action(function (env) {
    console.error('命令有误,请检查');
    program.outputHelp();
    checkLatestVersion();
  });
program.parse(process.argv);
