#!/usr/bin/env node

const chalk = require('chalk');
const Utils = require('./utils');
const log = console.log;
const ui = require('./ui');
const ora = require('ora');
const pkg = require('../package.json');
const releaseTaskHelper = require('./release-task-helper');
const githubUrlFromGit = require('github-url-from-git');
const gitRemoteOriginUrl = require('git-remote-origin-url');

async function areYouSureYouWantToPush(oldVersion, newTag, message) {
    const answersConfirmation = await ui.askForConfirmation(oldVersion, newTag)

    log()
    if (answersConfirmation['confirm']) {
        const spinner = ora(`Pushing ${chalk.bold.green(newTag)}`).start();
        try {
            // TODO DELETE ME
            // await Utils.pushNewTag(newTag, message)
            spinner.succeed(ui.tagPushSuccessMessage(newTag))
        } catch (error) {
            spinner.fail(error)
        }
    } else {
        ui.failsToConfirm()
    }
}

async function createRelease(oldTag, newTag) {

    const remote = await gitRemoteOriginUrl()
    const repoUrl = githubUrlFromGit(remote)
    const theLog = await Utils.printCommitLog(repoUrl)

    const options = {
        oldTag,
        newTag,
        repoUrl,
        hasCommits: theLog.hasCommits,
        releaseNotes: theLog.releaseNotes(oldTag)
    }

    // log(options.releaseNotes)
    releaseTaskHelper(options)
}



// Main code //
module.exports = {
    init: (input, flags) => {

        const command = input[0] || "";
        const params = input.subarray(1, input.length);

        switch (command.toLowerCase()) {
            case 'major':
            case 'minor':
            case 'patch':
            case 'prepatch':
            case 'preminor':
            case 'premajor':
            case 'prerelease':
                (async() => {
                    const oldTag = await Utils.getLatestTag()
                    const newTag = await Utils.getNextVersionFor(oldTag, command.toLowerCase())
                    await areYouSureYouWantToPush(oldTag, newTag, newTag)
                })();
                break;
            case 'about':
                ui.printAbout()
                break;
            case 'try':

                (async() => {
                    const remote = await gitRemoteOriginUrl()
                    const repoUrl = githubUrlFromGit(remote)
                    const theLog = await Utils.printCommitLog(repoUrl)

                    // const oldTag = "v0.3.0"
                    // const newTag = "v0.4.2"
                    const oldTag = await Utils.getLatestTag()
                    const newTag = "1.0.0" //await Utils.getNextVersionFor(oldTag, command.toLowerCase())

                    const options = {
                        oldTag,
                        newTag,
                        repoUrl,
                        hasCommits: theLog.hasCommits,
                        releaseNotes: theLog.releaseNotes(oldTag)
                    }

                    log(options.releaseNotes)
                    releaseTaskHelper(options)
                })();
                break;
            case 'version':
                log(`Current version is ${Chalk.green(pkg.version)}`)
                break;
            default:
                (async() => {
                    var oldVersion = await Utils.getLatestTag()
                    ui.initialPrompt(oldVersion)
                    const { newTag, message } = await ui.askForValidNewTag(oldVersion);
                    await areYouSureYouWantToPush(oldVersion, newTag, message)
                })()
        }
    }
};