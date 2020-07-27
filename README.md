# xproxy

[![NPM version](https://img.shields.io/npm/v/xproxy.svg?style=flat)](https://www.npmjs.com/package/xproxy)
[![Build Status](https://secure.travis-ci.org/daizch/xproxy.svg?branch=master)](http://travis-ci.org/daizch/xproxy)

Proxy server implemented by Node.js

## Features
1. http&https server for serving static assets, could forward your request via `xproxy.conf.js` configuration file.
2. support `weinre` to debug mobile device

## Usage

### install

`install for project`:

```sh
$ npm install xproxy 
```

`global install`:

```sh
$ npm install xproxy -g
```

### proxy mapping rule

You could add or modify the mapping rule for proxy requests. 
To quickly create `xproxy.conf.js` boilerplate

```sh
$ xproxy init
```

### host binding
`host binding` means to bind the specific domain name to your localhost

//host
127.0.0.1 xx.demo.com

`recommendation of host binding tool`

- windows: [Hosts File Editor](https://hostsfileeditor.codeplex.com/)
- Mac: [gasmask](https://github.com/2ndalpha/gasmask)

### How to launch

Must run the cli below with the place where `xproxy.config.js` it is located

```sh
$ sudo xproxy server
```

## https

### prerequisite

- to generate customized certificate template for https
Must adjust the generated openssl.cnf according to your domain name

```sh
$ xproxy cert init
```

- to generate certificate after modifying openssl.cnf

```shell
$ xproxy cert
```

- to generate CA certificate

```sh
$ xproxy cert ca
```


#### installation

##### iOS
using safari to open `xproxy_ca.crt` in your phone. Then install it following the instructions.

You could access `${localIP}/xproxy_ca.crt` in your phone after you launch xproxy. Or you could use `${boundDomaiName}/xproxy_ca.crt` after you bind the domain name to your localhost in your host confi.

##### Mac
- double-click xproxy_ca.crt to trigger installation
- open `keychain Access` application after you finish installation. Find the certificate, right-click on the certificate and choose `Get Info`
- open `Trust` and change the config of `while using this certificate` into `always trust`


### default configuration
* the default port for http server is 80
* the default port for http server is 443
* by default, serve the current working directory

You could modify the default configuration at `xproxy.conf.js`

### parameter
| parameter | description |
| --- | --- |
| -r, --root | config root directory
| -p, --port | port for http server to listen
| -s, --ssl-port | port for https server to listen
| -S, --silent | silent mode
| -d, --debug | enable weinre mode

### mapping rule
* config urls in `xproxy.conf.js`, xproxy will return the match result once it match the rule. xproxy will manage to request production if no urls matched or no files found in local directory.
* rule: regex expression
* target：function or string
* headers: function or object, to support config headers of response
* you could set a unknow target if you want to forward the traffic to production server.

```javascript
module.exports = {
    urls: [
            {
                rule: /^\/xxx\/demo.js$/,   
                target: 'noop' 
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