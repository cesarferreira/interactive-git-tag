#!/usr/bin/env node

// 'use strict';

const Chalk = require('chalk');
const log = console.log;
const fs = require('fs');
const Utils = require('../utils/utils');

// Main code //
const self = module.exports = {
    init: input => {

        (async() => {
            var latest = await Utils.getLatestTag()
            log(`Latest tag is ${Chalk.green(latest)}`)
        })();

    }
};