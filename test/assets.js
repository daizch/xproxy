var request = require('supertest');
var assets = require('../lib/assets');
var path = require('path');
var koa = require('koa');
var assert = require('assert');

describe('assets(opt)', function () {
    describe('with opt', function () {
        var proxyCfg = {
            urls: [
                {
                    rule: /(.*)/,
                    target: __dirname + '/$1'
                }
            ]
        };

        it('should 200', function (done) {
            var app = koa();

            app.use(assets(proxyCfg));

            request(app.listen())
                .get('/fixtures/hello.txt')
                .expect(200, done);
        });

        it('should 404', function (done) {
            var app = koa();

            app.use(assets(proxyCfg));

            request(app.listen())
                .get('/404')
                .expect(404, done);
        })
    });


    describe('proxy config', function () {
        it('should 200', function (done) {
            var app = koa();
            var proxyCfg = {
                urls: [
                    {
                        rule: /^(\/.*)\/(.*)$/,
                        target: __dirname + '/$1/$2'
                    }
                ]
            };
            app.use(assets(proxyCfg));

            request(app.listen())
                .get('/fixtures/hello.txt')
                .expect(200, done);
        });

        it('should 404', function (done) {
            var app = koa();
            var proxyCfg = {
                urls: [
                    {
                        rule: /^(\/.*)\/(.*)$/,
                        target: __dirname + '/$1/$2'
                    }
                ]
            };
            app.use(assets(proxyCfg));

            request(app.listen())
                .get('/404')
                .expect(404, done);
        });

        it('should 200 for target function', function (done) {
            var app = koa();
            var proxyCfg = {
                urls: [
                    {
                        rule: /^\/.*\/(.*)$/,
                        target: function(originalUrl, match) {
                            return path.join(__dirname + originalUrl.replace(match[1], 'hello.txt'))
                        }
                    }
                ]
            };

            app.use(assets(proxyCfg));

            request(app.listen())
                .get('/fixtures/placeholder.txt')
                .expect(200, done);
        })
    });
});