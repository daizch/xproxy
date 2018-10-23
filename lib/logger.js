/**
 * origin: https://github.com/koajs/logger
 * Module dependencies.
 */

var Counter = require('passthrough-counter');
var humanize = require('humanize-number');
var bytes = require('bytes');
var chalk = require('chalk');

module.exports.logger = dev;
module.exports.reqLog = requestLog;
module.exports.resLog = responseLog;
module.exports.error = error;

/**
 * Color map.
 */

var colorCodes = {
  5: 'red',
  4: 'yellow',
  3: 'cyan',
  2: 'green',
  1: 'green'
};

/**
 * Development logger.
 */


function error(err) {
  err = err.stack || err
  console.log('  ' + chalk.bold.red(err));
}

function dev(opts) {
  return async function logger(ctx, next) {
    // log when the response is finished or closed,
    // whichever happens first.
    var res = ctx.res;

    // request
    var start = new Date;

    ctx._reqStartTime = start;
    try {
      await next();
    } catch (err) {
      // log uncaught downstream errors
      responseLog(ctx, err);
      throw err;
    }

    var onfinish = done.bind(null, 'finish');
    var onclose = done.bind(null, 'close');

    res.once('finish', onfinish);
    res.once('close', onclose);

    function done(event) {
      res.removeListener('finish', onfinish);
      res.removeListener('close', onclose);
      responseLog(ctx);
    }
  }
}

function requestLog(ctx) {
  console.log('  ' + chalk.gray('<--')
    + ' ' + chalk.bold.blue('%s')
    + ' ' + chalk.blue('%s'),
    ctx.method,
    ctx.req._originalUrl || ctx.originalUrl || ctx.href);
}

function responseLog(ctx, err) {
  // calculate the length of a streaming response
  // by intercepting the stream with a counter.
  // only necessary if a content-length header is currently not set.
  var length = ctx.response.length;
  var body = ctx.body;
  var counter;
  if (null == length && body && body.readable) {
    ctx.body = body
      .pipe(counter = Counter());
  }

  var status = (ctx.status || 404);
  var len = counter ? counter.length : length;
  var start = ctx._reqStartTime || new Date();
  // set the color of the status code;
  var s = status / 100 | 0;
  var color = colorCodes[s];

  // get the human readable response length
  var length;
  if (~[204, 205, 304].indexOf(status)) {
    length = '';
  } else if (null == len) {
    length = '-';
  } else {
    length = bytes(len);
  }

  var upstream = err ? chalk.red(' ') : chalk.gray('-->');

  requestLog(ctx);

  console.log('\t' + ' ' + chalk.bold.blue('response') + upstream
    + ' ' + chalk.green('%s')
    + ' ' + chalk[color]('%s')
    + ' ' + chalk.gray('%s')
    + ' ' + chalk.gray('%s'),
    ctx._responseUrl || ctx.originalUrl,
    status,
    time(start),
    length);

  if (err) error(err)
}

/**
 * Show the response time in a human readable format.
 * In milliseconds if less than 10 seconds,
 * in seconds otherwise.
 */

function time(start) {
  var delta = new Date - start;
  delta = delta < 10000
    ? delta + 'ms'
    : Math.round(delta / 1000) + 's';
  return humanize(delta);
}