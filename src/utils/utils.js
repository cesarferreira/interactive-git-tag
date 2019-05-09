#!/usr/bin/env node

'use strict';

const Chalk = require('chalk');
const log = console.log;
const fs = require('fs');
const semver = require('semver')

var gitTag = require('git-tag')({ localOnly: true, dir: `${__dirname}/.git` })

Array.prototype.subarray = function(start, end) {
    if (!end) { end = -1; }
    return this.slice(start, this.length + 1 - (end * -1));
}

function getLatestTag() {
    return new Promise((resolve, reject) => {
        gitTag.latest((err, res) => {
            if (err) reject(err)
            else resolve(res)

        })
    })
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
    infoAboutTag: (tag) => semver.parse(tag),
    getLatestTag: async() => {
        try {
            return await getLatestTag()
        } catch (error) {
            return '0.0.0'
        }
    }
};