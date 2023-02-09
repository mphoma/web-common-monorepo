import { State} from "./state";

let fetchLogs: any = [];

export const getFetchLogs = () => {
  return fetchLogs;
};

const defaultShouldLog = (uri: any, options: any, res: any) => true;
const defaultCreateLog = (uri: any, options: { method: any; queryParameters: any; pathParameters: any; headers: any; body: any; strategy: any; cacheTTL: any; }, res: any) => {
  return {
    request: {
      url: uri,
      options: {
        method: options.method,
        queryParameters: options.queryParameters,
        pathParameters: options.pathParameters,
        headers: options.headers,
        body: options.body,
        strategy: options.strategy,
        cacheTTL: options.cacheTTL,
      },
    },
    response: res,
  };
};

export const getLoggedFetch = ({
  state = new State({}, '') ,
  shouldLog = defaultShouldLog,
  createLog = defaultCreateLog,
  maxFetchLogs = 100,
}) => {
  if (typeof state?.fetch !== "function") {
    console.warn("state interface requires fetch method");
    return;
  }

  if (isNaN(maxFetchLogs)) {
    console.warn("TypeError: maxFetchLogs is not a number");
    return;
  }

const publishLog = (uri: any, options: any, res: any) => {
    if (shouldLog(uri, options, res)) {
      if (fetchLogs.length >= maxFetchLogs && maxFetchLogs > 0) {
        fetchLogs = fetchLogs.splice(0, maxFetchLogs - 1);
      }

      fetchLogs.unshift(createLog(uri, options, res));
    }
  };

  return async (uri: any, options: { callback?: any; method?: any; queryParameters?: any; pathParameters?: any; headers?: any; body?: any; strategy?: any; cacheTTL?: any; }) => {
    const logCallback = (networkResponse: any) => {
      if (options.callback) {
        options.callback(networkResponse);
      }
      publishLog(uri, options, res);
    };

    const res = await state.fetch(uri, {
      ...options,
      callback: logCallback,
    });

    publishLog(uri, options, res);
    return res;
  };
};
