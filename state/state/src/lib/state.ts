import md5 from "md5";

import qs from "qs";

import { Types, Levels, Sentry } from "@vodacom/web-sentry-react";


export const CacheStrategy = {
  None: "None",
  CacheFirst: "CacheFirst",
  NetworkFirst: "NetworkFirst",
  CacheOnly: "CacheOnly",
};

export const ContentType = {
  FormUrlEncoded: "application/x-www-form-urlencoded",
  MultipartFormData: "multipart/form-data",
  ApplicationJson: "application/json",
};

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const URL_REGEX =
  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;

declare global {
  interface Window {
    Storage: string | any;
    localStorage: string | any;
    sessionStorage: string | any;
    XMLHttpRequest: string | any;
    indexedDB: number | any;
    mozIndexedDB: string | any;
    webkitIndexedDB: string | any;
    msIndexedDB: string | any;
    shimIndexedDB: string | any;
  }
}

export class State {
  context: any;
  sentry: any;
  basePath: string;
  static defaultHeaders: any;
  static defaultCacheTTL: any;
  static isAuthenticated: any;
  static reAuthenticate: any;
  static getTokens: any;
  static Storage: any;
  indexedDB: any;


  constructor(context: any, basePath = "") {
    this.context = context;
    this.sentry = Sentry.with("State", `State_${this.context}`);
    this.basePath =
      basePath && typeof basePath === "string"
        ? (!basePath.endsWith("/") && `${basePath}/`) || basePath
        : "";
  }

  static with(context: any, basePath = "", options = { useIndexedDB: {} }) {
    if (options.useIndexedDB) {
      return new IndexedDBState(context, basePath);
    }
    return (
      (typeof State.Storage !== "undefined" &&
        new WebState(context, basePath)) ||
      new MemState(context, basePath)
    );
  }

  static setDefaultHeaders(defaultHeaders: {}) {
    if (!defaultHeaders || !Object.keys(defaultHeaders).length) {
      Sentry.with("State", "State").warn(
        `Attempted to set invalid defaultHeaders`
      );
      return;
    }

    State.defaultHeaders = JSON.parse(JSON.stringify(defaultHeaders));
  }

  static setDefaultCacheTTL(cacheTTL: number) {
    if (isNaN(cacheTTL)) {
      Sentry.with("State", "State").warn(
        `Attempted to set invalid defaultCacheTTL: ${cacheTTL}. cacheTTL must be of type Number`
      );
      return;
    }

    State.defaultCacheTTL = cacheTTL;
  }

  static setAuthCallbacks(
    isAuthenticated: any,
    reAuthenticate: any,
    getTokens: any
  ) {
    if (
      typeof isAuthenticated !== "function" ||
      typeof reAuthenticate !== "function" ||
      typeof getTokens !== "function"
    ) {
      Sentry.with("State", "State").warn(
        `Attempted to set invalid callbacks. isAuthenticated, reAuthenticate and getTokens must be of type function`
      );
      return;
    }

    State.isAuthenticated = isAuthenticated;
    State.reAuthenticate = reAuthenticate;
    State.getTokens = getTokens;
  }

  static async refreshAuth(checkAuth: any) {
    if (!checkAuth) {
      return {
        ok: true,
        updateHeaders: false,
      };
    }

    if (
      typeof State.isAuthenticated !== "function" ||
      typeof State.reAuthenticate !== "function" ||
      typeof State.getTokens !== "function"
    ) {
      Sentry.with("State", "State").warn(
        `Cannot attempt auth refresh with invalid callbacks. Please setAuthCallbacks with valid functions.`
      );

      // proceed to make call even if callbacks are invalid
      return {
        ok: true,
        updateHeaders: false,
      };
    }

    const isAuthenticated = State.isAuthenticated();

    if (isAuthenticated) {
      return {
        ok: true,
        updateHeaders: false,
      };
    }

    const refreshed = await State.reAuthenticate();

    return {
      ok: refreshed,
      updateHeaders: true,
    };
  }

  static isValidKey(key: string | any[]) {
    return typeof key === "string" && key.length;
  }

  static isValidUrl(url: string) {
    return URL_REGEX.test(url);
  }

  static isExpired(cachedTime: Date, ttl: number) {
    const cachedDate = new Date(cachedTime);

    if (isNaN(ttl) || isNaN(Number(cachedDate))) {
      return true;
    }

    return ttl !== 0 && Date.now() > cachedDate.getTime() + ttl * 1000;
  }

