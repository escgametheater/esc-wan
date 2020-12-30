import {
    config,
    hostDB,
    winston,
    appName,
    hostVersion,
} from "./imports";

import axios from "axios";
import SHA256 from 'crypto-js/sha256'

import Promise from 'promise';

import axiosCookieJarSupport from 'axios-cookiejar-support';
import tough from 'tough-cookie';
import dot from "dot-object";
import {TriviaGame} from "../trivia";


axiosCookieJarSupport(axios);

const platformSlugs = {
    'aix': '?',
    'darwin': 'mac',
    'freebsd': 'linux',
    'linux': 'linux',
    'openbsd': 'linux',
    'sunos': '?',
    'win32': 'win'
};

const cookieJar = new tough.CookieJar();
const platformSlug = platformSlugs[process.platform];

const baseURL = config.baseUrl;

console.warn("ESC Platform: " + baseURL);

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    jar: cookieJar
});

api.defaults.headers.common['Content-Type'] = "application/json";
api.defaults.headers.common['User-Agent'] = `${appName} - ${hostVersion} - ${platformSlug}`;

const apiV1RequestEnvelope = (payload) => {
    return {
        meta: {
            client_request_id: null,
            expand: null
        },
        payload: payload
    };
};

const axiosPost = (url, payload, handleResponse, handleError) => {
    console.log("axiosPost to "+baseURL+url, JSON.stringify(payload));
    return new Promise((resolve, reject) => {
        if (config.api.enabled) {
            api.post(baseURL + url, payload)
                .then((response) => {
                    resolve(handleResponse(response));
                })
                .catch((error) => {
                    // handle error
                    if (checkForGetAddrInfoError(error)) {
                    }
                    else if (!error.response) {
                        console.log(`API ERROR[${baseURL} ${url}]`, error);
                        console.log(`response`, error.request.res);
                    }
                    else if (!error.response.data) {
                        console.log(`API ERROR[${baseURL} ${url}]`, error.response);
                    }
                    else {
                        console.log(`API ERROR[${baseURL} ${url}]`, JSON.stringify(error.response.data, null, 2));
                    }
                    resolve(handleError(error));
                })
                .then(() => {
                    //console.log("axiosPost then reached, url:" + url,payload);
                    // always executed
                });
        }
        else {
            resolve(false);
        }
    });
};

const checkForGetAddrInfoError = (error) => {
    if (error && error.syscall === "getaddrinfo") {
        console.error(`API call returned getaddrinfo error code ${error.code} - probably lost Internet connection or too many DNS lookups per second`);
        return true ;
    }
    return false
};

const getFile = (url, progressFunction) => {

    return new Promise((resolve, reject) => {
        if (config.api.enabled) {
            api.post(url, {}, {
                responseType: 'stream',
                onDownloadProgress: progressFunction,
                onUploadProgress: progressFunction
            }).then((response) => {
                resolve(response);
            }).catch((error) => {
                console.error("getFile returned error",error);
                resolve(error);
            })
        }
        else {
            resolve(false);
        }
    });
};

const setToken = function (token) {
    api.defaults.headers.common['Authorization'] = "Bearer " + token;
};


const getPasswordHash = function(password) {
    return SHA256(password + config.passwordSalt).toString();
};

/**
 *
 * @param params username, password
 * @returns {Promise<*|Promise>}
 */
const getToken = async function (params) {
    const {username, password} = params;
    const passwordHash = getPasswordHash(password);
    const loginAttempt = hostDB && await hostDB.insertData(hostDB.tables['login_attempt'], {
        username,
        password_hash: passwordHash,
        created_at: new Date(),
        success: false
    });

    // attempt to get a token
    let url = '/v1/auth/request-token/';

    const apiParams = {
        email: username,
        password_hash: passwordHash,
        host_version: hostVersion,
        platform_slug: platformSlug,
    };

    return axiosPost(
        url,
        apiV1RequestEnvelope(apiParams),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.error("No response payload! Response:",response.data || response);
                return null ;
            }
            const result = response.data.payload.results[0];
            console.log("Login result",result);

            setToken(result.token);

            if (!hostDB) {
                return result;
            }

            const user = result.user;
            const host = user.hosts[0];
            const network = host.networks[0];
            const screens = host.screens[0];

            try {
                await hostDB.insertData(hostDB.tables['user'], user);
            }
            catch (e) {
                console.log(e);
            }
            try {
                await hostDB.insertData(hostDB.tables['host'], {
                    user_id: user.id,
                    ...host
                });
            }
            catch (e) {
                console.log(e);
            }
            try {
                await hostDB.insertData(hostDB.tables['network'], network);
            }
            catch (e) {
                console.log(e);
            }
            try {
                await hostDB.insertData(hostDB.tables['screen'], screens);
            }
            catch (e) {
                console.log(e);
            }

            await hostDB.insertData(hostDB.tables['token'], result);
            await hostDB.run(`update login_attempt set success = 1 where id = ?`, [loginAttempt.lastId]);
            return result;
        },
        async (error) => {
            if (winston) {
                winston.error("API Error: ", error.message);
            }
            return error.response.data.payload.errors;
        }
    );
};

