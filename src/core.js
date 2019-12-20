#!/usr/bin/env node

const chalk = require("chalk");
const Utils = require("./utils");
const log = console.log;
const ui = require("./ui");
const ora = require("ora");
const pkg = require("../package.json");
const githubUrlFromGit = require("github-url-from-git");
const gitRemoteOriginUrl = require("git-remote-origin-url");

async function areYouSureYouWantToPush(oldVersion, newTag, message) {
    const answersConfirmation = await ui.askForConfirmation(oldVersion, newTag);

    log();
    if (answersConfirmation["confirm"]) {
        const spinner = ora(`Pushing ${chalk.bold.green(newTag)}`).start();
        try {
            await Utils.pushNewTag(newTag, message);
            spinner.succeed(ui.tagPushSuccessMessage(newTag));
            return true;
        } catch (error) {
            spinner.fail(error);
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

// Main code //
module.exports = {
    init: (input, flags) => {
        const command = input[0] || "";
        const params = input.subarray(1, input.length);

        switch (command.toLowerCase()) {
            case "major":
            case "minor":
            case "patch":
            case "prepatch":
            case "preminor":
            case "premajor":
            case "prerelease":
                (async() => {
                    const oldTag = await Utils.getLatestTag();
                    const newTag = await Utils.getNextVersionFor(
                        oldTag,
                        command.toLowerCase()
                    );

                    log()
                    log(chalk.white.bold("Commits:"))
                    const releaseNotes = await getReleaseNotes(await Utils.getLatestTag(), newTag)
                    log(releaseNotes.substring(0, releaseNotes.lastIndexOf("\n")))

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
                (async() => {
                    const releaseNotes = await getReleaseNotes(await Utils.getLatestTag(), "HEAD")

                    log()
                    log(chalk.white.bold("Commits:"))
                    log(releaseNotes)
                })();
                break;
            default:
                (async() => {
                    var oldTag = await Utils.getLatestTag();
                    ui.initialPrompt(oldTag);

                    log(chalk.white.bold("Commits:"))
                    const releaseNotes = await getReleaseNotes(await Utils.getLatestTag(), "HEAD")
                    log(releaseNotes.substring(0, releaseNotes.lastIndexOf("\n")))

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
};