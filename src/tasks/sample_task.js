#!/usr/bin/env node

'use strict';

const Chalk = require('chalk');
const log = console.log;
const fs = require('fs');
const Utils = require('../utils/utils');
const remoteGitTags = require('remote-git-tags');
const semverSort = require('semver-sort');
const origin = require('remote-origin-url');


function sanitizeRemote(remote) {
    // "git@github.com:cesarferreira/git-tag-cli.git"

    if (!remote.includes('git@')) return remote

    return 'github.com/' + remote.split(':')[1].replace('.git', '')
}

// Main code //
const self = module.exports = {
    init: input => {

        if (input.length == 0) {
            log(Chalk.red(`You need to specify a params`));
            return;
        }

        var remote = "";

        (async() => {
            let url = await origin();
            remote = sanitizeRemote(url)
            log(remote);
            // url => "https://github.com/jonschlinkert/remote-origin-url.git"
        })();

        remoteGitTags('github.com/GlueHome/common-android')
            .then(tags => {
                let versions = [...tags.keys()];
                // log(versions)
                semverSort.desc(versions);
                // log(versions)

                log(`Latest is: ${versions[0]}`)

            });

        // log(`sample task with: ${input[0]}`);
    }
};