const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;
var isWin = (process.platform === 'win32' || process.platform === 'win64');

const HOME = process.env.HOME;
var CWD = process.cwd();

function getOpenSSLConfig() {
  var custom = path.join(CWD, 'openssl.cnf')

  return fs.existsSync(custom) ? custom : path.join(__dirname, 'openssl.cnf')
}

function generateCert(config) {
  var loc = path.join(HOME, '.xproxy', 'cert');
  var opts = {
    cwd: loc,
    stdio: [0, 1, 2]
  };

  if (config.android) {
    if (!fs.existsSync(loc)) {
      return console.error('尚无证书，请先使用xproxy cert生成证书', 'xproxy cert');
    } else if (!config.force) {
      return console.error('证书已存在，如有需要请加-f选项覆盖原证书', 'xproxy cert -af');
    }
    var subjectHash = execSync('openssl x509 -inform PEM -subject_hash -in server.crt | head -1', {cwd: loc}).toString().trim();
    var certName = subjectHash + '.0';
    if (fs.existsSync(path.join(loc, certName))) {
      return console.error('安卓版证书已存在，无需再次生成，如有需要请加-f选项覆盖原证书', 'xproxy cert -f');
    }
    execSync('cat server.crt > ' + certName, opts);
    execSync('openssl x509 -inform PEM -text -in server.crt >> ' + certName, opts);
    console.log('安卓版证书生成完毕，请将其安装到安卓设备上');
  } else {
    if (!config.force && fs.existsSync(loc)) {
      return console.error('证书已存在，如有需要请加-f选项覆盖原证书', 'xproxy cert -f');
    }

    var opensslConfig = getOpenSSLConfig();
    var openCnfPath = '"' + opensslConfig + '"'
    console.info('开始生成证书', 'xproxy cert');
    fs.removeSync(loc);
    fs.ensureDirSync(loc);

    if (isWin) {
      execSync('openssl genrsa -out server.key 4096', {cwd: loc});
      execSync('openssl rsa -in server.key -out server.key', {cwd: loc});
      execSync('openssl req -new -x509 -key server.key -out xproxy_ca.crt -days 365 -config ' + openCnfPath, {cwd: loc});
      execSync('openssl req -new -key server.key -out server.csr -config ' + openCnfPath, {cwd: loc});
      execSync('openssl x509 -req -days 365 -in server.csr -CA xproxy_ca.crt -CAkey server.key -CAcreateserial -out server.crt -extfile ' + openCnfPath, {cwd: loc});
    } else {
      // 生成根证书
      execSync('openssl genrsa -out xproxy_ca.key 4096', {cwd: loc});
      execSync('openssl req -new -out xproxy_ca.csr -key xproxy_ca.key -config ' + openCnfPath, {cwd: loc});
      execSync('openssl x509 -req -days 365 -sha256 -in xproxy_ca.csr -signkey xproxy_ca.key -out xproxy_ca.crt', {cwd: loc});
      // 生成server证书
      execSync('openssl genrsa -out server.key 4096', {cwd: loc});
      execSync('openssl req -new -out server.csr -key server.key -config ' + openCnfPath, {cwd: loc});
      execSync('openssl x509 -req -days 365 -sha256 -CA xproxy_ca.crt -CAkey xproxy_ca.key -CAcreateserial -in server.csr -out server.crt -extensions v3_req -extfile ' + openCnfPath, {cwd: loc});
    }
    fs.copySync(loc + '/xproxy_ca.crt', CWD + '/cert/xproxy_ca.crt');
    fs.copySync(loc + '/xproxy_ca.crt', HOME + '/xproxy_ca.crt');
    console.info('证书创建完毕，并已复制一份到<' + HOME + '/xproxy_ca.crt>', 'xproxy cert');
    console.info('将其添加到信任列表，之后删除', 'xproxy cert');
  }
}


function initOpenSSLConfig() {
  var tpl = path.join(__dirname, 'openssl.tpl.cnf')
  var to = path.join(CWD, 'openssl.cnf')

  fs.copySync(tpl, to);
  console.log('init openssl.cnf done')
}

function copyCAFiles() {
  var from = path.join(__dirname, '..', '..', 'cert')
  var to = path.join(CWD, 'cert')

  fs.copySync(from, to);
  console.log(`copy ca files into ${to}`)
}

module.exports = {
  generateCert: generateCert,
  initOpenSSLConfig: initOpenSSLConfig,
  copyCAFiles: copyCAFiles
};