/**
 *
 * @returns {Promise<*|Promise>}
 */
const logout = async function () {
    // invalidate the current token
    let url = '/v1/auth/logout/';
    return axiosPost(
        url,
        apiV1RequestEnvelope({}),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.warn("No response payload.",response.data || response);
                return null ;
            }
            const result = response.data.payload.results[0];
            api.defaults.headers.common['Authorization'] = "";
            if (hostDB) {
                await hostDB.run(`update token set expires_on = ? where id = ?`, [result.expires_on, result.id]);
                // update token table to mark as invalid
            }
            return result;
        },
        async (error) => {
            return error.response.data.payload.errors;
        }
    );
};


/**
 *
 * @param params hostId, ipAddress
 * @returns {Promise<*|Promise>}
 */
const createHostInstance = async (params) => {
    const {hostId, networkId, ipAddress, port, location} = params;
    let requestEnvelope = apiV1RequestEnvelope({
        host_id: hostId,
        network_id: networkId,
        local_ip_address: ipAddress,
        local_port: port,
        start_time: new Date().getTime(),
        is_active: 1,
        host_version: hostVersion,
        platform_slug: platformSlug,
        ...location,
    });

    console.log("Start Host Instance", requestEnvelope);

    return axiosPost(
        '/v1/hosts-instances/create/',
        requestEnvelope,
        async (response) => {
            // handle success
            if (!response.data || !response.data.payload) {
                console.warn("No response payload.",response.data || response);
                return null ;
            }
            const result = response.data.payload.results[0];
            if (hostDB) {
                await hostDB.insertData(hostDB.tables['host_instance'], result);
            }
            return result;
        },
        async (error) => {
            return error.response.data.payload;
        }
    );
};

/**
 *
 * @param params hostInstanceId
 * @returns {Promise<*|Promise>}
 */


/*
Differences in result between active host instance and timed out
<   dns_is_active: 1,
>   dns_is_active: 0,

<   end_time: null,
>   end_time: '2019-01-26 23:58:01',

<   exit_status: null,
>   exit_status: 'timed-out',

<   modified_by: '8cd6eb00-281c-480a-8b68-dac110e2cd7e',
>   modified_by: '8cd6f18b-d979-432a-95a4-aa44a47832cc',
 */
const pingHostInstance = async (params, onExit) => {
    const {hostInstanceId} = params;
    return axiosPost(
        '/v1/hosts-instances/ping/',
        apiV1RequestEnvelope({
            id: hostInstanceId
        }),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.error("No response payload to hosts-instances/ping/ request.",response.data || response);
                return {
                    error:pingHostInstance.NODATA,
                    result:response
                } ;
            }
            const result = response.data.payload.results[0];
            if (result.exit_status) {
                console.log("Host Instance exited, status: "+result.exit_status);
                const returnVal = {
                    error:result.exit_status,
                    result:response
                } ;
                if (onExit) {
                    onExit(returnVal);
                }
                return returnVal ;
            }
            if (hostDB) {
                await hostDB.run(`update host_instance set last_ping_time = ? where id = ?`, [result.last_ping_time, result.id]);
            }
            return {
                error:false,
                result
            } ;
        },
        async (error) => {
            return {
                error:pingHostInstance.ERROR,
                result:error
            } ;
        }
    );
};
pingHostInstance.NODATA = "no-data";
pingHostInstance.ERROR = "error";
pingHostInstance.HOST_TIMED_OUT = "timed-out";

const stopHostInstance = async (params) => {
    const {hostInstanceId} = params;

    return axiosPost(
        '/v1/hosts-instances/stop',
        apiV1RequestEnvelope({
            id: hostInstanceId
        }),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.warn("/v1/hosts-instances/stop - No response payload.",response.data || response);
                return null ;
            }
            const result = response.data.payload.results[0];
            if (hostDB) {
                await hostDB.run(
                    `update host_instance set end_time = ? where id = ?`, [result.end_time, result.id]);
            }
            return result;
        },
        async (error) => {
        }
    );
};


