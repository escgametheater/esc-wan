const LOG_ERROR = 0;
const LOG_WARN = 1;
const LOG_INFO = 2;
const LOG_DEBUG = 3;

let config = {
    api: {
        host: 'https://api.esc.games',
        //hostDev: 'https://api.qa2.playesc.com',
        //hostDev: 'https://api.esc.games',
        hostDev: 'http://api.local.playesc.com',
        pingInterval: 10000,
        enabled: true,
    },
    location: {

    },
    passwordSalt: `<<<REDACTED>>>`,
    loggly : {
        token: "<<<REDACTED>>>"
    },
    logLevel: {
        main: LOG_WARN,
        DB: LOG_WARN,
        API: LOG_WARN,
        actions: LOG_WARN,
        connections: LOG_WARN,
        pubNub: LOG_WARN,
        webSocket: LOG_WARN
    }
};

const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    console.log("Is dev");
}
config.baseUrl = isDev ? config.api.hostDev : config.api.host;

config = {
    ...config,
    LOG_ERROR,
    LOG_WARN,
    LOG_INFO,
    LOG_DEBUG,
    isDev
};

module.exports = config ;
