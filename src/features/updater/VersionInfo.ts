import packageJson from '../../../package.json';
import updaterConfig from '../../../updater/config.json';

export function getVersionInfo() {
    return packageJson.version;
}

export function getVersionNote(){
    return updaterConfig.notes;
}

export const versionData = updaterConfig;
export function getVersionData() {
    return updaterConfig;
}