const listGames = async () => {

    return axiosPost(
        '/v1/games/list/',
        apiV1RequestEnvelope({}),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.error("listGames: No response payload.",response.data || response);
                return [] ;
            }
            const results = response.data.payload.results ;
            if (!Array.isArray(results)) {
                console.error("listGames: results not an array: ",results);
                return [] ;
            }
            return results;
        },
        async (error) => {
            console.error("listGames: error: ",error);
            return [];
        }
    );
};

const getUserAccount = async (params) => {
    const {requestId, userId} = params;

    console.log("GET USER ACCOUNT REQUEST ID", requestId);
    console.log("GET USER ACCOUNT USER ID", userId);

    if(userId === 0) {
        return   { type: 'UserEntity',
            id: 0,
            username: 'Anonymous',
            email_address: '',
            phone_number: '',
            is_verified: 0,
            current_timestamp: new Date(),
            avatar_url: 'https://www.esc.games/static/images/avatars/no-avatar.jpg',
            avatar_small_url: 'https://www.esc.games/static/images/avatars/no-avatar.jpg',
            avatar_tiny_url: 'https://www.esc.games/static/images/avatars/no-avatar.jpg',
            has_avatar: false,
            avatar: [],
            admin_edit_url: null,
            display_name: 'Anonymous',
            first_name: '',
            last_name: '',
            gender_id: 0,
            has_beta_access: 0,
            ui_language_id: 'en'
        };
    }

    return axiosPost(
        '/v1/auth/validate-auth',
        apiV1RequestEnvelope({
            request_id: requestId,
            user_id: userId
        }),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.warn("v1/auth/validate-auth - No response payload.",response.data || response);
                return null ;
            }
            console.log("v1/auth/validate-auth - Success.");
            return response.data.payload.results[0];
        },
        async (error) => {
            console.log("v1/auth/validate-auth - Error.");
            return error.response.data.payload.results[0];
        }
    );
};

const inviteUsers = async (params) => {
    const {hostInstanceId, gameInstanceId, emails, phoneNumbers} = params;

    console.log("API - Invite Users ", params);

    return axiosPost(
        '/v1/hosts-instances/invite-users',
        apiV1RequestEnvelope({
            host_instance_id: hostInstanceId,
            game_instance_id: gameInstanceId,
            emails: emails,
            phone_numbers: phoneNumbers
        }),
        async (response) => {
            if (!response.data || !response.data.payload) {
                console.warn("v1/host-instance/invite-users - No response payload.",response.data || response);
                return null ;
            }
            console.log("v1/host-instance/invite-users - Success.");
            return response.data.payload.results;
        },
        async (error) => {
            console.log("v1/host-instance/invite-users - Error.");
            return error.response.data.payload.results[0];
        }
    );
};


/**
 *
 * @param params gameId, hostInstanceId, gameBuildId, minimumPlayers, maximumPlayers
 * @returns {Promise<*|GameInstance>}
 */
const createGameInstance = async (params) => {
    const {gameId, hostInstanceId, gameBuildId, gameModBuildId, activationId, minimumPlayers, maximumPlayers} = params;
    return axiosPost(
        '/v1/games-instances/create/',
        apiV1RequestEnvelope({
            game_id: gameId,
            game_build_id: gameBuildId,
            game_mod_build_id: gameModBuildId,
            host_instance_id: hostInstanceId,
            activation_id: activationId,
            start_time: new Date().getTime(),
            minimum_players: minimumPlayers,
            maximum_players: maximumPlayers,
            is_active: 1,
            notify_sms: false,
        }),
        async (response) => {
            // handle success
            if (!response.data || !response.data.payload) {
                console.warn("No response payload.",response.data || response);
                return null ;
            }
            const result = response.data.payload.results[0];
            if (hostDB) {
                await hostDB.insertData(hostDB.tables['game_instance'], result);
            }
            return result;
        },
        async (error) => {
            return error.response.data.payload;
        }
    );
};

const stopGameInstance = async (params) => {
    const {gameInstanceId} = params;
    return axiosPost(
        '/v1/games-instances/stop/',
        apiV1RequestEnvelope({
            id: gameInstanceId
        }),
        async (response) => {
            // handle success
            // TODO - update local game_instance
            if (response.data && response.data.payload) {
                if (!response.data || !response.data.payload) {
                    console.warn("No response payload.",response.data || response);
                    return null ;
                }
                return response.data.payload.results[0];
            }
            else {
                return null ;
            }
        },
        async (error) => {
            return error.response.data.payload;
        }
    );
};

