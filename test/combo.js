var request = require('supertest');
var combo = require('../lib/combo');
var assets = require('../lib/assets');
var path = require('path');
var koa = require('koa');
var assert = require('assert');

describe('test combo', function () {
    describe('combo with mergefile', function () {
        // it('should 200', function (done) {
        //     var app = koa();
        //
        //     app.use(combo());
        //
        //     request(app.listen())
        //         .get('/mergefile?file=/fixtures/hello.txt&file=/fixtures/world.txt&v=20150922')
        //         .expect(200, done);
        // });

        it('should 404', function (done) {
            var app = koa();
            var proxyCfg = {
                urls: [
                    {
                        rule: /(.*)/,
                        target: __dirname + '/$1'
                    }
                ]
            };
            app.use(combo());
            app.use(assets(proxyCfg));
            request(app.listen())
                .get('/mergefile?file=/fixtures/404.txt&v=20150922')
                .expect(404, done);
        });
    });
});