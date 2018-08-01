var cheerio = require('cheerio');
var fs = require('fs');
var debug = require('debug')('helpers');
var path = require('path');

var TARGET_SCRIPT_PATH =
  module.exports.TARGET_SCRIPT_PATH =
    '/target/target-script-min.js#anonymous';

var config;

async function injectWeinre(ctx, next) {
  await next();
  injectWeinreIntoBody(ctx);
}

function injectWeinreIntoBody(ctx) {
  var extname = path.extname(ctx.path);
  if (['.html', '.shtml'].indexOf(extname) > -1) {
    var host = ctx.protocol + '://' + ctx.host + ':' + config.port;
    var data = ctx.body;
    var $ = cheerio.load(data);
    var scriptSrc = '<script src="' + host + TARGET_SCRIPT_PATH + '"></script>';
    $('body').append(scriptSrc);
    ctx.body = $.html();
  }
}

module.exports.injectWeinre = function (opts) {
  config = opts || {};
  return injectWeinre;
};

module.exports.injectWeinreIntoBody = injectWeinreIntoBody;