import semver from 'semver';

export const SEMVER_INCREMENTS = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];
export const PRERELEASE_VERSIONS = ['prepatch', 'preminor', 'premajor', 'prerelease'];

class Version {
    constructor(version) {
        this.version = version;
    }

    isPrerelease() {
        return Boolean(semver.prerelease(this.version));
    }

    satisfies(range) {
        validate(this.version);
        return semver.satisfies(this.version, range, {
            includePrerelease: true
        });
    }

    getNewVersionFrom(input) {
        validate(this.version);
        if (!isValidInput(input)) {
            throw new Error(`Version should be either ${SEMVER_INCREMENTS.join(', ')} or a valid semver version.`);
        }

        return SEMVER_INCREMENTS.includes(input) ? semver.inc(this.version, input) : input;
    }

    isGreaterThanOrEqualTo(otherVersion) {
        validate(this.version);
        validate(otherVersion);

        return semver.gte(otherVersion, this.version);
    }

    isLowerThanOrEqualTo(otherVersion) {
        validate(this.version);
        validate(otherVersion);

        return semver.lte(otherVersion, this.version);
    }
}

const isValidVersion = input => Boolean(semver.valid(input));

export const isValidInput = input => SEMVER_INCREMENTS.includes(input) || isValidVersion(input);

export const validate = version => {
    if (!isValidVersion(version)) {
        throw new Error('Version should be a valid semver version.');
    }
};

export const isPrereleaseOrIncrement = input => createVersion(input).isPrerelease() || PRERELEASE_VERSIONS.includes(input);

export function createVersion(version) {
    return new Version(version);
}

// Minimum git version requirements (stub - the original didn't actually implement this)
export function verifyRequirementSatisfied(tool, installedVersion) {
    // Minimum git version requirement - not strictly enforced
    const minGitVersion = '2.11.0';
    if (tool === 'git' && semver.lt(installedVersion, minGitVersion)) {
        throw new Error(`Please upgrade git to version ${minGitVersion} or higher`);
    }
}

export default createVersion;
