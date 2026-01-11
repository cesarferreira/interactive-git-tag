import chalk from 'chalk';
import { select, input, confirm, Separator } from '@inquirer/prompts';
import prettyVersionDiff from './pretty-version-diff.js';
import { createVersion, SEMVER_INCREMENTS, isValidInput } from './version.js';
import { getCurrentFolderName } from './utils.js';

const log = console.log;

// Helper to handle graceful exit on Ctrl+C
function handlePromptError(error) {
    // Check by error name since ExitPromptError may not be directly importable
    if (error.name === 'ExitPromptError' || error.message?.includes('force closed')) {
        log('\n');
        process.exit(0);
    }
    throw error;
}

export async function askForConfirmation(oldVersion, newVersion) {
    try {
        const result = await confirm({
            message: `Will bump from ${chalk.bold.green(oldVersion)} to ${chalk.bold.green(newVersion)}. Continue?`,
            default: true
        });
        return { confirm: result };
    } catch (error) {
        handlePromptError(error);
    }
}

export function failsToConfirm() {
    log(`\n${chalk.bold.yellow("Thanks for wasting my time")}\n`);
}

export function printAbout() {
    log(`\n ${chalk.bold.white('Made with love by')} ${chalk.bold.green('http://cesarferreira.com')}`);
}

export function initialPrompt(latestTag) {
    const currentFolderName = chalk.bold.magenta(getCurrentFolderName());
    const currentVersion = chalk.dim(`(current: ${latestTag})`);
    log(`\nTag a new version of ${currentFolderName} ${currentVersion}\n`);
}

export function tagPushSuccessMessage(newVersion) {
    return `${chalk.bold.white(getCurrentFolderName())} ${chalk.bold.green(newVersion)} published`;
}

export async function askForValidNewTag(oldVersion) {
    try {
        const choices = SEMVER_INCREMENTS.map(inc => ({
            name: `${inc} \t${prettyVersionDiff(oldVersion, inc)}`,
            value: inc
        }));

        choices.push(new Separator());
        choices.push({
            name: 'Other (specify)',
            value: 'other'
        });

        const selectedVersion = await select({
            message: 'Select semver increment or specify new version',
            choices,
            pageSize: SEMVER_INCREMENTS.length + 2
        });

        let newTag;

        if (selectedVersion === 'other') {
            newTag = await input({
                message: 'Version',
                validate: (inputValue) => {
                    if (!isValidInput(inputValue)) {
                        return 'Please specify a valid semver, for example, `1.2.3`. See http://semver.org';
                    }

                    if (createVersion(oldVersion).isLowerThanOrEqualTo(inputValue)) {
                        return `Version must be greater than ${oldVersion}`;
                    }

                    return true;
                }
            });
            // If it's a semver increment, compute the new version
            if (SEMVER_INCREMENTS.includes(newTag)) {
                newTag = createVersion(oldVersion).getNewVersionFrom(newTag);
            }
        } else {
            newTag = createVersion(oldVersion).getNewVersionFrom(selectedVersion);
        }

        const message = await input({
            message: 'What message should the tag have',
            default: newTag
        });

        return {
            newTag,
            message
        };
    } catch (error) {
        handlePromptError(error);
    }
}
