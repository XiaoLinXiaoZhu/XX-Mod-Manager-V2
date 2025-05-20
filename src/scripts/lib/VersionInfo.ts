import * as packageJson from '../../../package.json';

export function getVersionInfo() {
    return packageJson.version;
}