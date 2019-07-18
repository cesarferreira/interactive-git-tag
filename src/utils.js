#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const log = console.log;
const semver = require('semver')
const version = require('./version');
const terminalLink = require('terminal-link');
const git = require('./git-util');

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
    printCommitLog: async(repoUrl) => {
        const latest = await git.latestTagOrFirstCommit();
        const commitLog = await git.commitLogFromRevision(latest);
        log(latest)
        log(commitLog)
        if (!commitLog) {
            return {
                hasCommits: false,
                releaseNotes: () => {}
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

        const history = commits.map(commit => {
            const commitMessage = self.linkifyIssues(repoUrl, commit.message);
            const commitId = self.linkifyCommit(repoUrl, commit.id);
            return `- ${commitMessage}  ${commitId}`;
        }).join('\n');

        const releaseNotes = nextTag => commits.map(commit =>
            `- ${commit.message}  ${commit.id}`
        ).join('\n') + `\n\n${repoUrl}/compare/${latest}...${nextTag}`;

        const commitRange = self.linkifyCommitRange(repoUrl, `${latest}...master`);

        log(`${chalk.bold('Commits:')}\n${history}\n\n${chalk.bold('Commit Range:')}\n${commitRange}\n`);

        return {
            hasCommits: true,
            releaseNotes
        };
    }

};