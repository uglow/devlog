# devlog

> A command line diary-entry tool for recording thoughts/ideas/anything from your terminal

[![NPM Version](https://img.shields.io/npm/v/devlog.svg?style=flat-square)](http://npm.im/devlog)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Coverage Status](https://coveralls.io/repos/github/uglow/devlog/badge.svg?branch=master)](https://coveralls.io/github/uglow/devlog?branch=master)
[![Dependencies status](https://david-dm.org/uglow/devlog/status.svg?theme=shields.io)](https://david-dm.org/uglow/devlog#info=dependencies)
[![Dev-dependencies status](https://david-dm.org/uglow/devlog/dev-status.svg?theme=shields.io)](https://david-dm.org/uglow/devlog#info=devDependencies)

## Install

    npm install -g devlog


## Usage

```
$ devlog -?

Usage: devlog <options>

devlog           Create a log entry in the global devlog
devlog -?        This help information
devlog -l        Create a log entry in the local devlog in the current directory
devlog -m "msg"  Add "msg" to the devlog in the current directory
devlog -p        Print the log from oldest-to-newest
devlog -pr       Print the log from newest-to-oldest

Global log location: /users/dknuth/devlog/devlog.md

$ devlog
Add log entry: (press Ctrl+C when finished)
> This is my first log entry
> Just found a cool fix for when PhantomJS doesn't start...
> [Ctrl+C]
Log saved to /users/dknuth/devlog/devlog.md

```

## Troubleshooting

### The date-stamp is in the wrong format!

The current version of `devlog` requires Node 14+, which contains the full set of
Internationalisation Components for Unicode (ICU). However, it is possible to 
install Node 14+ **without** Full ICU support. In this case, the default locale (en-US?)
is used by Node, even when `devlog` detects the operating system's actual locale.

To fix this, ensure you install Node 14+ **with full ICU support** (the default build).
Alternatively, you can try installing the [full-icu](https://www.npmjs.com/package/full-icu)
package (which has instructions for getting it working).


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).


## License

This software is licensed under the MIT Licence. See [LICENSE](LICENSE).
