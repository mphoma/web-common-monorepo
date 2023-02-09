import {
    Sentry
} from '@vodacom/web-sentry';

import {
    State
} from '@vodacom/web-state';

const joinPaths = (...paths: any) => paths.join('/').replace(/\/\/+/g, '/').replace(/^(.*?)\:\//g, '$1://');
const isRelativePath = (path: any) => !path?.startsWith?.('http');


interface envType {
    prod?: string;
    production?: string;

}

export class Environment {

    static sentry = Sentry.with('Config', 'Environment');
    static state = State.with('Environment');

    static init(
        config: {
            name
            uiHost
            apiHost
            uiBase
            apiBase
            assetBase
            assetHost
        },
        {
            autoDetect = true,

        } = {}
    ) {

        if (!config) {
            Environment.sentry.error(new Error('Invalid environment config provided.'));
            return;
        }

        if (Object.keys(config).length === 0) {
            Environment.sentry.error(new Error('No environments configured'));
            return;
        }

        const environments: envType = {};


        for (const [envName, envConfig] of Object.entries(config)) {

            if (!envConfig?.uiHost?.length || !envConfig?.apiHost?.length) {
                Environment.sentry.warn(`Invalid config given for ${envName}. ${envName} will not be configured.`);
                continue;
            }

            envConfig.name = envConfig.name || envName;
            envConfig.uiBase = envConfig.uiBase || '/';
            envConfig.apiBase = envConfig.apiBase || '/';
            envConfig.assetBase = envConfig.assetBase || '/';
            envConfig.assetHost = envConfig.assetHost || envConfig.uiHost

            if (!isRelativePath(envConfig.uiBase) || !isRelativePath(envConfig.apiBase) || !isRelativePath(envConfig.assetBase)) {
                Environment.sentry.warn(`Base path(s) in '${envName}' are not relative. All base paths must be relative.`);
            }

            if (!envConfig.uiHost.toLowerCase?.().startsWith('https') && envName?.toLowerCase?.() !== 'local') {
                Environment.sentry.warn(`http:// protocol being used on non local environment '${envName}'. Only https is supported.`);
            }

            if (envConfig.commonAssetPath?.length > 0 && isRelativePath(envConfig.commonAssetPath)) {
                Environment.sentry.warn(`Common asset path in '${envName}' is relative. Only absolute URLs are supported.`);
            }

            envConfig.apiPath = joinPaths(envConfig.apiHost, envConfig.apiBase);
            envConfig.uiPath = joinPaths(envConfig.uiHost, envConfig.uiBase);
            envConfig.assetPath = joinPaths(envConfig.assetHost, envConfig.assetBase);

            envConfig.navigatorType = envConfig.navigatorType || envConfig.uiHost.includes?.('localhost')
                ? 'browser'
                : 'memory';

            environments[envName.toLowerCase()] = envConfig;
        }

        Environment.state.set('environments', environments);

        let current = environments.prod || environments.production || {};

        if (autoDetect) {

            const currentHost = window?.location?.hostname?.toLowerCase?.();

            for (const envConfig of Object.values(environments)) {

                const envHost = envConfig.uiHost.replace?.(/^https?:\/\//, '').replace(/:[0-9]+/, '');

                if (envHost === currentHost) {

                    current = envConfig;
                    break;
                }
            }
        }

        Environment.state.set('currentEnvironment', current);
    }

    static get current() {
        return Environment.state.get('currentEnvironment', {});
    }

    static set(envName: string) {

        const environments = Environment.state.get('environments', {});

        const env = environments?.[envName?.toLowerCase?.()];

        if (!env) {
            Environment.sentry.warn(`No config for environment '${envName}' found. Environment will not be changed.`);
            return;
        }

        Environment.state.set('currentEnvironment', env);
    }
}