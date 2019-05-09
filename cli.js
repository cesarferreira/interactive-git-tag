#!/usr/bin/env node

'use strict';

const meow = require('meow');
const router = require('./src/router');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({ pkg }).notify();

const cli = meow(`
Usage

   $ git-tag-cli <command> <params>

   $ git-tag-cli sample <param>             # Uses the <PARAM>
   $ git-tag-cli other <param>              # Other the <PARAM>
   $ git-tag-cli another <param>            # Another the <PARAM>
   
 Examples

   $ git-tag-cli sample TEST                # Uses the TEST
   $ git-tag-cli sample YOLO                # Uses the YOLO
   $ git-tag-cli other YOLO                 # Uses the YOLO
   $ git-tag-cli another YOLO               # Uses the YOLO
`, {
    alias: {
        v: 'version'
    },
    boolean: ['version']
});

// if (cli.input.length > 0) {
router.init(cli.input, cli.flags);
// } else {
// cli.showHelp(2);
// }