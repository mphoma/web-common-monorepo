import { v4 as uuid } from 'uuid'
import { Messages, TradePayResultCodes } from '../constants'

declare global {
    interface Window {
        my: any;
        message: string;
    }
}


/**
 * @typedef {Object} MiniProgramAPI
 * @property {function} alert
 * @property {function} call
 * @property {function} chooseImage
 * @property {function} clearStorage
 * @property {function} getEnv
 * @property {function} getLocation
 * @property {function} getNetworkType
 * @property {function} getStorage
 * @property {function} getStorageInfo
 * @property {function} hideLoading
 * @property {function} navigateBack
 * @property {function} navigateTo
 * @property {function} onMessage
 * @property {function} openLocation
 * @property {function} openTaobao
 * @property {function} postMessage
 * @property {function} previewImage
 * @property {function} reLaunch
 * @property {function} redirectTo
 * @property {function} removeStorage
 * @property {function} setStorage
 * @property {function} showLoading
 * @property {function} startShare
 * @property {function} switchTab
 * @property {function} tradePay
 * @property {function} adjustTrackEvent
 */

/**
 * @typedef {Object} MiniProgramError
 * @property {string} error The error code
 * @property {string} errorMessage The error message
 */

/**
 * @callback MessageCallback
 * @param {Error} [error] If an error occurred then this parameter will be set.
 * @param {*} data The data that's returned from the Mini Program shell.
 * @param {string} id The ID of the message to which this is linked to.
 */

/**
 * @type {MiniProgramAPI}
 */

export const miniProgramApi = window.my || {

    adjustTrackEvent: () => { console.warn('`my` not in global scope; `adjustTrackEvent` unavailable.'); },
    alert: () => { console.warn('`my` not in global scope; `alert` unavailable.'); },
    call: () => { console.warn('`my` not in global scope; `call` unavailable.'); },
    chooseImage: () => { console.warn('`my` not in global scope; `chooseImage` unavailable.'); },
    clearStorage: () => { console.warn('`my` not in global scope; `clearStorage` unavailable.'); },
    getEnv: () => { console.warn('`my` not in global scope; `getEnv` unavailable.'); },
    getLocation: () => { console.warn('`my` not in global scope; `getLocation` unavailable.'); },
    getNetworkType: () => { console.warn('`my` not in global scope; `getNetworkType` unavailable.'); },
    getStorage: () => { console.warn('`my` not in global scope; `getStorage` unavailable.'); },
    getStorageInfo: () => { console.warn('`my` not in global scope; `getStorageInfo` unavailable.'); },
    hideLoading: () => { console.warn('`my` not in global scope; `hideLoading` unavailable.'); },
    navigateBack: () => { console.warn('`my` not in global scope; `navigateBack` unavailable.'); },
    navigateTo: () => { console.warn('`my` not in global scope; `navigateTo` unavailable.'); },
    onMessage: () => { console.warn('`my` not in global scope; `onMessage` unavailable.'); },
    openLocation: () => { console.warn('`my` not in global scope; `openLocation` unavailable.'); },
    openTaobao: () => { console.warn('`my` not in global scope; `openTaobao` unavailable.'); },
    postMessage: () => { console.warn('`my` not in global scope; `postMessage` unavailable.'); },
    previewImage: () => { console.warn('`my` not in global scope; `previewImage` unavailable.'); },
    reLaunch: () => { console.warn('`my` not in global scope; `reLaunch` unavailable.'); },
    redirectTo: () => { console.warn('`my` not in global scope; `redirectTo` unavailable.'); },
    removeStorage: () => { console.warn('`my` not in global scope; `removeStorage` unavailable.'); },
    setStorage: () => { console.warn('`my` not in global scope; `setStorage` unavailable.'); },
    setStorageSync: () => { console.warn('`my` not in global scope; `setStorageSync` unavailable.'); },
    showLoading: () => { console.warn('`my` not in global scope; `showLoading` unavailable.'); },
    startShare: () => { console.warn('`my` not in global scope; `startShare` unavailable.'); },
    switchTab: () => { console.warn('`my` not in global scope; `switchTab` unavailable.'); },
    tradePay: () => { console.warn('`my` not in global scope; `tradePay` unavailable.'); },
}

