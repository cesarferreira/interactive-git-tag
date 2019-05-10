<!-- # git-tag-cli -->
# Interactive Git Tag

> Interactive tool that helps with your git tagging by suggesting versions

<p align="center">
  <img src="extra/animation.gif" width="100%" />
</p>

[![Build Status](https://travis-ci.org/cesarferreira/git-tag-cli.svg?branch=master)](https://travis-ci.org/cesarferreira/git-tag-cli)
[![npm](https://img.shields.io/npm/dt/git-tag-cli.svg)](https://www.npmjs.com/package/git-tag-cli)
[![npm](https://img.shields.io/npm/v/git-tag-cli.svg)](https://www.npmjs.com/package/git-tag-cli)

## Install

```sh
$ npm install -g git-tag-cli
```

## Usage

```
Usage

    $ tag <version>

    Version can be:
      patch | minor | major | prepatch | preminor | premajor | prerelease
 
 Examples

    $ tag
    $ tag patch
    $ tag major
    $ tag prepatch
    $ tag premajor
    $ tag prerelease
    
```

## Interactive UI

Run `tag` without arguments to launch the interactive UI that guides you through pushing a new tag.

<img src="extra/ss.png" width="100%">


## Shoutout

Inspired by the amazing [sindresorhus](https://github.com/sindresorhus)'s [np](https://github.com/sindresorhus/np) - A better `npm publish` tool

## Maintainers

- [Cesar Ferreira](http://cesarferreira.com)

## License

MIT