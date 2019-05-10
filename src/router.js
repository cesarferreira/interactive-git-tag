#!/usr/bin/env node

const chalk = require('chalk');
const Utils = require('./utils/utils');
const log = console.log;
const ui = require('./utils/ui');
const ora = require('ora');
const pkg = require('../package.json');

async function areYouSureYouWantToPush(oldVersion, newTag, message) {
    const answersConfirmation = await ui.askForConfirmation(oldVersion, newTag)

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

// Main code //
const self = module.exports = {
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