/**
 * All the messages that were sent to the mini program API that are currently pending.
 * @type {Map<string, {callback: MessageCallback, once: boolean, message: string}>}
 */
const pendingMessages = new Map();

/**
 * Remove a message from the pending messages map.
 * @param {string} messageId The ID of the message to remove.
 */
export const removePendingMessage = (messageId: string) => {
    pendingMessages.delete(messageId);
};

/**
 * Posts a message to the Mini Program.
 * @param {string} message The message you want to send to the Mini Program.
 * @param {MessageCallback} callback The callback that should be called when the Mini Program responds.
 * @param {Object} [options] Additional options
 * @param {*} [options.data] Any data you would like to send to the Mini Program.
 * @param {boolean} [options.once=true] If the response should only expect one response from the Mini Program.
 * @return {string} A unique identifier for the message that was sent. Used to remove the callback from the map.
 */
export const postMessageToMiniProgram = (
    message: string,
    callback: any,
    {
        data,
        once = true,
    }: { data?: any; once?: boolean; } = {},
): string => {

    const id = uuid();

    pendingMessages.set(
        id,
        {
            callback,
            once,
            message
        }
    );

    miniProgramApi.postMessage({
        id,
        message,
        data,
    });

    return id;
};

/**
 * Retrieves the most appropriate message from the error received from the Mini Program.
 * @param {string} message The message identifier that was sent to the Mini Program.
 * @param {Object|Error|MiniProgramError} error The error object we get back from the Mini Program.
 * @returns {string} The most appropriate error message.
 */
const getErrorMessage = (message: string, error: any) => {

    if (!!error.message) {

        return error.message;
    }

    if (!!error.errorMessage) {

        return error.errorMessage;
    }

    if (!!error.error) {

        if (/^\d+$/.test(error.error)) {

            return `${message} returned with error code: ${error.error}`;
        }

        return error.error;
    }

    console.error(`Error in getErrorMessage: Unknown error for ${message}`, {
        params: {
            error,
            message
        }
    });
    return `Unknown error for ${message}`;
};

/**
 * Handler for when a message is received from the Mini Program shell.
 * @param {object} response The response from the Mini Program
 * @returns {boolean}
 */
miniProgramApi.onMessage = (response: any) => {

    const {
        error,
        id,
        data
    } = response;

    if (!pendingMessages.has(id)) {

        console.error(`Error in miniProgramApi.onMessage: Received message with ID "${id}" which was not in the pending list.`, {
            params: response
        });
        return false;
    }

    const {
        callback,
        once,
        message
    } = pendingMessages.get(id);

    if (once) {
        pendingMessages.delete(id);
    }

    if (error) {

        const errorMessage = getErrorMessage(message, error);
        callback(new Error(errorMessage), data, id);
        console.error(`Error in miniProgramApi.onMessage: ${errorMessage}`, {
            error,
            params: response
        });
        return false;
    }

    callback(undefined, data, id);

    return true;
};

/**
 * Watch for a shake event from the user.
 * @return {Promise<void>} Resolves when a shake was detected.
 * @throws {Error} Rejects when there is an error trying to watch for a shake.
 */
export const watchShake = async () => {
    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(Messages.watchShake, (error: any) => {
            if (error) {
                reject(error);
                console.error(`Error in watchShake: ${error?.message}`, {
                    error
                });
                return;
            }

            resolve();
        });
    });
};

/**
 * Opens the device's contact picker.
 * @return {Promise<void>} Resolves when a contact was chosen.
 * @throws {Promise<Error>} Rejects when an error occurs.
 */
export const choosePhoneContact = async () => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(Messages.choosePhoneContact, (error: any, data: any) => {
            if (error) {
                reject(error);
                console.error(`Error in choosePhoneContact: ${error?.message}`, {
                    error
                });
                return;
            }

            resolve(data);
            return;
        });
    });
};

