#!/usr/bin/env node

'use strict';

const Chalk = require('chalk');
const log = console.log;
const fs = require('fs');
const semver = require('semver')

// Main code //
const self = module.exports = {

    getLatestTag: async() => {
        try {
            return await getLatestTag()
        } catch (error) {
            return '0.0.0'
        }
    }
};