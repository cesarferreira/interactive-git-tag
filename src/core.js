import chalk from 'chalk';
import ora from 'ora';
import githubUrlFromGit from 'github-url-from-git';
import gitRemoteOriginUrl from 'git-remote-origin-url';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Utils from './utils.js';
import * as ui from './ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const log = console.log;

async function areYouSureYouWantToPush(oldVersion, newTag, message) {
    const answersConfirmation = await ui.askForConfirmation(oldVersion, newTag);

    log();
    if (answersConfirmation.confirm) {
        const spinner = ora(`Pushing ${chalk.bold.green(newTag)}`).start();
        try {
            await Utils.pushNewTag(newTag, message);
            spinner.succeed(ui.tagPushSuccessMessage(newTag));
            return true;
        } catch (error) {
            spinner.fail(error.message || error);
            return false;
        }
    } else {
        ui.failsToConfirm();
        return false;
    }
}

async function createRelease(oldTag, newTag) {
    const remote = await gitRemoteOriginUrl();
    const repoUrl = githubUrlFromGit(remote);
    const { hasCommits, releaseNotes } = await Utils.printCommitLog(
        repoUrl,
        oldTag,
        newTag
    );

    const options = {
        oldTag,
        newTag,
        repoUrl,
        hasCommits,
        releaseNotes
    };

    await Utils.releaseTaskHelper(options);
}

async function getReleaseNotes(oldTag, newTag) {
    const remote = await gitRemoteOriginUrl();
    const repoUrl = githubUrlFromGit(remote);
    const { hasCommits, releaseNotes } = await Utils.printCommitLog(
        repoUrl,
        oldTag,
        newTag
    );

    return releaseNotes;
}

export function init(input, flags) {
    const command = input[0] || "";
    const params = input.slice(1);
    const firstParameter = command.toLowerCase();

    switch (firstParameter) {
        case "major":
        case "minor":
        case "patch":
        case "prepatch":
        case "preminor":
        case "premajor":
        case "prerelease":
            (async () => {
                const oldTag = await Utils.getLatestTag();
                const newTag = await Utils.getNextVersionFor(oldTag, firstParameter);

                log();
                log(chalk.white.bold("Commits:"));
                const releaseNotes = await getReleaseNotes(await Utils.getLatestTag(), newTag);
                log(releaseNotes.substring(0, releaseNotes.lastIndexOf("\n")));

                const confirmed = await areYouSureYouWantToPush(
                    oldTag,
                    newTag,
                    newTag
                );
                if (confirmed) await createRelease(oldTag, newTag);
            })();
            break;
        case "about":
            ui.printAbout();
            break;
        case "version":
            log(`Current version is ${chalk.green(pkg.version)}`);
            break;

        case "commits":
        case "releasenotes":
        case "notes":
            (async () => {
                let from = '';
                let to = '';

                if (params.length < 1) {
                    from = await Utils.getLatestTag();
                    to = "HEAD";
                } else if (params.length === 1) {
                    from = params[0];
                    to = "HEAD";
                } else {
                    from = params[0];
                    to = params[1];
                }

                try {
                    const releaseNotes = await getReleaseNotes(from, to);

                    log();
                    if (releaseNotes === "") {
                        log(chalk.yellow.bold(`No commits between ${from} and ${to}`));
                    } else {
                        log(chalk.white.bold("Commits:"));
                        log(releaseNotes);
                    }
                } catch (error) {
                    log(error.stderr || error.message || error);
                }
            })();
            break;
        default:
            (async () => {
                const oldTag = await Utils.getLatestTag();
                ui.initialPrompt(oldTag);

                const releaseNotes = await getReleaseNotes(await Utils.getLatestTag(), "HEAD");

                if (releaseNotes === "") {
                    log(chalk.yellow.bold("No commits since the last tag"));
                } else {
                    log(chalk.white.bold("Commits:"));
                }
                log(releaseNotes.substring(0, releaseNotes.lastIndexOf("\n")));

                const { newTag, message } = await ui.askForValidNewTag(oldTag);
                const confirmed = await areYouSureYouWantToPush(
                    oldTag,
                    newTag,
                    message
                );
                if (confirmed) await createRelease(oldTag, newTag);
            })();
    }
}
