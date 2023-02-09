import {
    Events
} from '@vodacom/web-events';

export const Insight = {
    Tag: 'web-insights-tag',
    Info: ' web-insights-info',
    Warn: 'web-insight-warn',
    Debug: 'web-insights-debug',
    Error: 'web-insights-error',
};

// interface AddProvider {
//     // [index: string]: string;
//     name: string;
//     providers: {};
//   }

export class Insights {

    public context: any;

    constructor(context: any) {
        this.context = context || {};
    }

    static providers = '';
    static context = {};
    static contextProvider = {};

    static init = ({
        contextProvider,
        providers,
    } : any = {}) => {

        Insights.providers = providers || {};
        Insights.contextProvider = contextProvider;

        for (let event of Object.values(Insight)) {
            Events.subscribe(event, 'web-insights', Insights.delegate);
        }
    };

    static delegate = (e : any) => {

        for (let [provider , _] of Object.entries(Insights.providers)) {

            if (!provider.Insights) {
                continue;
            };

            typeof provider.Insights[e.name] === 'function' && provider.Insights[e.name](e.data);
        }

    };

    static addProvider = (
        name : string,
        provider: string,
    )  => {
        if (Insights.providers[name]) {
            Events.emit(Insight.Warn, 'Provider ${name} already registered.');
            return;
        }
        Insights.providers[name] = provider;
    };

    static removeProvider = (name : '') => {
        delete Insights.providers[name];
    }

    static with = (context:any) => {
        return new Insights(context);
    }

    static setContext = (context:any) => {

        Insights.context = {
            ...Insights.context,
            ...context,
        };
    };

    setContext = (context:any) => {

        this.context = {
            ...this.setContext,
            ...context,
        };
    };

    tag = (data: any) => this.log(Insight.Tag, data);
    info = (data: any) => this.log(Insight.Info, data);
    warn = (data: any) => this.log(Insight.Warn, data);
    debug = (data: any) => this.log(Insight.Debug, data);
    error = (data: any) => this.log(Insight.Error, data);

    log = (eventType: string, data: any) => {

        if (typeof data === 'string' || typeof data === 'number') {
            data = {
                message: data,
            };
        }

        this.send(eventType, data)
            .catch(e => {
                console.error(e);
            });
    };

    send = async (event: any, context: any) => {
        const appContext = Insights.contextProvider  || {};

        context = {
            ...Insights.context,
            ...this.context,
            appContext: appContext,
            ...context,
        };

        Events.emit(event, context);
    };
};