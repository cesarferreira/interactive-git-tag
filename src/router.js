#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const Utils = require('./utils/utils');
const log = console.log;
const semver = require('semver')

const LatestTagTask = require('./tasks/latest_tag_task');

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
                        break;
                    case 'minor':
                        break;
                    case 'patch':
                        (async() => {
                            var latest = await Utils.getLatestTag()
                                // log(semver.inc(latest, 'major'))
                                // log(semver.major(latest))
                            log(Utils.infoAbout(latest))
                        })();


                        break;

                    default:

                        (async() => {
                                var latest = await Utils.getLatestTag()
                                    // log(semver.inc(latest, 'major'))
                                    // log(semver.major(latest))
                                const currentFolderName = [...process.cwd().split("/")].reverse()[0]
                                    // log(currentFolderName)
                                log(`\nPublish a new version of ${chalk.bold.magenta(currentFolderName)} ${chalk.dim(`(current: ${latest})`)}\n`);
						})();

                    // log(`Sorry, cant find ${command}`);
        }
    }
};