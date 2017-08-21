<!--[RM_HEADING]-->
# devlog

<!--[]-->
<!--[RM_DESCRIPTION]-->
> A command line logging tool for recording thoughts/ideas/anything as a software developer (or anyone else who wants to write notes from the command line)

<!--[]-->

<!--[RM_BADGES]-->
[![NPM Version](https://img.shields.io/npm/v/devlog.svg?style=flat-square)](http://npm.im/devlog)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Coverage Status](https://coveralls.io/repos/github/uglow/devlog/badge.svg?branch=master)](https://coveralls.io/github/uglow/devlog?branch=master)
[![Dependencies status](https://david-dm.org/uglow/devlog/status.svg?theme=shields.io)](https://david-dm.org/uglow/devlog#info=dependencies)
[![Dev-dependencies status](https://david-dm.org/uglow/devlog/dev-status.svg?theme=shields.io)](https://david-dm.org/uglow/devlog#info=devDependencies)


<!--[]-->

<!--[RM_INSTALL]-->
## Install

    npm install -g devlog


<!--[]-->

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

<!--[RM_CONTRIBUTING]-->
## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).


<!--[]-->


<!--[RM_LICENSE]-->
## License

This software is licensed under the MIT Licence. See [LICENSE](LICENSE).

<!--[]-->