/**
 * Fetches the devices system info.
 * @return {Promise<Object>} Resolves when system info fetched.
 * @throws {Promise<Error>} Rejects when an error occurs.
 */
export const getSystemInfo = async () => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(Messages.getSystemInfo, (error: any, data: any) => {
            if (error) {
                reject(error);
                console.error(`Error in getSystemInfo: ${error?.message}`, {
                    error
                });
                return;
            }
            resolve(data);
        });
    });
};

/**
 * Navigates the user to the specified Mini Program.
 * @param {string} appId The ID of the Mini Program to navigate to.
 * @param {string} path The path within the Mini Program to navigate to. This is used to launch a
 * page other than the default one.
 * @param {*} extraData Any additional data that needs to the passed to the Mini Program page that
 * you are navigating to.
 * @return {Promise}
 */
export const navigateToMiniProgram = async (appId: string,
    path: string,
    extraData: number,
) => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(Messages.navigateToMiniProgram, (error: any, data: any) => {
            if (error) {
                reject(error);
                console.error(`Error in navigateToMiniProgram: ${error?.message}`, {
                    error
                });
                return;
            }

            resolve(data);
            return;
        }, {
            data: {
                appId,
                path,
                extraData
            }
        });
    });
};

/**
 * Logs the current path to the Mini Program shell. This is used for the deep linking sharing
 * feature.
 * @param {string} path The path to log
 * @return {Promise<void>} Resolves once the path has been successfully logged.
 */
export const logCurrentPath = async (path: string) => {
    return new Promise<void>(resolve => {
        postMessageToMiniProgram(Messages.logCurrentPath, () => {
            resolve();
        }, {
            data: {
                path,
            }
        });
    });
};

/**
 * Gets an auth code from the Mini Program shell.
 * @param {string[]} scopes The scopes that you need access to.
 * @return {Promise<string|Error>} Resolves with the auth code or rejects with an Error.
 */
export const getAuthCode = async (scopes: string[]) => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(Messages.getAuthCode, (error: any, data: any) => {

            try {

                if (error) {

                    reject(error);
                    console.log(`Error in getAuthCode: ${error?.message}`, {
                        error,
                        params: {
                            scopes
                        }
                    });
                    return;
                }

                const {
                    authCode,
                    authErrorScopes
                } = data;

                if (!!authErrorScopes && Object.keys(authErrorScopes).length > 0) {

                    console.warn('Could not get auth for all scopes', authErrorScopes);
                }

                if (!authCode) {

                    reject(new Error('Could not get auth code'));
                    console.error('Error in getAuthCode: Could not get auth code', {
                        params: {
                            scopes
                        }
                    })
                    return;
                }

                resolve(authCode);
                console.log(authCode);

            } catch (err) {

                reject(err);
                console.error(`Error in getAuthCode: ${err?.message}`, {
                    error: err,
                    params: {
                        scopes
                    }
                });
            }
            return
        }
            , {
                data: {
                    scopes
                }
            });
        return
    });
};

/**
 * For developement only! Generates an auth code the applyAuthEndpoint.
 * @param {string} clientId The clientId you want to generate an authCode for.
 * @param {string} userId The userId you want to generate an authCode for.
 * @param {string[]} scopes The scopes you want to apply for
 * @return {Promise<string|Error>} Resolves with the auth code or rejects with an Error.
 */
export const applyAuthCode = async (clientId: string, userId: string, scopes: string) => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(Messages.applyAuthCode, (error, data) => {
            try {

                if (error) {

                    reject(error);
                    console.error(`Error in applyAuthCode: ${error?.message}`, {
                        error,
                        params: {
                            clientId,
                            userId,
                            scopes
                        }
                    });
                    return;
                }

                const {
                    authCode,
                    authErrorScopes
                } = data;

                if (!!authErrorScopes && Object.keys(authErrorScopes).length > 0) {

                    console.warn('Could not get auth for all scopes', authErrorScopes);
                }

                if (!authCode) {

                    reject(new Error('Could not get auth code'));
                    console.error('Error in applyAuthCode: Could not get auth code', {
                        params: {
                            clientId,
                            userId,
                            scopes
                        }
                    });
                    return;
                }

                resolve(authCode);

            } catch (err) {

                reject(err);
            }
        },
            {
                data: {
                    clientId,
                    userId,
                    scopes
                }
            });
    });
};

