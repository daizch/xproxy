const path = require('path');
const fs = require('fs');
const assert = require('assert');
const expandHomeDir = require('expand-home-dir');
const utils = require('./utils');
const url = require('url');
const debug = require('debug')('assets');
const mime = require('mime');
const helpers = require('./helpers');

var config = null;

function assets(opt) {
  config = opt || {};
  config.allowOriginAll = config.allowOriginAll === undefined ? true : config.allowOriginAll;

  if (!/win32/.test(process.platform)) {
    config.root = expandHomeDir(config.root);
  }

  return assetsHandler;
}

function isUrl(url) {
  return url && /^http(s)?:\/\//.test(url);
}

function isTextFile(extname) {
  var files = ['.js', '.css', '.html', '.txt', '.json', '.shtml', '.cgi', '.fcgi'];
  return files.indexOf(extname) > -1;
}

function setHeaders(ctx) {
  // var referer = ctx.req.headers.referer || '';
  //
  // if (referer && config.allowOriginAll) {
  //   ctx.set('Access-Control-Allow-Origin', '*');
  // } else {
  //   var referObj = url.parse(referer);
  //   ctx.set('Access-Control-Allow-Origin', referObj.protocol + '//' + referObj.host);
  // }
  var urlParams = url.parse(ctx.href);
  ctx.set('Access-Control-Allow-Origin', '*');

  var extname = path.extname(urlParams.pathname);
  var type;

  if (extname === '.cgi' || extname === '.fcgi') {
    type = mime.lookup('.json');
  } else {
    type = (extname === '.shtml') ? mime.lookup('.html') : mime.lookup(ctx._extname || extname);
  }

  ctx.set('Last-Modified', (new Date).toUTCString());
  ctx.set('Cache-Control', 'max-age=0');
  var resHeader = ctx.response.headers;
  if (!resHeader['Content-Type'] && !resHeader['content-type']) {
    ctx.set('Content-Type', type + (isTextFile(extname) ? '; charset=utf-8' : ''));
  }

  ctx.set('status', 200)
  if (type.indexOf('video') > -1) {
    ctx.set('Accept-Ranges', 'bytes')
  }
  ctx.set('Access-Control-Allow-Credentials', true);
}

async function assetsHandler(ctx, next) {
  assert(config.root, 'root dir required');
  await next();
  debugger
  if (ctx.body === undefined) {
    var urlParams = url.parse(ctx.href);
    var targetUrl = utils.getTargetUrl(config.urls, urlParams.path, urlParams);
    var result;

    debug('===> ' + targetUrl);
    setHeaders(ctx);
    if (targetUrl) {
      if (isUrl(targetUrl)) {
        result = await utils.getRemoteContent(ctx, targetUrl);
      } else {
        result = await utils.getLocalContent(ctx, targetUrl, config);
      }
    } else if (utils.canDnsRequest(ctx.host)) {
      result = await utils.getRemoteContent(ctx)
    } else {
      debug('===> not found: ' + ctx.pathname);
      return utils.notFound(ctx);
    }

    if (result === null) {
      return utils.notFound(ctx);
    } else if (result) {
      ctx.body = result;
    }

    if (config.debug) {
      helpers.injectWeinreIntoBody(ctx);
    }
  }
}

module.exports = assets;