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

function* assetsHandler(next) {
    var self = this;
    assert(config.root, 'root dir required');
    yield next;

    if (self.body === undefined) {
        var urlParams = url.parse(self.href);
        var targetUrl = utils.getTargetUrl(config.urls, urlParams.path, urlParams.host);
        var result;

        debug('===> ' + targetUrl);
        if (targetUrl) {
            if (isUrl(targetUrl)) {
                result = yield utils.getRemoteContent(self, targetUrl);
            } else {
                result = yield utils.getLocalContent(self, targetUrl, config);
            }
        } else if (utils.canDnsRequest(self.host)) {
            result = yield utils.getRemoteContent(self)
        } else {
            debug('===> not found: ' + self.pathname);
            return utils.notFound(self);
        }

        if (result === null) {
            return utils.notFound(self);
        } else {
            var extname = path.extname(urlParams.pathname);
            var type;

            if (extname === '.cgi' || extname === '.fcgi') {
                type = mime.lookup('.json');
            } else {
                type = (extname === '.shtml') ? mime.lookup('.html') : mime.lookup(self._extname || extname);
            }

            self.set('Last-Modified', (new Date).toUTCString());
            self.set('Cache-Control', 'max-age=0');
            var resHeader = self.response.headers;
            if (!resHeader['Content-Type'] && !resHeader['content-type']) {
                self.set('Content-Type', type + (isTextFile(extname) ? '; charset=utf-8' : ''));
            }

            var referer = this.req.headers.referer || '';
            if (referer && config.allowOriginAll) {
                self.set('Access-Control-Allow-Origin', '*');
            } else {
                var referObj = url.parse(referer);
                self.set('Access-Control-Allow-Origin', referObj.protocol + '//' + referObj.host);
            }

            self.set('Access-Control-Allow-Credentials', true);
            self.body = result;
        }

        if (config.debug) {
            helpers.injectWeinreIntoBody(self);
        }
    }
}

module.exports = assets;