#!/usr/bin/env node

// 'use strict';

const chalk = require('chalk');
const Utils = require('./utils/utils');
const log = console.log;
const ui = require('./utils/ui');
const ora = require('ora');

const LatestTagTask = require('./tasks/latest_tag_task');

async function areYouSureYouWantToPush(newTag, message) {
    const answersConfirmation = await ui.askForConfirmation(newTag)

    log("")
    if (answersConfirmation['confirm']) {
        const spinner = ora(`Pushing ${chalk.bold.green(newTag)}`).start();
        try {
            await Utils.pushNewTag(newTag, message)
            spinner.succeed(ui.tagPushSuccessMessage(newTag))
        } catch (error) {
            spinner.fail(error)
        }
    } else {
        ui.failsToConfirm()
    }
}

async function getNextVersionFor(semVerType) {
    const latest = await Utils.getLatestTag();
    return version(latest).getNewVersionFrom(semVerType)
}

// Main code //
const self = module.exports = {
    init: (input, flags) => {

        const command = input[0] || "";
        const params = input.subarray(1, input.length);

        switch (command.toLowerCase()) {
            case 'latest':
                LatestTagTask.init(params);
                break;
            case 'major':
            case 'minor':
            case 'patch':
            case 'prepatch':
            case 'preminor':
            case 'premajor':
            case 'prerelease':
                (async() => {
                    const nextOne = await getNextVersionFor(command.toLowerCase())
                    areYouSureYouWantToPush(nextOne)
                })();

                break;
            case 'about':
                ui.printAbout()
                break;
            case 'help':
                log(`HELP TODO`);
                break;
            case 'version':
                log(`HELP TODO`);
                break;
            default:

                (async() => {

                    var latestTag = await Utils.getLatestTag()
                    ui.initialPrompt(latestTag)

                    const { newTag, message } = await ui.askForValidNewTag(latestTag);
                    await areYouSureYouWantToPush(newTag, message)
                })()
        }
    }
};