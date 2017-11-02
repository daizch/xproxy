const path = require('path');
const CWD = process.cwd();

module.exports = {
    root: CWD,
    urls: [
        {
            rule: /(\/.*\.min\.(js|css)).*$/,
            target: function (origialPath) {
                var urlPath = origialPath.replace('.min.', '.');
                return path.join(CWD, urlPath);
            }
        },
        {
            rule: /^\/function\/(.*)$/,
            target: function (orginalPath, matches, host) {
                return orginalPath;
            }
        },
        {
            rule: /^(.*)$/,
            target: CWD + '$'
        }
    ]
};