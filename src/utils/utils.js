#!/usr/bin/env node

'use strict';

const Chalk = require('chalk');
const log = console.log;
const semver = require('semver')

var gitTag = require('git-tag')({ localOnly: false, dir: `${process.cwd()}/.git` })

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

function pushNewTag(newTag, message) {
    return new Promise((resolve, reject) => {
        gitTag.create(newTag, message, (err, res) => {
            if (err) reject(err)
            else resolve(res)
        })
    })
}

// Main code //
const self = module.exports = {
    infoAboutTag: (tag) => semver.parse(tag),
    getCurrentFolderName: () => [...process.cwd().split("/")].reverse()[0],
    getLatestTag: async() => {
        try {
            return await getLatestTag()
        } catch (error) {
            return '0.0.0'
        }
    },
    pushNewTag: async(newVersion, message) => await pushNewTag(newVersion, message)

};