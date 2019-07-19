#!/usr/bin/env node

'use strict';

const log = console.log;
const semver = require('semver')
const version = require('./version');
const terminalLink = require('terminal-link');
const git = require('./git-util');
const open = require('open');
const newGithubReleaseUrl = require('./new-github-release-url');

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
    getNextVersionFor: async(oldVersion, semVerType) => {
        return version(oldVersion).getNewVersionFrom(semVerType)
    },
    getLatestTag: async() => {
        try {
            return await getLatestTag()
        } catch (error) {
            return '0.0.0'
        }
    },
    pushNewTag: async(newVersion, message) => await pushNewTag(newVersion, message),
    linkifyCommitRange: (url, commitRange) => {
        if (!(url && terminalLink.isSupported)) {
            return commitRange;
        }

        return terminalLink(commitRange, `${url}/compare/${commitRange}`);
    },
    linkifyCommit: (url, commit) => {
        if (!(url && terminalLink.isSupported)) {
            return commit;
        }

        return terminalLink(commit, `${url}/commit/${commit}`);
    },
    linkifyIssues: (url, message) => {
        if (!(url && terminalLink.isSupported)) {
            return message;
        }

        return message.replace(issueRegex(), issue => {
            const issuePart = issue.replace('#', '/issues/');

            if (issue.startsWith('#')) {
                return terminalLink(issue, `${url}${issuePart}`);
            }

            return terminalLink(issue, `https://github.com/${issuePart}`);
        });
    },
    printCommitLog: async(repoUrl, oldTag, newTag) => {
        const commitLog = await git.commitLogFromRevision(oldTag);

        if (!commitLog) {
            return {
                hasCommits: false,
                releaseNotes: ""
            };
        }

        const commits = commitLog.split('\n')
            .map(commit => {
                const splitIndex = commit.lastIndexOf(' ');
                return {
                    message: commit.slice(0, splitIndex),
                    id: commit.slice(splitIndex + 1)
                };
            });

        const releaseNotes = commits.map(commit =>
            `- ${commit.id} ${commit.message}`
        ).join('\n') + `\n\n${repoUrl}/compare/${oldTag}...${newTag}`;

        return {
            hasCommits: true,
            releaseNotes
        };
    },

    releaseTaskHelper: async(options) => {
        const url = newGithubReleaseUrl({
            repoUrl: options.repoUrl,
            tag: options.newTag,
            body: options.releaseNotes,
            isPrerelease: version(options.newTag).isPrerelease()
        });

        await open(url);
    }

};