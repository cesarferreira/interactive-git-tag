import semver from 'semver';
import terminalLink from 'terminal-link';
import open from 'open';
import { simpleGit } from 'simple-git';
import { createVersion } from './version.js';
import * as git from './git-util.js';
import newGithubReleaseUrl from './new-github-release-url.js';

const gitClient = simpleGit();

export async function getLatestTag() {
    try {
        const tags = await gitClient.tags();
        if (tags.all.length === 0) {
            return '0.0.0';
        }
        // Get the latest tag (last in the list)
        const latestTag = tags.latest || tags.all[tags.all.length - 1];
        return latestTag;
    } catch (error) {
        return '0.0.0';
    }
}

export async function pushNewTag(newTag, message) {
    await gitClient.addAnnotatedTag(newTag, message);
    await gitClient.pushTags();
}

export function infoAboutTag(tag) {
    return semver.parse(tag);
}

export function getCurrentFolderName() {
    return [...process.cwd().split("/")].reverse()[0];
}

export async function getNextVersionFor(oldVersion, semVerType) {
    return createVersion(oldVersion).getNewVersionFrom(semVerType);
}

export function linkifyCommitRange(url, commitRange) {
    if (!(url && terminalLink.isSupported)) {
        return commitRange;
    }

    return terminalLink(commitRange, `${url}/compare/${commitRange}`);
}

export function linkifyCommit(url, commit) {
    if (!(url && terminalLink.isSupported)) {
        return commit;
    }

    return terminalLink(commit, `${url}/commit/${commit}`);
}

export function linkifyIssues(url, message) {
    if (!(url && terminalLink.isSupported)) {
        return message;
    }

    // Simple issue regex pattern
    const issuePattern = /#(\d+)/g;
    return message.replace(issuePattern, (issue) => {
        const issuePart = issue.replace('#', '/issues/');
        return terminalLink(issue, `${url}${issuePart}`);
    });
}

export async function printCommitLog(repoUrl, oldTag, newTag) {
    const commitLog = await git.commitLogFromRevision(oldTag);

    if (!commitLog) {
        return {
            hasCommits: false,
            releaseNotes: ""
        };
    }

    const commits = commitLog.split('\n')
        .map(commit => {
            const splitIndex = commit.lastIndexOf(' ');
            return {
                message: commit.slice(0, splitIndex),
                id: commit.slice(splitIndex + 1)
            };
        });

    const releaseNotes = commits.map(commit =>
        `- ${commit.id} ${commit.message}`
    ).join('\n') + `\n\n${repoUrl}/compare/${oldTag}...${newTag}`;

    return {
        hasCommits: true,
        releaseNotes
    };
}

export async function releaseTaskHelper(options) {
    const url = newGithubReleaseUrl({
        repoUrl: options.repoUrl,
        tag: options.newTag,
        body: options.releaseNotes,
        isPrerelease: createVersion(options.newTag).isPrerelease()
    });

    await open(url);
}

// Add subarray helper to Array prototype if needed
if (!Array.prototype.subarray) {
    Array.prototype.subarray = function(start, end) {
        if (!end) { end = -1; }
        return this.slice(start, this.length + 1 - (end * -1));
    };
}