/**
 * Calls the device's vibrate function. At the time of writing it's unclear if there is any standard
 * vibration length or if it's device dependant.
 * @return {Promise<void>} Resolves after the vibrate happened.
 */
export const vibrate = async () => {
    return new Promise<void>(resolve => {
        postMessageToMiniProgram(Messages.vibrate, () => {
            resolve();
        });
    });
};

/**
 * Gets the network type. Unclear if this is really reliable.
 * @return {Promise<{networkAvailable: boolean, networkType: string}>} The type of the network and if it's available.
 * @throws {Error}
 */
export const getNetworkType = async () => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(Messages.getNetworkType, (error: any, data: any) => {
            if (error) {
                reject(error);
                console.error(`Error in getNetworkType: ${error?.message}`, {
                    error
                });
                return;
            }

            resolve(data);
        });
    });
};

/**
 * Sets whether the screen should stay awake. Only works in the context of the current mini program.
 * @param {boolean} val Whether the screen should stay awake or not.
 * @returns {Promise<void>} Resolves when the setting has been set.
 */
export const setKeepScreenOn = (val: boolean) => {
    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.setKeepScreenOn,
            (error) => {
                if (error) {
                    reject(error);
                    console.error(`Error in setScreenOn: ${error?.message}`, {
                        error
                    });
                    return;
                }

                resolve();
            },
            {
                data: {
                    value: val
                }
            }
        );
    });
};

/**
 * @typedef {Object} TradePayResult
 * @property {boolean} success Result of the payment, true for success, otherwise false.
 * @property {boolean} [isProcessing] If the trade is still in processing.
 * @property {string} error Additional error code sent by tradePay
 * @property {string} code Result code from tradePay
 * @property {string} message Description of the result code
 */

/**
 * Initiates the trade pay functionality inside the mini program.
 * @param {String} paymentUrl The payment url
 * @returns {Promise<TradePayResult>} The result of the tradePay process.
 */
export const tradePay = async (paymentUrl: string) => {

    return new Promise((resolve) => {

        miniProgramApi.tradePay({
            paymentUrl: paymentUrl,
            success: (res: any) => {

                if (!!res?.error) {

                    resolve({
                        success: false,
                        error: res?.error || 'Unknown',
                        code: res?.resultCode || '-1',
                        message: TradePayResultCodes[res.resultCode] || 'Unknown error'
                    });
                    return;
                }

                resolve({
                    success: res?.resultCode === '9000',
                    isProcessing: res?.resultCode === '8000', //Added this because not sure if a processing trade is seen as successful or not.
                    code: res?.resultCode || '-1',
                    message: TradePayResultCodes[res.resultCode] || 'Unknown result code'
                });
            },
            fail: (res: any) => {

                resolve({
                    success: false,
                    error: res?.error || 'Unknown',
                    code: res?.resultCode || '-1',
                    message: TradePayResultCodes[res.resultCode] || 'Unknown error'
                });
                console.error(`Error in tradePay: ${TradePayResultCodes[res.resultCode] || 'Unknown error'}`, {
                    params: {
                        paymentUrl
                    }
                });
            }
        });
    });
};


/**
 * Get an item from the Mini Program storage.
 * @param {string} key The key of the item you want to return
 * @returns {Promise<string|object|Error>} Resolved with the item that was store or rejects with an error if it failed.
 */
export const getStorageSync = async (key: string) => {

    if (!key || typeof key !== 'string') {

        console.error('Error in getStorageSync: Invalid "key" passed to getStorageSync', {
            params: {
                key
            }
        });
        return Promise.reject(Error('Invalid "key" passed to getStorageSync'));
    }

    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.getStorageSync,
            (error: any, data: any) => {

                if (error) {

                    reject(error);
                    console.error(`Error in getStorageSync: ${error.message}`, {
                        error,
                        params: {
                            key
                        }
                    });
                    return;
                }

                resolve(data);
            },
            {
                data: {
                    key
                }
            }
        )
    });
}