  static getUrlQueryPair(
    uri: { split: (arg0: string) => [any, (string | undefined)?] },
    parameters: any,
    arrayFormat: undefined
  ) {
    let [url, query = ""] = uri.split("?");

    const qsQueryString = qs.stringify(parameters, { arrayFormat });

    if (query.length === 0) {
      query = qsQueryString;
    } else if (qsQueryString.length > 0) {
      query += `&${qsQueryString}`;
    }

    return {
      url,
      query,
    };
  }

  static setPathParameters(url: any, parameters: any) {
    if (!parameters) {
      return url;
    }

    for (const [key, val] of Object.entries(parameters)) {
      const regex = new RegExp(`:${key}|{${key}}`, "g");

      url = url.replace(regex, val);
    }

    return url;
  }

  static parseHeaders(headers: string) {
    const headerMap = new Map();

    if (typeof headers !== "string" || !headers) {
      return headerMap;
    }

    const headerArray = headers.split("\r\n");

    let header = "";

    for (let i = 0; i < headerArray.length; i++) {
      header = headerArray[i];

      if (!header) {
        continue;
      }

      const [key, val] = header.split(":");

      if (!key || headerMap.has(key)) {
        continue;
      }

      headerMap.set(key, val);
    }

    return headerMap;
  }

  static extractMessage(
    result: { message: any; messages: string | any[] },
    messages = ""
  ) {
    let message = messages || (result && result.message) || "";

    if (message) {
      return typeof message === "string"
        ? message
        : message.length > 0 && typeof message[0] === "object"
          ? message[0].message
          : message[0];
    }

    if (result && result.messages && result.messages.length > 0) {
      message = result.messages[0];

      if (typeof message === "object") {
        message = message.message;
      }
    }

    return message;
  }

  generateContextKey(key: string, shared = false) {
    return `${(!shared && this.context) || "shared"}_${key}`;
  }

  async fetch(
    uri: string | any,
    {
      method = "GET",
      queryParameters = {},
      arrayFormat = undefined,
      pathParameters = {},
      headers = {},
      body = {},
      strategy = CacheStrategy.CacheFirst,
      callback = (_networkResponse?: unknown) => { },
      callbackOnFail = false,
      enabledTracing = true,
      shouldPersist = true,
      keepOriginalResult = false,
      cacheTTL = State.defaultCacheTTL,
      checkAuth = false,
    }
  ) {
    if (!uri || uri.length <= 0) {
      throw new Error("The specified URL is invalid!");
    }

    if (
      typeof method !== "string" ||
      !VALID_METHODS.includes(method.toUpperCase())
    ) {
      throw new Error(
        `${method} is not a valid request method! Valid methods are: ${VALID_METHODS.join(
          ", "
        )}`
      );
    }

    if (typeof callback !== "function") {
      throw new Error("Provided callback is not a function.");
    }

    let { url, query } = State.getUrlQueryPair(
      uri,
      queryParameters,
      arrayFormat
    );

    if (pathParameters) {
      url = State.setPathParameters(url, pathParameters);
    }

    if (query.length > 0) {
      url += `?${query}`;
    }

    if (!State.isValidUrl(url) && this.basePath) {
      url = `${this.basePath}${(url.startsWith("/") && url.substring(1)) || url
        }`;
    }

    const user = await this.get("user", "default-user", true);
    const key = md5(`${user}${url}${JSON.stringify(body)}`);
    const cachedResponse: any = this.get(key, null);

    const isExpired = State.isExpired(cachedResponse["stamp"], cacheTTL);

    /* If strategy is not network first and there is no value in cache we need to switch strategy to network first for this request */
    if (
      strategy !== CacheStrategy.None &&
      strategy !== CacheStrategy.NetworkFirst &&
      !cachedResponse
    ) {
      strategy = CacheStrategy.NetworkFirst;
    } else if (
      strategy === CacheStrategy.CacheOnly &&
      cachedResponse &&
      isExpired
    ) {
      strategy = CacheStrategy.CacheFirst;
    }

    const options = {
      reportUrl: uri,
      method,
      headers,
      body,
      strategy,
      enabledTracing,
      shouldPersist,
      cacheKey: key,
      keepOriginalResult,
      checkAuth,
    };

    switch (strategy) {
      case CacheStrategy.None:
        return this.request(url, options);

      case CacheStrategy.NetworkFirst:
        return this.request(url, options).then((networkResponse: any) => {
          return (networkResponse && networkResponse.ok) || !cachedResponse
            ? networkResponse
            : cachedResponse;
        });

      case CacheStrategy.CacheFirst:
        this.request(url, options).then((networkResponse?: any) => {
          if (callbackOnFail || networkResponse?.ok) {
            callback(networkResponse);
          }
        });

        return cachedResponse;

      case CacheStrategy.CacheOnly:
        return cachedResponse;

      default:
        throw new Error(
          `${strategy} is not a valid Cache Strategy! Pick one of: ${Object.keys(
            CacheStrategy
          ).join(",")}`
        );
    }
  }
  get(arg0: string, arg1: string | null, arg2?: boolean) {
    throw new Error("Method not implemented.");
  }

