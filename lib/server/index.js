'use strict';

const Koa = require('koa');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const _ = require('lodash');
const expandHomeDir = require('expand-home-dir');
const debug = require('debug')('server');
const serverErr = require('debug')('server:error');
const exec = require('child_process').exec;
const helpers = require('./helpers');
const Log = require('../logger');
const serve = require('koa-static');
const assets = require('./assets');
const ip = require('ip');
const co = require('co');
const httpProxy = require('http-proxy');

const utils = require('./utils');

const HOME = process.env.HOME;
const CWD = process.cwd();
var weinreBin = path.join(__dirname, '../../node_modules/weinre/weinre');

const DefaultOpts = {
  root: CWD,
  port: 80,
  sslPort: 443
};

var proxyCfg;
var weinrePort = 8989;
var weinreChildProcess;

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

function readConf(fp) {
  var conf;

  if (isExistFile(fp)) {
    delete require.cache[require.resolve(fp)];
    conf = require(fp);
  } else {
    conf = {};
  }

  return conf;
}

function getConfig() {
  var globalConfigPath = path.join(HOME, '.xproxy', 'xproxy.conf.js');
  var projConfigPath = path.join(CWD, 'xproxy.conf.js');
  var projConf;
  var gConf;
  var existProjConfig = isExistFile(projConfigPath);
  var existGlobalConfig = isExistFile(globalConfigPath);

  if (!existProjConfig && !existGlobalConfig) {
    throw new Error('不存在xproxy的配置文件[xproxy.conf.js],请先添加配置文件');
  }

  gConf = readConf(globalConfigPath);
  projConf = readConf(projConfigPath);

  return _.merge(gConf || {}, projConf || {});
}

function launchWeinre() {
  var ps = exec("ps aux | grep 'node_modules/weinre/weinre\\s--httpPort' | awk '{print $2}'", {
    cwd: CWD
  }, function (err, result) {
    result = result.toString().trim();
    if (!result) {
      debug('startup weinre');
      weinreChildProcess = exec(weinreBin + ' --httpPort ' + weinrePort);
      weinreChildProcess.stdout.pipe(process.stdout);
      weinreChildProcess.stderr.pipe(process.stderr);
      weinreChildProcess.on('SIGTERM', function (err) {
        serverErr('weinre error: ');
        serverErr(arguments)
      });
      weinreChildProcess.on('uncaughtException', function (err) {
        serverErr('weinre uncaughtException: ');
        serverErr(arguments)
      });
    }
  });
}

function readCert() {
  var credentials = {
    requestCert: false,
    rejectUnauthorized: false
  };

  const HOME = process.env.HOME;
  try {
    credentials.key = fs.readFileSync(path.join(HOME, '.xproxy', 'cert/server.key'));
    credentials.cert = fs.readFileSync(path.join(HOME, '.xproxy', 'cert/server.crt'));
  } catch (err) {
    try {
      credentials.key = fs.readFileSync(path.join(CWD, 'cert/server_ca.key'));
      credentials.cert = fs.readFileSync(path.join(CWD, 'cert/server_ca.crt'));
    } catch (err) {
      console.log('未找到https证书');
    }
  }

  return credentials;
}

function serveSSL(app) {
  var sslPath = path.join(CWD, 'cert', 'xproxy_ca.crt');
  if (!isExistFile(sslPath)) {
    sslPath = path.join(HOME, '.xproxy/cert', 'xproxy_ca.crt');
  }

  if (!isExistFile(sslPath)) {
    sslPath = path.join(__dirname, '../../cert', 'xproxy_ca.crt');
  }

  if (!isExistFile(sslPath)) {
    console.log('未安装ssl证书');
  } else {
    console.log('移动端可通过 http://' + ip.address() + '/xproxy_ca.crt' + ' 安装证书');
    app.use(serve(path.dirname(sslPath)));
  }
}

module.exports = function (opts) {
  console.log('starting server...');
  opts = _.merge(DefaultOpts, opts);
  proxyCfg = getConfig();
  proxyCfg = _.merge(opts, proxyCfg);

  if (proxyCfg.root) {
    proxyCfg.root = expandHomeDir(proxyCfg.root);
  }

  proxyCfg.defaultDomain = proxyCfg.defaultDomain || 'qian-img.tenpay.com';

  const credentials = readCert();
  const app = new Koa();
  const ROOTDIR = proxyCfg.root;

  if (!ROOTDIR) {
    throw new Error('no root dir, must config root dir.');
  }


  serveSSL(app);

  if (!opts.silent) {
    app.use(Log.logger());
  }

  if (opts.debug) {
    launchWeinre();
    app.use(helpers.injectWeinre({port: weinrePort}));
  }

  proxyCfg.debug = opts.debug;
  app.use(assets(proxyCfg));


  var httpServer = http.createServer(app.callback());
  var httpsServer = https.createServer(credentials, app.callback());

  httpServer.listen(proxyCfg.port).on('error', httpServerErrorHandler);
  httpsServer.listen(proxyCfg.sslPort).on('error', httpServerErrorHandler);

  function httpServerErrorHandler(err) {
    console.error(err);
    exitHandler();
    switch (err.errno) {
      case 'EADDRINUSE':
        console.error(err + ", port " + proxyCfg.port + " is in use. Please check if xproxy-server is already running");
        break;
      case 'EACCES':
        console.error('permission denied, try to run sudo xproxy server');
        break;
      default:
        console.error(err, 'xproxy server');
        break;
    }
  }

  function exitHandler(err) {
    console.error('exit with error');
    console.error(err)
    httpServer.close();
    httpsServer.close();

    if (weinreChildProcess) {
      weinreChildProcess.kill();
    }

    process.exit(1);
  }

  process.on('uncaughtException', exitHandler);
};