const camelToSnake = (s) => {
    // Converts CamelCaseAB, camelCaseAB, and camelCaseAb to camel_case_ab
    return s.replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase();
};
const snakeToCamel = (s) => {
    // Converts camel_case_ab to camelCaseAb
    // Note that it's not the exact inverse of camelToSnake,
    // unless the camelCase word doesn't start with a capital and doesn't have 2 capitals in a row
    return s.replace(/(_\w)/g, function(k) {
        return k[1].toUpperCase();
    });
};

const camelToSnakeObject = (c) => {
    let s = {} ;
    for (let k in c) {
        s[camelToSnake(k)] = c[k];
    }
    return s ;
};

const apiPostSimple = async (url, params, handleResponse, handleError) => {
    if (url.startsWith("http")) {

        // http//foo.com/bar -> /bar
        url = url.substring(url.indexOf("/", url.indexOf("//")+2));

        console.log("apiPostSimple Split domain off of url. Now "+url);
    }
    return axiosPost(
        url,
        apiV1RequestEnvelope(camelToSnakeObject(params)),
        async (response) => {
            //console.log("apiPostSimple Got API response.");
            if (handleResponse) {
                handleResponse(response);
            }
            //console.log("apiPostSimple handled API response.");
            if (response.data && response.data.payload) {
                return response.data.payload.results;
            }
            else {
                console.error("api post to "+url+" did not return a payload.",camelToSnakeObject(params),response.data || response);
                return [] ;
            }
        },
        async (error) => {
            console.log("apiPostSimple Got API error.",error);
            if (handleError) {
                handleError(error) ;
            }
            return error;
            //return error.response.data.payload;
        }
    );
};

const sqlTime = (t)=> {
    if (t)
        return new Date(t).toJSON().replace("T"," ").split(".",1)[0];
    else
        return new Date().toJSON().replace("T"," ").split(".",1)[0];
};

// https://escgames.atlassian.net/browse/SH-166
const apiAddPlayer = async (params) => {
    params.startTime = params.startTime || sqlTime();
    params.userId = params.userId || 0 ;
    console.log("Sending addPlayer ",params);

    return apiPostSimple('/v1/games-instances/add-game-round-player/',params);
};

// https://escgames.atlassian.net/browse/SH-166
const apiRemovePlayer = async (params) => {
    params.endTime = params.endTime || sqlTime();
    console.log("Sending removePlayer ",params);

    return apiPostSimple('/v1/games-instances/remove-game-round-player/',params);
};

const apiStartGameRound = async (params) => {
    params.startTime = params.startTime || sqlTime();
    console.log("Sending startGameRound ",params);
    return apiPostSimple('/v1/games-instances/start-game-round/',params);
};

const apiStopGameRound = async (params) => {
    params.endTime = params.endTime || sqlTime();
    if(params.id) {
        console.log("Sending stopGameRound ",params);
        return apiPostSimple('/v1/games-instances/stop-game-round/',params);
    }
    else {
        console.log("Skipping stopGameRound ",params);
        return null;
    }
};

const apiTrackEvent = async (params) => {
    params.createTime = params.createTime || sqlTime();
    //console.log("Sending apiTrackEvent ",params);
    return apiPostSimple('/v1/games-instances/track-event/',params);
};

const apiSmsAdmin = async (params) => {
    return apiPostSimple('/v1/games-instances/send-sms-admin', {
        id: params.gameInstanceId,
    });
};

function apiHandleDataRows(result) {
    if (!Array.isArray(result) || result.length === 0) {
        console.log("No data received!");
        return [];
    }
    const resultConverted = result.map(apiConvertRow);
    console.log("Rows received: " + result.length + ", first row:",resultConverted[0]);
    console.log("last row",resultConverted[result.length-1]);
    return resultConverted;
}

async function apiGetDataRows(slug, key, name, offset, count) {
    console.log("Local:",TriviaGame.triviaData[offset]);
    return apiPostSimple("/v1/games-data/get-sheet-data",{
        slug, key, name, offset, count
    }).then(apiHandleDataRows).catch((err) => {
        console.log("Error:",err);
        process.abort();
    });
}

function apiConvertRow(row) {
    return dot.object(row);
}

export {
    getFile,
    getPasswordHash,
    getToken,
    logout,
    listGames,
    getUserAccount,
    inviteUsers,
    createHostInstance,
    pingHostInstance,
    stopHostInstance,
    createGameInstance,
    stopGameInstance,
    apiAddPlayer,
    apiRemovePlayer,
    apiPostSimple,
    apiStartGameRound,
    apiStopGameRound,
    apiTrackEvent,
    sqlTime,
    apiSmsAdmin,
    apiGetDataRows,
};
