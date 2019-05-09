#!/usr/bin/env node

// 'use strict';

const chalk = require('chalk');
const Utils = require('./utils/utils');
const log = console.log;
const inquirer = require('inquirer');
const version = require('./version');
const prettyVersionDiff = require('./pretty-version-diff');

const LatestTagTask = require('./tasks/latest_tag_task');

async function confirm(version) {
    const answersConfirmation = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `You sure you want to push ${chalk.bold.green(version)} ?`,
        default: true
    }]);

    if (answersConfirmation['confirm']) {
        const url = "https://github.com/sindresorhus/np/releases/tag/v5.0.1"
        log(`\n ${chalk.bold.white(Utils.getCurrentFolderName())} ${chalk.bold.green(version)} published 🎉`);
        // log(`\n ${chalk.bold.white(url)}\n`);
    } else {
        log(`\n${chalk.bold.yellow("Thanks for wasting my time 😪")}\n`);
    }
    // log(answersConfirmation)
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
                        (async() => {
                            const nextOne = await getNextVersionFor(command.toLowerCase())
                            confirm(nextOne)
                        })();

                        break;
                    case 'about':
                        log(`\n ${chalk.bold.white('Made with ❤ by')} ${chalk.bold.green('http://cesarferreira.com')}`);
                        break;
                    case 'help':
                        log(`HELP TODO`);
                        break;
                    case 'version':
                        log(`HELP TODO`);
                        break;
                    default:

                        (async() => {
                                var oldVersion = await Utils.getLatestTag()
                                log(`\nTag a new version of ${chalk.bold.magenta(Utils.getCurrentFolderName())} ${chalk.dim(`(current: ${oldVersion})`)}\n`);
								
							const prompts = [
								{
									type: 'list',
									name: 'version',
									message: 'Select semver increment or specify new version',
									pageSize: version.SEMVER_INCREMENTS.length + 2,
									choices: version.SEMVER_INCREMENTS
										.map(inc => ({
											name: `${inc} 	${prettyVersionDiff(oldVersion, inc)}`,
											value: inc
										}))
										.concat([
											new inquirer.Separator(),
											{
												name: 'Other (specify)',
												value: null
											}
										]),
									filter: input => version.isValidInput(input) ? version(oldVersion).getNewVersionFrom(input) : input
								},
								{
									type: 'input',
									name: 'version',
									message: 'Version',
									when: answers => !answers.version,
									filter: input => version.isValidInput(input) ? version(oldVersion).getNewVersionFrom(input) : input,
									validate: input => {
										if (!version.isValidInput(input)) {
											return 'Please specify a valid semver, for example, `1.2.3`. See http://semver.org';
										}

										if (version(oldVersion).isLowerThanOrEqualTo(input)) {
											return `Version must be greater than ${oldVersion}`;
										}

										return true;
									}
								}
							]

							log(version.SEMVER_INCREMENTS)
							const answers = await inquirer.prompt(prompts);

								await confirm(answers['version'])

						})();
      }
    }
};