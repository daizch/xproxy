# xproxy

[![NPM version](https://img.shields.io/npm/v/xproxy.svg?style=flat)](https://www.npmjs.com/package/xproxy)
[![Build Status](https://secure.travis-ci.org/daizch/xproxy.svg?branch=master)](http://travis-ci.org/daizch/xproxy)

前端代理服务器

## 功能
1. http&https静态资源代理服务器,通过配置文件xproxy.conf.js可设置转发
1. 支持weinre调试

## 用法

### install

`局部安装`:

```sh
$ npm install xproxy 
```

`全局安装`:

```sh
$ npm install xproxy -g
```

### 添加映射规则

`创建proxy.conf.js`:

```sh
$ xproxy init
```

在需要映射的目录下添加xproxy.conf.js,可执行上方的命令生成默认的xproxy.conf.js范例

在xproxy.conf.js里添加或修改映射的路径规则,可参考下文的映射规则用法

### 配置host
`host绑定`,将需要代理的域名映射到本机

//host
127.0.0.1 xx.demo.com

`hosts管理工具推荐`

- windows: [Hosts File Editor](https://hostsfileeditor.codeplex.com/)
- Mac: [gasmask](https://github.com/2ndalpha/gasmask)

### 启动
设置xproxy.conf.js里的root为自己的代码根目录,mac需要sudo执行


```sh
$ xproxy server
```


## 本地调试命令
```sh
$ npm start
```

另外一种启动方式,出错自动重启

```sh
$ npm i pm2 -g
$ npm run server
```

停止自动重启

```sh
$ npm run kill
```

## https

### 生成自定义的https配置模板
根据自身需要修改生成的openssl.cnf配置

```sh
$ xproxy cert init
```

### 生成证书

```shell
$ xproxy cert
```


### 获取ca文件

```sh
$ xproxy cert ca
```


### 安装

#### 移动端iOS
将xproxy_ca.crt在Safari中打开,进入安装,按手机提示进行操作。

可启动server后(npm start),在手机端访问`本机ip地址+/xproxy_ca.crt`,或者访问`绑定的域名+/xproxy_ca.crt`

#### Mac
- Mac上直接双击xproxy_ca.crt安装
- 进入到keychain后,右击证书,点击显示简介
- 展开`信任`列表,将`使用此证书时`选项设置为`始终相信`


### 默认设置
* http server默认监听80
* https server默认监听443
* server默认serv的根目录为当前启动目录。

可在xproxy.conf.js里进行修改以上默认值。

### 支持参数
| parameter | description |
| --- | --- |
| -r, --root | 设置root目录
| -p, --port | 设置http server监听端口
| -s, --ssl-port | 设置https server监听端口
| -S, --silent | 静默模式
| -d, --debug | 启动weinre调试模式

### 映射规则
* xproxy.conf.js里的urls进行设置，按序匹配，一旦匹配就返回。匹配不到或者本地找不到文件则请求线上。
* rule: 正则
* target：function or string
* 如果匹配不到或者本地无该文件,可通过返回noop或者qs中含noop的即可不走线上请求。

```javascript
module.exports = {
    urls: [
            {
                rule: /^/xxx/demo.js$/,   
                target: 'noop' //不走线上,直接404返回
            },
            {
                rule: /(\/dir.*)$/,
                target: '~/dev/$1'
            },

            //proxy forward
            {
                rule: /cgi.*cmdname=/,
                target: 'http://11.22.33.44/$'
            },

            {
                rule: /\/mock\/demo.cgi(.*)/,
                target: function(urlPath, match, host) {
                    return '~/mock/demo.json'
                }
            }
        ]
}
```


## last
有任何问题或者需求或建议,欢迎给我提~
