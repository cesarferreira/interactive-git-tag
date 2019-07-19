'use strict';
const open = require('open');
const newGithubReleaseUrl = require('./new-github-release-url');
// const { getTagVersionPrefix } = require('.utils//utils');
const Utils = require('./utils');
const version = require('./version');

module.exports = async(options) => {
    const url = newGithubReleaseUrl({
        repoUrl: options.repoUrl,
        tag: options.newTag,
        body: options.releaseNotes,
        isPrerelease: version(options.version).isPrerelease()
    });

    await open(url);
};