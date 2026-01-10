#!/usr/bin/env node

import meow from 'meow';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { init } from './src/core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

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
    importMeta: import.meta,
    flags: {
        version: {
            type: 'boolean',
            shortFlag: 'v'
        }
    }
});

if (cli.input.length > 0 && cli.input[0] === "help") {
    cli.showHelp(2);
} else {
    init(cli.input, cli.flags);
}