  async request(
    url: any,
    {
      reportUrl,
      method,
      headers,
      body,
      strategy,
      cacheKey,
      enabledTracing,
      shouldPersist,
      keepOriginalResult,
      checkAuth,
    }: {
      reportUrl: any;
      method: string;
      headers: any;
      body: any;
      strategy: any;
      enabledTracing: boolean;
      shouldPersist: boolean;
      cacheKey: string;
      keepOriginalResult: boolean;
      checkAuth: boolean;
    }
  ) {
    const refreshData = await State.refreshAuth(checkAuth);

    if (refreshData.ok && refreshData.updateHeaders) {
      const tokens = State.getTokens();

      const authHeaderString = headers.hasOwnProperty("authorization")
        ? "authorization"
        : "Authorization";

      headers = {
        ...headers,
        [authHeaderString]: `Bearer ${tokens.access}`,
      };
    }

    return new Promise((resolve, reject) => {
      if (!window.XMLHttpRequest) {
        reject(new Error("XHR not supported"));
      }

      const xhr = new window.XMLHttpRequest();

      xhr.open(method, url, true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = () => {
        try {
          if (xhr.readyState === 4) {
            const contentType = xhr.getResponseHeader("content-type");

            const res =
              typeof contentType === "string" &&
                contentType.match(/^application\/.*json/) !== null
                ? JSON.parse(xhr.responseText)
                : xhr.response;

            let trace, date;

            if (enabledTracing) {
              trace = xhr.getResponseHeader("x-b3-traceid");
              date = xhr.getResponseHeader("date");
            }

            if (typeof trace === "string" && trace.indexOf(",") > -1) {
              trace = trace.substring(0, trace.indexOf(","));
            }

            const response = {
              ok: xhr.status >= 200 && xhr.status < 300,
              message: State.extractMessage(res.result, res.messages || ""),
              result: keepOriginalResult || !res.result ? res : res.result,
              code: res?.code || res?.result?.code,
              status: xhr.status,
              stamp: Date(),
              trace: trace,
              date: date,
              headers: State.parseHeaders(xhr.getAllResponseHeaders()),
              request: {
                options: {
                  cacheKey,
                },
              },
            };

            if (response.ok && strategy !== CacheStrategy.None) {
              this.set(cacheKey, response, shouldPersist);
            }

            this.sentry.breadcrumb(
              reportUrl,
              Levels.INFO,
              "State",
              Types.HTTP,
              {
                status: response.status,
                trace: response.trace,
                req: {
                  method,
                  body,
                  strategy,
                  cacheKey,
                },
                res: response,
                stamp: Date(),
              }
            );

            if (!response.ok && response.status !== 304) {
              this.sentry.error(
                Error(`Service request failed : ${reportUrl}`),
                {
                  status: response.status,
                  trace: response.trace,
                  errorCode: response.code,
                  req: {
                    url: reportUrl,
                    method,
                    body,
                    strategy,
                    cacheKey,
                  },
                  res: response,
                  stamp: Date(),
                }
              );
            }

            resolve(response);
          }
        } catch (e) {
          reject(e);
        }
      };

      let contentType;
      let FormData: any;

      if (headers || State.defaultHeaders) {
        const finalHeaders = {
          ...State.defaultHeaders,
          ...headers,
        };

        for (const [key, value] of Object.entries(finalHeaders)) {
          if (!value) {
            continue;
          }

          if (!contentType && key.toLowerCase() === "content-type") {
            contentType = value;

            if (
              body instanceof FormData &&
              contentType === ContentType.MultipartFormData
            ) {
              continue;
            }
          }

          xhr.setRequestHeader(key, value);
        }
      }

      const requestBody =
        !contentType || contentType === ContentType.ApplicationJson
          ? JSON.stringify(body)
          : body;

      xhr.send(requestBody);
    });
  }
  set(
    cacheKey: string,
    response: {
      ok: boolean;
      message: any;
      result: any;
      code: any;
      status: any;
      stamp: string;
      trace: any;
      date: any;
      headers: Map<any, any>;
      request: { options: { cacheKey: string } };
    },
    shouldPersist: boolean
  ) {
    throw new Error("Method not implemented.");
  }
}
export class WebState extends State {
  localStorage: any;
  sessionStorage: any;

