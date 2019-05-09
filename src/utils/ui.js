#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const log = console.log;
const inquirer = require('inquirer');
const prettyVersionDiff = require('./pretty-version-diff');
const version = require('./version');

// Main code //
const self = module.exports = {

    askForConfirmation: async(newVersion) => {
        return inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `You sure you want to push ${chalk.bold.green(newVersion)} ?`,
            default: true
        }]);
    },
    failsToConfirm: () => {
        log(`\n${chalk.bold.yellow("Thanks for wasting my time 😪")}\n`);
    },
    printAbout: () => {
        log(`\n ${chalk.bold.white('Made with ❤ by')} ${chalk.bold.green('http://cesarferreira.com')}`);
    },
    printTagPushSuccess: async(newVersion) => {
        log(`\n ${chalk.bold.white(Utils.getCurrentFolderName())} ${chalk.bold.green(newVersion)} published 🎉`);
    },
    askForValidNewTag: async(oldVersion) => {
        const prompts = [{
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

        return inquirer.prompt(prompts);
    }
};