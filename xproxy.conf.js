const path = require('path');
const fs = require('fs');

const CWD = '/Users/zechengdai/workplace/svn/lct/dev';
var root = path.join(CWD, 'htdocs'); //todo 全局命令下,可设置为__dirname

module.exports = {
    root: root,  //根目录
    // port: 44444,  //http监听端口
    // sslPort: 8888,  //https监听端口
    urls: [
        {
            rule: /\/mock\/(.*)/,
            target: '~/workplace/mock/$1'
        },
        {
            rule: /\/assets\/js\/(.*)/,
            target: '~/workplace/svn/xboss/assets/js/$1'
        },
        {
            rule: /\/demo\/(.*)/,
            target: '~/workplace/demo/server/views/$1'
        },
        //node pre
        // {
        //     rule: /fund_act_fcg\/node\/act\.cgi/,
        //     target: 'http://10.49.118.12$'
        // },
        //线上
        // {
        //     rule: /action_acc_fcgi\.fcgi.*cmdname=([^&]*)&?.*/,
        //     target: 'http://183.61.51.104/$'
        // },
        // 预发
        // {
        //     rule: /action_acc_fcgi\.fcgi.*cmdname=([^&]*)&?.*/,
        //     target: 'http://10.49.118.12$'
        // },
        //本地
        // {
        //     rule: /action_acc_fcgi\.fcgi.*cmdname=([^&]*)&?.*/,
        //     target: '~/workplace/mock/act/$1.json'
        // },

        //小程序
        // {
        //     rule: /\/fund_act_fcg\/wxlp_acc_fcgi\.fcgi.*cmdname=([^&]*)&?.*/,
        //     target: '~/workplace/mock/act/$1.json'
        // },
        // 预发
        // {
        //     rule: /\/fund_act_fcg\/wxlp_acc_fcgi\.fcgi.*cmdname=([^&]*)&?.*/,
        //     target: 'http://10.49.118.12$'
        // },


        //vtools 预发
        // {
        //     rule: /^(\/resources\/.*)$/,
        //     target: 'http://10.49.118.12$'
        // },
        //vtools 线上
        {
            rule: /^(\/resources\/.*)$/,
            target: 'http://14.215.138.11$'
        },


        //预发
        // {
        //     rule: /\/app\/v2.0\/(.*).cgi(.*)/,
        //     target: 'http://10.49.118.12/$'
        // },
        //预发
        // {
        //     rule: /\/app\/v2.0\/(.*).cgi(.*)/,
        //     target: 'http://10.241.208.188/$'
        // },
        // {
        //     rule: /\/app\/v2.0\/(.*).cgi(.*)/,
        //     target: 'http://10.49.118.12/$'
        // },
        //本地
        // {
        //     rule: /\/finance_qt\//,
        //     target: '~/workplace/mock/qt.json'
        // },
        //线上
        // {
        //     rule: /\/app\/v2.0\/(.*).cgi(.*)/,
        //     target: 'http://14.215.138.11/$'
        // },
        //线上
        // {
        //     rule: /\/finance_qt\//,
        //     target: 'http://14.215.138.11/$'
        // },
        //本地
        // {
        //     rule: /\/app\/v2.0(.*).cgi(.*)/,
        //     target: '~/workplace/mock/appv2/$1.json'
        // },
        // {
        //     rule: /\/fund_act_fcg\/action_acc_fcgi.fcgi(.*)/,
        //     target: 'http://10.175.139.229/$'
        // },
        //预发
        // {
        //     rule: /\/weixin(\/.*)$/,
        //     target: 'http://10.49.118.12/weixin$'  //E:/svn/test/mock.json
        // }
        // 预发
        // {
        //     rule: /\/weixin\/weeklyprofit\/articles(\/.*)$/,
        //     target: 'http://10.49.118.12/$'  //E:/svn/test/mock.json
        // },
        // 预发
        // {
        //     rule: /\/weixin\/.*\.min\..*$/,
        //     target: function (origialUrl) {
        //         console.log('origialUrl', arguments);
        //         return root + origialUrl.replace('.min.','.');
        //     }
        //     // target: 'http://10.49.118.12/$'  //E:/svn/test/mock.json
        // },
        // {
        //     rule: /\/weixin\/weeklyprofit\/v23(\/.*)$/,
        //     target: function (origialUrl) {
        //         console.log('origialUrl', origialUrl.replace('.min.','.'));
        //         return root + origialUrl.replace('.min.','.');
        //     }
        // },
        // {
        //     rule: /(ms|server|mod)\.js*/,
        //     target: root + '$1'  //E:/svn/test/mock.json
        // },
        {
            rule: /(\/.*\.min\.(js|css)).*$/,
            target: function (origialPath) {
                var urlPath = origialPath.replace('.min.', '.');
                return path.join(CWD, urlPath);
            }
        },
        {
            rule: /^(\/.*)$/,
            target: root + '$'  //E:/svn/test/mock.json
        }
    ]
};