/**
 * Get an item from the Mini Program storage.
 * @param {string} key The key of the item you want to return
 * @returns {Promise<string|object|Error>} Resolved with the item that was store or rejects with an error if it failed.
 */
export const getStorage = async (key: string) => {

    if (!key || typeof key !== 'string') {

        console.error('Error in getStorage: Invalid "key" passed to getStorage', {
            params: {
                key
            }
        });
        return Promise.reject(Error('Invalid "key" passed to getStorage'));
    }

    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.getStorage,
            (error: any, data: any) => {

                if (error) {

                    reject(error);
                    console.error(`Error in getStorage: ${error.message}`, {
                        error,
                        params: {
                            key
                        }
                    });
                    return;
                }

                resolve(data);
            },
            {
                data: {
                    key
                }
            }
        )
    });
}

/**
 * Sets an item in Mini Program storage.
 * @param {string} key The key you want to store.
 * @param {string|object} value The value you want to store.
 * @returns {Promise<void|Error>} Resolves when storage has been set or rejects with en error if it failed.
 */
export const setStorage = async (key: string, value: any) => {

    if (!key || typeof key !== 'string') {

        console.error('Error in setStorage: Invalid "key" passed to setStorage', {
            params: {
                key,
                value
            }
        })
        return Promise.reject(Error('Invalid "key" passed to setStorage'));
    }

    if (value === undefined) {

        console.error('Error in setStorage: Invalid "value" passed to setStorage', {
            params: {
                key,
                value
            }
        });
        return Promise.reject(Error('Invalid "value" passed to setStorage'));
    }

    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.setStorage,
            (error) => {

                if (error) {

                    reject(error);
                    console.error(`Error in setStorage: ${error?.message}`, {
                        error,
                        params: {
                            key,
                            value
                        }
                    });
                    return;
                }

                resolve();
            },
            {
                data: {
                    key,
                    value
                }
            }
        )
    });
}

/**
 * Sets an item in Mini Program storage.
 * @param {string} key The key you want to store.
 * @param {string|object} value The value you want to store.
 * @returns {Promise<void|Error>} Resolves when storage has been set or rejects with en error if it failed.
 */
export const setStorageSync = async (key: string, value: any) => {

    if (!key || typeof key !== 'string') {

        console.error('Error in setStorageSync: Invalid "key" passed to setStorageSync', {
            params: {
                key,
                value
            }
        })
        return Promise.reject(Error('Invalid "key" passed to setStorageSync'));
    }

    if (value === undefined) {

        console.error('Error in setStorage: Invalid "value" passed to setStorageSync', {
            params: {
                key,
                value
            }
        });
        return Promise.reject(Error('Invalid "value" passed to setStorageSync'));
    }

    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.setStorageSync,
            (error) => {

                if (error) {

                    reject(error);
                    console.error(`Error in setStorage: ${error?.message}`, {
                        error,
                        params: {
                            key,
                            value
                        }
                    });
                    return;
                }

                resolve();
            },
            {
                data: {
                    key,
                    value
                }
            }
        )
    });
}

/**
 * Removes a specific key from the Mini Program storage.
 * @param {string} key The key you want to remove from Mini Program storage.
 * @returns {Promise<void|Error>} Resolves if the item has been removed or rejects with an error when it failed.
 */
export const removeStorage = async (key: string) => {

    if (!key || typeof key !== 'string') {

        console.error('Error in removeStorage: Invalid "key" passed to removeStorage', {
            params: {
                key
            }
        });
        return Promise.reject(Error('Invalid "key" passed to removeStorage'));
    }

    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.removeStorage,
            (error) => {

                if (error) {

                    reject(error);
                    console.error(error);
                    console.error(`Error in removeStorage: ${error?.message}`, {
                        error,
                        params: {
                            key
                        }
                    });
                    return;
                }

                resolve();
            },
            {
                data: {
                    key
                }
            }
        )
    });
}

/**
 * Clears all items from the Mini Program storage.
 * @returns {Promise<void|Error>} Resolved when all items have been removed or rejects with an error when it failed.
 */