  constructor(context: any, basePath = "") {
    super(context, basePath);

    this.localStorage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
  }

  get(key: string | any, fallback: string | null, shared = false) {
    if (!State.isValidKey(key)) {
      this.sentry.warn("Tried to get with an invalid key! Returning fallback.");
      return fallback;
    }

    const contextKey = this.generateContextKey(key, shared);
    const sessionValue = this.sessionStorage.getItem(contextKey);

    if (sessionValue !== undefined && sessionValue !== null) {
      return JSON.parse(sessionValue);
    }

    const localValue = this.localStorage.getItem(contextKey);

    if (localValue !== undefined && localValue !== null) {
      return JSON.parse(localValue);
    }

    return fallback;
  }

  set(key: string | any, value: any, shouldPersist: any, shared = false) {
    if (!State.isValidKey(key) || value === undefined) {
      this.sentry.warn("Tried to set with an invalid key!");
      return;
    }

    const contextKey = this.generateContextKey(key, shared);
    const stringValue = JSON.stringify(value);

    if (shouldPersist) {
      const sessionValue = this.sessionStorage.getItem(contextKey);

      if (sessionValue !== undefined && sessionValue !== null) {
        throw new Error(
          `Value with key '${contextKey}' exists both in local and session storage. Mixed persistance is not supported.`
        );
      }

      this.localStorage.setItem(contextKey, stringValue);

      return;
    }

    this.sessionStorage.setItem(contextKey, stringValue);

    return;
  }
}

export class UNSAFE_WebState extends State {
  localStorage: any;
  sessionStorage: any;

  // localStorage: Storage;
  // sessionStorage: Storage;
  constructor(context: any, basePath = "") {
    super(context, basePath);


    this.localStorage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
  }

  get(key: string | any, fallback: string | null, shared = false) {
    if (!State.isValidKey(key)) {
      this.sentry.warn("Tried to get with an invalid key! Returning fallback.");
      return fallback;
    }

    const contextKey = this.generateContextKey(key, shared);
    const sessionValue = this.sessionStorage.getItem(contextKey);

    if (sessionValue !== undefined && sessionValue !== null) {
      return JSON.parse(sessionValue);
    }

    const localValue = this.localStorage.getItem(contextKey);

    if (localValue !== undefined && localValue !== null) {
      this.sessionStorage.setItem(contextKey, localValue);

      return JSON.parse(localValue);
    }

    return fallback;
  }

  set(key: any, value: any, shouldPersist: any, shared = false) {
    if (!State.isValidKey(key) || value === undefined) {
      this.sentry.warn("Tried to set with an invalid key!");
      return;
    }

    const contextKey = this.generateContextKey(key, shared);
    const stringValue = JSON.stringify(value);

    this.sessionStorage.setItem(contextKey, stringValue);

    if (shouldPersist) {
      const sessionValue = this.sessionStorage.getItem(contextKey);
      const warningKey = this.generateContextKey(
        "unsafe-state-deprecation-warning",
        false
      );
      const previouslyWarned = this.sessionStorage.getItem(warningKey);

      if (
        sessionValue !== undefined &&
        sessionValue !== null &&
        !previouslyWarned
      ) {
        this.sentry.warn(
          `DEPRECATION: Value with key '${contextKey}' exists both in local and session storage. Mixed persistance will not be supported in future versions.`
        );

        this.sessionStorage.setItem(warningKey, true);
      }

      this.localStorage.setItem(contextKey, stringValue);
    }

    return;
  }
}

export class MemState extends State {
  memStorage: Map<any, any>;
  constructor(context: any, basePath = "") {
    super(context, basePath);
    this.memStorage = new Map();
  }

