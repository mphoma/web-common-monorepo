import {
    State
} from '@vodacom/web-state';

export interface conType {
    name: string | null,
    configName: string | null,
}

export class Config {

    static strategies = {
        None: 'None',
        CacheFirst: 'CacheFirst',
        NetworkFirst: 'NetworkFirst'
    };

    static URL_REGEX = /^(?:https:\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;

    static url = '';
    static state = State.with('Config');
    static defaultConfig = {};
    static defaultConfigName = null;

    static async init(
        {
            configUrl = '',
            force = false,
            name = null,
            defaultConfig = {}
        } = {}
    ) {

        if (configUrl.startsWith('http') && !Config.URL_REGEX.test(configUrl) && !configUrl.startsWith('http://localhost')) {
            throw new Error('Invalid config url specified!');
        }

        let configName = name;

        if (!configName || !configName.length) {

            const fileNameStart = configUrl.lastIndexOf('/') + 1;
            configName = configUrl.substr(fileNameStart);
            let dotPosition = configName.indexOf('.');

            if (dotPosition >= 0) {
                configName = configName.substr(0, dotPosition);
            }
        }

        if (!Config.defaultConfigName) {
            Config.defaultConfigName = configName;
        }

        Config.url = configUrl;
        Config.defaultConfig = defaultConfig;

        let configModifiedSince = force
            ? null
            : Config.state.get(`${configName}-configModifiedSince`, null);

        if (force) {
            Config.state.set(`${configName}-configModifiedSince`, null);
        }

        const headers = {};

        if (configModifiedSince) {
            headers['if-modified-since'] = configModifiedSince;
        }

        const res = await Config.state.fetch(Config.url, {
            method: 'GET',
            headers,
            strategy: Config.strategies.NetworkFirst
        });

        if (res && res.headers && res.headers.get) {

            configModifiedSince = res.headers.get('last-modified');

            if (configModifiedSince) {
                Config.state.set(`${configName}-configModifiedSince`, configModifiedSince);
            }
        }

        // Determine if there is a previously cached config
        const config = Config.state.get(
            configName,
            null
        );

        if (res && config && res.status === 304) {
            return true;
        }

        if (!res || !res.ok || !res.result) {
            return false;
        }

        Config.state.set(
            configName,
            res.result
        );

        return true;
    }

    static get(
        key,
        name
    ) {

        if (typeof key !== 'string' || key.length <= 0) {
            return null;
        }

        const configName = name || Config.defaultConfigName;
        const config = Config.state.get(configName, null);
        const keys = key.split('.');

        let value = config || Config.defaultConfig;

        // Recursively look through the config structure for the path specified by the key.
        for (const k of keys) {

            if (!value) {
                break;
            }

            value = value[k];
        }

        return value;
    }
}