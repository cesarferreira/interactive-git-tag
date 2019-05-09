#!/usr/bin/env node

'use strict';

const Chalk = require('chalk');
const log = console.log;
const fs = require('fs');
const remoteGitTags = require('remote-git-tags');
const semverSort = require('semver-sort');
const origin = require('remote-origin-url');
const semver = require('semver')

function sanitizeRemote(remote) {
    if (!remote.includes('git@')) return remote
    return 'github.com/' + remote.split(':')[1].replace('.git', '')
}

Array.prototype.subarray = function(start, end) {
    if (!end) { end = -1; }
    return this.slice(start, this.length + 1 - (end * -1));
}

// Main code //
const self = module.exports = {
    isEmpty: obj => {
        return Object.keys(obj).length === 0;
    },
    saveToFile: (content, filePath) => {
        fs.writeFileSync(filePath, content, 'utf-8');
    },
    readFile: (content, filePath) => {
        fs.readFileSync(filePath, 'utf-8');
    },
    infoAbout: (version) => {
        return semver.parse(version)
    },
    getLatestTag: async() => {
        let url = await origin();
        log(url)
        const remote = sanitizeRemote(url)
        log(remote)
        const tags = await remoteGitTags(remote)
        log(tags)
        let versions = [...tags.keys()];

        if (versions.length == 0) {
            return '0.0.0'
        } else {
            semverSort.desc(versions);
            return versions[0]
        }
    }
};