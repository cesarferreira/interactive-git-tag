import chalk from 'chalk';
import { createVersion } from './version.js';

export default function prettyVersionDiff(oldVersion, inc) {
    const newVersion = createVersion(oldVersion).getNewVersionFrom(inc).split('.');
    const oldVersionParts = oldVersion.split('.');
    let firstVersionChange = false;
    const output = [];

    for (let i = 0; i < newVersion.length; i++) {
        if ((newVersion[i] !== oldVersionParts[i] && !firstVersionChange)) {
            output.push(`${chalk.dim.cyan(newVersion[i])}`);
            firstVersionChange = true;
        } else if (newVersion[i].indexOf('-') >= 1) {
            const preVersion = newVersion[i].split('-');
            output.push(`${chalk.dim.cyan(`${preVersion[0]}-${preVersion[1]}`)}`);
        } else {
            output.push(chalk.reset.dim(newVersion[i]));
        }
    }

    return output.join(chalk.reset.dim('.'));
}
