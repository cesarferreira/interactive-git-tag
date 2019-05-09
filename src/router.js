#!/usr/bin/env node

// 'use strict';

const chalk = require('chalk');
const Utils = require('./utils/utils');
const log = console.log;
const ui = require('./utils/ui');

const LatestTagTask = require('./tasks/latest_tag_task');

async function areYouSureYouWantToPush(newTag) {
    const answersConfirmation = await ui.askForConfirmation(newTag)

    if (answersConfirmation['confirm']) {
        try {
            await Utils.pushNewTag(newTag, newTag) // TODO a message?
            ui.printTagPushSuccess(newTag)
        } catch (error) {
            log(error)
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

                                const latestTag = await Utils.getLatestTag()

                                log(`\nTag a new version of ${chalk.bold.magenta(Utils.getCurrentFolderName())} ${chalk.dim(`(current: ${latestTag})`)}\n`);
								
							const answers = await ui.askForValidNewTag(latestTag)

							await areYouSureYouWantToPush(answers['version'])
						})();
      }
    }
};