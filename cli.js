#!/usr/bin/env node

'use strict';

const meow = require('meow');
const core = require('./src/core');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({ pkg }).notify();

const cli = meow(`
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
    $ tag notes               # shows the list of commits since the last tag was pushed
    $ tag commits             # shows the list of commits since the last tag was pushed
    $ tag notes 0.5.1 1.0.0   # shows the list of commits between 0.5.1 and 1.0.0
    $ tag notes 0.5.1         # shows the list of commits between 0.5.1 and HEAD
  
`, {
    alias: {
        v: 'version'
    },
    boolean: ['version']
});

if (cli.input.length > 0 && cli.input[0] == "help") {
    cli.showHelp(2);
} else {
    core.init(cli.input, cli.flags);
}