  get(key: string | any, fallback: string | null, shared = false) {
    if (!State.isValidKey(key)) {
      this.sentry.warn("Tried to get with an invalid key! Returning fallback.");
      return fallback;
    }

    return (
      this.memStorage.get(this.generateContextKey(key, shared)) || fallback
    );
  }

  set(key: string | any, value: any, shouldPersist: any, shared = false) {
    if (!State.isValidKey(key)) {
      this.sentry.warn("Tried to set with an invalid key!");
      return;
    }

    shouldPersist &&
      this.sentry.warn("Your browser doesn't support data persistence!");

    return this.memStorage.set(this.generateContextKey(key, shared), value);
  }
}

export class IndexedDBState extends State {
  constructor(context: any, basePath?: any) {
    super(context);

    this.indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB ||
      window.shimIndexedDB;

    if (!this.indexedDB) {
      this.sentry.warn("IndexedDB could not be found in this browser.");
      return (
        (typeof Storage !== "undefined" && new WebState(context)) ||
        new MemState(context)
      );
    }

    let idb = this.indexedDB.open("DataStore", 1);

    idb.onerror = function (event: any) {
      this.sentry.error("An error occurred with IndexedDB", event);
    };

    idb.onupgradeneeded = function () {
      const db = idb.result;

      db.createObjectStore("DataState", { keyPath: "dataName" });
    };
  }

  async get(key: any, fallback: unknown, shared = false) {
    if (!State.isValidKey(key)) {
      this.sentry.warn("Tried to get with an invalid key! Returning fallback.");
      return fallback;
    }

    return new Promise((resolve, reject) => {
      const contextKey = this.generateContextKey(key, shared);
      let idb = this.indexedDB.open("DataStore", 1);

      idb.onerror = function (event: any) {
        this.sentry.error("An error occurred with IndexedDB GET", event);
      };

      idb.onsuccess = function () {
        const db = idb.result;

        const transaction = db.transaction("DataState", "readwrite");

        const store = transaction.objectStore("DataState");

        const data = store.get(contextKey);

        transaction.oncomplete = function () {
          db.close();
        };

        transaction.onabort = function (event: { target: { error: any } }) {
          const error = event.target.error; // DOMException
          if (error.name == "QuotaExceededError") {
            this.sentry.error(
              "QuotaExceededError error occurred with IndexedDB GET",
              event
            );
            resolve(fallback);
            return;
          }
        };

        data.onsuccess = function () {
          if (
            data !== undefined &&
            data !== null &&
            data.result !== undefined &&
            data.result !== null
          ) {
            resolve(JSON.parse(data.result.dataValue));
            return;
          }

          resolve(fallback);
        };

        data.onerror = function (e: any) {
          resolve(fallback);
        };
      };
    });
  }

  set(key: any, value: any, shouldPersist: any, shared = false) {
    if (!State.isValidKey(key) || value === undefined) {
      this.sentry.warn("Tried to set with an invalid key!");
      return;
    }

    const contextKey = this.generateContextKey(key, shared);
    const stringValue = JSON.stringify(value);
    let idb = this.indexedDB.open("DataStore", 1);

    idb.onerror = function (event: any) {
      this.sentry.error("An error occurred with IndexedDB SET", event);
    };

    idb.onsuccess = function () {
      const db = idb.result;

      const transaction = db.transaction("DataState", "readwrite");

      const store = transaction.objectStore("DataState");

      const data = store.get(contextKey);

      transaction.onabort = function (event: { target: { error: any } }) {
        const error = event.target.error; // DOMException
        if (error.name == "QuotaExceededError") {
          this.sentry.error(
            "QuotaExceededError error occurred with IndexedDB SET",
            event
          );
          return;
        }
      };

      data.onsuccess = function () {
        if (
          data !== undefined &&
          data !== null &&
          data.result !== undefined &&
          data.result !== null
        ) {
          transaction.oncomplete = function () {
            db.close();
          };
          return;
        }
      };

      store.put({ dataName: contextKey, dataValue: stringValue });

      transaction.oncomplete = function () {
        db.close();
      };
    };

    return;
  }
}

State.defaultHeaders = null;
State.defaultCacheTTL = 0;
State.isAuthenticated = null;
State.reAuthenticate = null;
State.getTokens = null;
