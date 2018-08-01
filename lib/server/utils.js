const _ = require('lodash');
const co = require('co');
const dns = require('dns');
const urllib = require('co-urllib');
const fs = require('fs');
const path = require('path');
const debug = require('debug')('utils');
const expandHomeDir = require('expand-home-dir');
const url = require('url');
const qs = require('querystring');
const Log = require('../logger');
const httpProxy = require('http-proxy');
const send = require('koa-send')

function isLocalHost(host, reqUrl) {
  return !(!/127\.0\.0\.1/.test(host) && !/127\.0\.0\.1/.test(reqUrl));
}

function dnsLookup(host) {
  return new Promise(function (resolve) {
    if (host === 'localhost') {
      return resolve('127.0.0.1');
    }
    dns.resolve(host, function (err, ip) {
      if (!err) {
        resolve(ip[0])
      } else {
        resolve(null);
        debug('dns look up error for the host:' + host)
      }
    })
  });
}

function canDnsRequest(host) {
  var ipReg = /^(\d{1,3}\.){3}\d{1,3}(:\d*)?$/;
  return !ipReg.test(host);
}

function proxyToApache(ctx, config) {
  return new Promise(function (resolve, reject) {
    try {
      const proxy = httpProxy.createProxyServer({});
      var target = ctx.protocol + '://127.0.0.1:' + config.apachePort;
      proxy.web(ctx.req, ctx.res, {
        target: target,
        secure: false
      });

      proxy.on('end', function (req, res) {
        Log.resLog(ctx);
        resolve();
      });
      proxy.on('error', function (err, req, res, target) {
        console.log('[proxy error]', err);
        Log.resLog(ctx, err);
        reject(err);
      });

      proxy.on('econnreset', function (err) {
        console.log(err)
        reject(err);
      });
    } catch (err) {
      console.error(err)
      reject(err);
    }
  });
}

async function getLocalContent(ctx, filepath, config) {
  var fileObj = url.parse(filepath);
  var fileQs = qs.parse(fileObj.query || '');
  filepath = fileObj.pathname;
  var extname = path.extname(filepath);
  var result = null;
  var isProxyToRemote = fileQs.noop === undefined;

  if (filepath !== 'noop') {
    try {
      var stat = fs.statSync(filepath);
      if (stat.isFile()) {
        ctx._responseUrl = filepath;
        if (config.apachePort) { //todo support proxy to apache server
          result = await proxyToApache(ctx, config);
        } else {
          await send(ctx, filepath, {
            maxage: 0,
            root: '/'
          });
          result = undefined
          // ctx._extname = extname;
          // ctx.set('Content-Length', stat.size)
          // result = fs.createReadStream(filepath);
        }
      } else if (isProxyToRemote) {
        result = await getRemoteContent(ctx);
      }
    } catch (err) {
      console.error(err)
      if (isProxyToRemote) {
        result = await getRemoteContent(ctx);
      }
    }
  }

  return result;
}

async function getRemoteContent(ctx, reqUrl) {
  var urlObj = (reqUrl && url.parse(reqUrl)) || {};
  var result;
  var host;
  var protocol = urlObj.protocol || (ctx.protocol + ':');
  ctx.req._originalUrl = ctx.req.url;
  host = urlObj.host || ctx.host;

  // if (isLocalHost(host, reqUrl)) {
  //     ctx.req.url = reqUrl;
  // }
  if (reqUrl) {
    ctx.req.url = reqUrl;
  }
  if (canDnsRequest(host)) {
    host = await dnsLookup(host);
  }
  result = await requestByDNSResolve(ctx, host);
  return result
}

async function requestFn(reqUrl, opt) {
  var response = await urllib.request(reqUrl, opt || {});

  var result;
  switch (response.status) {
    case 200:
      result = response;
      break;
    case 301:
      result = await requestFn(response);
      break;
    case 302:
      result = await requestFn(response);
      break;
  }

  if (result) {
    return result;
  } else {
    result = null;
  }
}

function matchLocalhost(url) {
  if (/^https?:\/\/localhost/.test(url)) {
    url = url.replace('//localhost', '//127.0.0.1')
  }
  return url;
}

function getTargetUrl(urls, originalUrl, urlParams) {
  var target = null;

  if (urls && urls.length > 0) {
    _.some(urls, function (url) {
      var match = url.rule.exec(originalUrl);
      var urlTarget = url.target;

      if (match) {
        if (typeof(urlTarget) === 'string') {
          target = urlTarget.replace(/\$(\d+)/g, function (m, $i) {
            return match[$i];
          });
        } else if (typeof(urlTarget) === 'function') {
          target = urlTarget(originalUrl, match, urlParams);
        }

        target = target.replace('$', originalUrl);
        target = expandHomeDir(target);
        target = matchLocalhost(target)

        return true;
      }
    });
  }

  return target;
}

function proxyRequest(ctx, target) {
  return new Promise((resolve, reject) => {
    try {
      const proxy = httpProxy.createProxyServer({
        agent: null
      });

      proxy.web(ctx.req, ctx.res, {
        target: target,
        secure: false
      });
      proxy.on('end', function (req, res) {
        Log.resLog(ctx);
        resolve()
      });

      proxy.on('error', function (err, req, res, target) {
        console.log('[proxy error]', err);
        Log.resLog(ctx, err);
        reject(err)
      });

      proxy.on('econnreset', function (err) {
        console.log(err)
        resolve()
      });
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

async function requestByDNSResolve(ctx, host) {
  var ip;
  host = host || ctx.host;

  if (!/\d+\.\d+\.\d+/.test(host)) {
    ip = await dnsLookup(host);
  } else {
    ip = host;
  }

  if (!ip) {
    throw new Error('can not lookup host ip')
  }
  var target = ctx.protocol + '://' + ip;
  var reqUrl;
  if (ctx.url.indexOf(host) > -1) {
    reqUrl = ctx.url.replace(host, ip);
  } else {
    reqUrl = target + ctx.url;
  }

  debug('===> ' + reqUrl);
  ctx._responseUrl = reqUrl;
  await proxyRequest(ctx, target)
}

function notFound(ctx) {
  ctx.status = 404;
  ctx.set('Content-Type', 'text/plain');
  ctx.body = 'Not Found';
}

module.exports = {
  requestByDNSResolve: requestByDNSResolve,
  canDnsRequest: canDnsRequest,
  getTargetUrl: getTargetUrl,
  notFound: notFound,
  getLocalContent: getLocalContent,
  getRemoteContent: getRemoteContent
};