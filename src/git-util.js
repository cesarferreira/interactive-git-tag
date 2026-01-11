import { execa } from 'execa';
import escapeStringRegexp from 'escape-string-regexp';
import { verifyRequirementSatisfied } from './version.js';

export async function latestTag() {
    const { stdout } = await execa('git', ['describe', '--abbrev=0', '--tags']);
    return stdout;
}

async function firstCommit() {
    const { stdout } = await execa('git', ['rev-list', '--max-parents=0', 'HEAD']);
    return stdout;
}

export async function latestTagOrFirstCommit() {
    let latest;
    try {
        // In case a previous tag exists, we use it to compare the current repo status to.
        latest = await latestTag();
    } catch (_) {
        // Otherwise, we fallback to using the first commit for comparison.
        latest = await firstCommit();
    }

    return latest;
}

export async function currentBranch() {
    const { stdout } = await execa('git', ['symbolic-ref', '--short', 'HEAD']);
    return stdout;
}

export async function hasUpstream() {
    const escapedCurrentBranch = escapeStringRegexp(await currentBranch());
    const { stdout } = await execa('git', ['status', '--short', '--branch', '--porcelain']);

    return new RegExp(String.raw`^## ${escapedCurrentBranch}\.\.\..+\/${escapedCurrentBranch}`).test(stdout);
}

export async function verifyCurrentBranchIsMaster() {
    if (await currentBranch() !== 'master') {
        throw new Error('Not on `master` branch. Use --any-branch to publish anyway.');
    }
}

export async function isWorkingTreeClean() {
    try {
        const { stdout: status } = await execa('git', ['status', '--porcelain']);
        if (status !== '') {
            return false;
        }

        return true;
    } catch (_) {
        return false;
    }
}

export async function verifyWorkingTreeIsClean() {
    if (!(await isWorkingTreeClean())) {
        throw new Error('Unclean working tree. Commit or stash changes first.');
    }
}

export async function isRemoteHistoryClean() {
    let history;
    try { // Gracefully handle no remote set up.
        const { stdout } = await execa('git', ['rev-list', '--count', '--left-only', '@{u}...HEAD']);
        history = stdout;
    } catch (_) {}

    if (history && history !== '0') {
        return false;
    }

    return true;
}

export async function verifyRemoteHistoryIsClean() {
    if (!(await isRemoteHistoryClean())) {
        throw new Error('Remote history differs. Please pull changes.');
    }
}

export async function verifyRemoteIsValid() {
    try {
        await execa('git', ['ls-remote', 'origin', 'HEAD']);
    } catch (error) {
        throw new Error(error.stderr.replace('fatal:', 'Git fatal error:'));
    }
}

export async function fetch() {
    await execa('git', ['fetch']);
}

export async function tagExistsOnRemote(tagName) {
    try {
        const { stdout: revInfo } = await execa('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tagName}`]);

        if (revInfo) {
            return true;
        }

        return false;
    } catch (error) {
        // Command fails with code 1 and no output if the tag does not exist, even though `--quiet` is provided
        // https://github.com/sindresorhus/np/pull/73#discussion_r72385685
        if (error.stdout === '' && error.stderr === '') {
            return false;
        }

        throw error;
    }
}

export async function verifyTagDoesNotExistOnRemote(tagName) {
    if (await tagExistsOnRemote(tagName)) {
        throw new Error(`Git tag \`${tagName}\` already exists.`);
    }
}

export async function commitLogFromRevision(revision) {
    try {
        const { stdout } = await execa('git', ['log', '--format=%s %h', `${revision}..HEAD`]);
        return stdout;
    } catch (error) {
        return "";
    }
}

export async function push() {
    await execa('git', ['push', '--follow-tags']);
}

export async function deleteTag(tagName) {
    await execa('git', ['tag', '--delete', tagName]);
}

export async function removeLastCommit() {
    await execa('git', ['reset', '--hard', 'HEAD~1']);
}

async function gitVersion() {
    const { stdout } = await execa('git', ['version']);
    return stdout.match(/git version (\d+\.\d+\.\d+).*/)[1];
}

export async function verifyRecentGitVersion() {
    const installedVersion = await gitVersion();

    verifyRequirementSatisfied('git', installedVersion);
}