export const clearStorage = async () => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.clearStorage,
            (error: any, data: any) => {

                if (error) {

                    reject(error);
                    console.error(`Error in clearStorage: ${error?.message}`, {
                        error
                    });
                    return;
                }

                resolve(data);
            },
            {}
        )
    });
}

/**
 * Gets the current Mini App Id.
 * @returns {Promise<string|Error>} Resolves when an App Id is returned or rejects with an error if something failed.
 */
export const getAppId = () => {
    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.getAppId,
            (error: any, data: any) => {

                if (error) {

                    reject(error);
                    console.error(`Error in getAppId: ${error?.message}`, {
                        error
                    });
                    return;
                }

                resolve(data.appId);
            }
        );
    });
}

/**
 * Deeplink to vodapay native app.
 * Please note: To use this function, a mini program requires access to "Restricted_App_Features", feature access can be requested via the mini program developer dashboard.
 * @param {string} uri The uri you want deeplink to.
 * @returns {Promise<string|Error>} Resolves when a deeplink is opened or Rejects when fails
 */
export const deeplink = (uri: string) => {

    if (!uri || typeof uri !== 'string') {

        console.error('Error in deeplink: Invalid "uri" passed to deeplink', {
            params: {
                uri
            }
        });
        return Promise.reject(Error('Invalid "uri" passed to deeplink'));
    }

    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.deeplink,
            (error) => {

                if (error) {

                    console.error(`Error in deeplink: ${error?.message}`, {
                        error,
                        params: {
                            uri
                        }
                    });
                    reject(error);
                    return;
                }

                resolve();
            },
            {
                data: {
                    uri
                }
            }
        );
    });
}

/**
 * Open link in device browser app.
 * Please note: To use this function, a mini program requires access to "Restricted_App_Features", feature access can be requested via the mini program developer dashboard.
 * @param {string} url The url you want open in browser.
 * @returns {Promise<string|Error>} Resolves when a browser is opened or Rejects when fails
 */
export const openBrowser = (url: string) => {

    if (!url || typeof url !== 'string') {

        console.error('Error in openBrowser: Invalid "url" passed to the openBrowser', {
            params: {
                url
            }
        });
        return Promise.reject(Error('Invalid "url" passed to openBrowser'));
    }

    return new Promise<void>((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.openBrowser,
            (error: any, data: any) => {

                if (error) {

                    console.error(`Error in openBrowser: ${error?.message}`, {
                        error,
                        params: {
                            url
                        }
                    });
                    reject(error);
                    return;
                }

                resolve();
            },
            {
                data: {
                    url
                }
            }
        );
    });
}

/**
 * Tracks an Adjust event using the native VodaPay Adjust SDK.
 * Please note: To use this function, a mini program requires access to "Restricted_App_Features", feature access can be requested via the mini program developer dashboard.
 * @param {string} eventToken The token for the adjust event.
 * @returns {Promise<void|Error>} Resolves when the event has been tracked or rejects with an error if it failed.
 */
export const adjustTrackEvent = (
    eventToken: string,
    {
        revenue = null,
        partnerParameter = null,
        callbackParameter = null,
        callbackId = null,
    } = {}) => {

    if (!eventToken || typeof eventToken !== 'string') {

        console.error('Error in adjustTrackEvent: Invalid "eventToken" passed to adjustTrackEvent', {
            params: {
                eventToken
            }
        });
        return Promise.reject(Error('Invalid "eventToken" passed to adjustTrackEvent'));
    }

    return new Promise((resolve, reject) => {
        postMessageToMiniProgram(
            Messages.adjustTrackEvent,
            (error: any, data: any) => {

                if (error) {

                    console.error(`Error in adjustTrackEvent: ${error?.message}`, {
                        error,
                        params: {
                            eventToken
                        }
                    });
                    reject(error);
                    return;
                }

                resolve(data);
            },
            {
                data: {
                    token: eventToken,
                    revenue,
                    partnerParameter,
                    callbackParameter,
                    callbackId
                }
            }
        );
    });
}