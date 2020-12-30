import uuid from 'uuid';
import {env, pubnubConfig, escConfig} from "./env";
import * as config from './config';
import * as Constants from "../common/constants";
import {formatTime} from "../common/functions";
import {/*testCoinAwards,*/ guestHashList, addGuestHash, generateGuestHashes} from "./coins";
import {startSubscriber, publishMessage} from "./pubnub";
import redis from "redis";

import {TriviaGame} from "./trivia";
const readline = require('readline');
import {
    getToken,
    listGames,
} from './API';

// TODO: read port from redis.conf ?
// We're not using the default redis port of 6379 so we can run this on the same machine as our API
const redisPort = process.env.REDIS_PORT || 63790 ;
const redisCoinsPort = process.env.REDIS_COINS_PORT || redisPort ;

// TODO: get api User email and password or token from env
const apiUserEmail = "admin@esc.local";
const apiUserPassword = "none";

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

//const slug = process.env.NODE_ENV !== 'production' ? require("os").hostname().replace(/\./g, "-") : "esc-trivia-live";
const slugs = ["test1","test2"];
const cueSpeed = process.env.NODE_ENV !== 'production' ? 2 : 1 ; // How fast to play the cues

function getLogChannel(apiHost,gameSlug) {
    const hostSplit = apiHost.split("://",2);
    let apiDomain = "unknown";
    if (hostSplit.length < 2) {
        console.error("Unexpected api host: ",apiHost);
    }
    else {
        apiDomain = hostSplit[1].replace(/\./g,"_");
    }
    return apiDomain + "." + gameSlug + ".log" ;
}

// TODO: send errors etc. to logChannel

class GameContext {
    constructor(slug) {
        this.slug = slug ;
        this.gameState = initialGameState(slug);
        this.db = {};
        this.db.stateClient = false ;
        this.db.statePrefix = false ;
        this.db.stateMulti = false ;
        this.db.coinsClient = false ;
        this.db.coinsPrefix = false ;
        this.cueIntervalId = false ;
        this.cues = false ;
        this.cueIndex = -1 ;
        this.cuesPaused = false ;
        this.haltCuesWhenInactive = false ;
        this.pubnubConnection = false ;
        this.pubnubConfig = false ;
        this.messageHandler = false ;
        this.publishChannel = false ;
        this.coinsChannel = false ;
        this.subscribeChannels = false ;
        this.gameObject = null ;
        this.logChannel = false ;

        GameContext.BySlug[slug] = this ;
    }
    startPubNub() {
        this.pubnubConnection = startSubscriber(this.subscribeChannels, this.pubnubConfig, this.messageHandler(this));
    }
    initDb() {
        this.db.stateClient = redis.createClient({
            port: redisPort,
            host: process.env.REDIS_URL,
            prefix: this.db.statePrefix + Constants.DB_SEPARATOR + this.slug + Constants.DB_SEPARATOR
        });

        this.db.coinsClient = redis.createClient({
            port: redisCoinsPort,
            host: process.env.REDIS_URL,
            prefix: this.db.coinsPrefix + Constants.DB_SEPARATOR + this.slug + Constants.DB_SEPARATOR
        });

        this.db.stateMulti = this.db.stateClient.multi();
        setInterval(() => {
            this.flushMulti();
        },100);
    }
    flushMulti() {
        this.db.stateMulti.exec();
        this.db.stateMulti = this.db.stateClient.multi();
    }
    startCues() {
        const totalCueDuration = 1/cueSpeed * this.cues.reduce((time, c) => time+c.duration, 0);

        this.cueIntervalId = setInterval( () => {
            this.cueIndex = -1 ;
            this.chainCues();
        }, totalCueDuration * 1000);

        console.log(`\n\n\n\n${formatTime()} STARTING CUE SERVER FOR SLUG ${this.slug}, interval ${totalCueDuration} seconds.`);
        this.pubnubLog({
            method:"startCues",
            data: {
                totalCueDuration
            }
        });
        this.chainCues();
    }
    stopCueInterval() {
        if (this.cueIntervalId) {
            clearInterval(this.cueIntervalId);
            this.cueIntervalId = null ;
        }
    }
    haltCuesGracefully() {
        this.stopCueInterval();
        this.haltCuesWhenInactive = true ;
    }
    broadcast(eventName,body) {
        let message = {
            eventName,
            body
        };

        console.log(formatTime()+ " broadcasting " + JSON.stringify(message)+"\n");
        publishMessage(this.pubnubConnection,this.publishChannel,message);
    }
    pubnubLog(message, customMeta) {
        let meta = {
            timestamp: Date.now(),
            slug:this.slug,
            gameSlug:this.gameObject.gameSlug,
            ...customMeta
        };
        // userMetadata does not seem to be available in pubnub history, so repeating it in message
        let fullMessage = {
            ...message,
            meta
        };
        publishMessage(this.pubnubConnection,this.logChannel,fullMessage,meta);
    }
    runCue(cue) {
        console.log(`******* Slug ${this.slug}, Cue ${this.cueIndex}: ${cue.phase}`);
        const gameState = this.gameState ;
        gameState.slug = this.slug ;
        gameState.phase = cue.phase;
        gameState.phaseStart = Date.now();
        gameState.phaseDuration = cue.duration/cueSpeed;

        cue.message(cue, this).then((resolvedMessage) => {

            dbSaveGameState(this.db.stateClient,gameState);
            if (!resolvedMessage) {
                console.log(formatTime()+" "+cue.phase+" no message to be sent.");
                return ;
            }

            let message = {
                eventName: Constants.UC_PHASE_CHANGE,
                body: {
                    phaseStats: {
                        phase: gameState.phase,
                        phaseStart: gameState.phaseStart,
                        phaseDuration: gameState.phaseDuration,
                        ...resolvedMessage
                    },
                }
            };

            console.log(formatTime()+" "+cue.phase+" publishing "+JSON.stringify(message.body.phaseStats)+"\n");
            publishMessage(this.pubnubConnection,cue.channel || this.publishChannel,message);
            console.log(formatTime()+" "+cue.phase+" published");
        });
    }
    runNextCue() {
        this.cueIndex += 1 ;
        if (this.cueIndex >= this.cues.length) {
            this.cueIndex = 0
        }
        this.runCue(this.cues[this.cueIndex]);
    }
    pauseCues() {
        this.cuesPaused = true ;
        this.stopCueInterval();
    }
    chainCues() {
        if (this.cuesPaused) {
            return ;
        }
        // Run all cues in succession, chaining with setTimeout
        // Halt if haltCuesWhenInactive is true, when roundActive is false for this cue or next
        const nextIndex = this.cueIndex + 2 ;
        if (nextIndex < this.cues.length ) {
            setTimeout(() => {
                // Halt if haltCuesWhenInactive is true, when roundActive is false for this cue or next
                if (this.haltCuesWhenInactive) {
                    if (!this.cues[this.cueIndex].roundActive) {
                        this.haltCuesWhenInactive = false ;
                        return ;
                    }
                    const nextIndex = this.cueIndex + 1 ;
                    if (nextIndex >= this.cues.length) {
                        this.haltCuesWhenInactive = false ;
                        return ;
                    }
                    if (!this.cues[nextIndex].roundActive)  {
                        this.haltCuesWhenInactive = false ;
                        return ;
                    }
                }
                this.chainCues();
            }, this.cues[this.cueIndex+1].duration * 1000 / cueSpeed);
        }
        this.runNextCue();
    }
    runCuesOnce() {
        let offset = 0;
        this.cues.forEach((cue,i) => {
            this.cueIndex = i ;
            cue.timeoutID = setTimeout(() => {
                cue.timeoutID = undefined ;
                this.runNextCue();
            }, offset);
            offset += cue.duration * 1000 / cueSpeed;
        });
    }

}
GameContext.BySlug = {};

const processUuid = uuid();

console.log(processUuid, "ESC Trivia Live");
console.log(processUuid, "pubnub config", pubnubConfig);
console.log(processUuid, "apiConfig", escConfig);
console.log(processUuid, "env", env);

// TODO: get game state from redis at startup.
// TODO: track active trivia servers on redis, work as a slave if another is active
function initialGameState(slug) {
    return {
        slug: slug,
        activationId: 1,  // need from API?
        questionId: 0,
        adId: 1,
        phase: Constants.PHASE_GET_READY,
        phaseStart: Date.now(),
        phaseDuration: 0
    };
}

function syncToClockSeconds(seconds,f) {
    if (!seconds) {
        console.log("syncToClockSeconds called without seconds.");
    }
    const d = new Date();
    const millis = seconds * 1000 ;
    const t = d.getSeconds()*1000 + d.getMilliseconds();
    const waitMillis = millis - (t%millis) ;
    console.log({seconds,d,millis,t});
    setTimeout(f,waitMillis);
    console.log("Waiting "+waitMillis+" ms to sync with clock.");
}

function flattenObjectJSONStringify(obj) {
    // Flattens an object by converting values that are objects to JSON strings
    const flat = {} ;
    Object.entries(obj).forEach(function(kv) {
        let v = kv[1];
        if (v===null || v === undefined) {
            return ;
        }
        if (typeof v === "object") {
            v = JSON.stringify(v);
        }
        flat[kv[0]] = v;
    });
    return flat ;
}

function dbSaveGameState(client, gameState) {
    const flattenedGameState = flattenObjectJSONStringify(gameState);
    client.hmset("gameState",flattenedGameState);
}

let botCount = 0 ;
function startBotPlayer(context,channels,guestHash,publishChannel,local) {
    if (typeof(context.gameObject.botMessageHandler) !== 'function') {
        console.warn("No bot message handler for game.",context.gameObject);
        return ;
    }
    const botConfig = {
        ...pubnubConfig,
        uuid: guestHash,
        local
    };
    const botId = ++botCount ;
    const botConnection = startSubscriber(channels, botConfig, (message) => {
        context.gameObject.botMessageHandler(botConnection, publishChannel, guestHash, botId)(message);
    });
}

function addBots (context,playerSubscribeChannel,playerPublishChannel) {
    // Bots for testing, using pubnub or a local pubnub emulator
    let botGuestHashes = [
        "ANDafdad01234567890123456789012345678901",
        "CAMt000101234567890123456789012345678901",
        "JSHt000201234567890123456789012345678901",
        "ROBt000301234567890123456789012345678901",
        "CRSt000401234567890123456789012345678901",
        "EDD1230501234567890123456789012345678901",
        "PTEt000601234567890123456789012345678901",
        "CARt000601234567890123456789012345678901",
    ];
    const localTestBotCount = 1 ;
    generateGuestHashes(localTestBotCount);
    const localBotGuestHashes = guestHashList.slice(0,localTestBotCount);

    botGuestHashes.forEach((h)=> {
        addGuestHash(h);
        startBotPlayer(context,[playerSubscribeChannel],h,playerPublishChannel,false);
    });
    localBotGuestHashes.forEach((h)=> {
        startBotPlayer(context,[playerSubscribeChannel],h,playerPublishChannel,true);
    });
}

function startContext(slug,gameObject) {

    const channel = "broadcast.hostSlug." + slug;
//    const channel = "game_config.hostSlug." + slug;
    const subscribeChannel = "game.hostSlug." + slug;
    const coinsChannel = "broadcast.coins." + slug ;
    const logChannel = getLogChannel(config.baseUrl,gameObject.slug);

    const context = new GameContext(slug);

    context.pubnubConfig = pubnubConfig ;
    context.publishChannel = channel ;
    context.coinsChannel = coinsChannel ;
    context.logChannel = logChannel;
    context.subscribeChannels =[subscribeChannel];
    context.db.statePrefix =  gameObject.dbPrefix;
    context.db.coinsPrefix = "coins";

    context.gameObject = gameObject ;

    context.messageHandler = gameObject.messageHandler;
    context.cues = gameObject.cues(context);
    //console.log("Starting context",context);
    context.startPubNub();
    context.initDb();

    //testCoinAwards(triviaGame.pubnubConnection,triviaGame.coinsChannel,triviaGame.db.coinsClient);

    if (gameObject.init) {
        gameObject.init(context);
    }

    addBots(context,channel,subscribeChannel);

    setTimeout(()=> {
//        context.broadcast(Constants.RELOAD_CONTROLLER,{url:"https://www.esc.games"});

        syncToClockSeconds(gameObject.clockSyncSeconds, ()=> {
            context.startCues();
        });
    },1000);
}

async function login(username, password) {
    return await getToken({username, password});
}

let loggedIn = false ;

login(apiUserEmail,apiUserPassword).then((result) => {
    if (!result || !result.token) {
        console.error("Login error. Result:",result);
    }
    else {
        loggedIn = true ;
        console.log("Logged in!");
        listGames().then((games) => {
            console.log("Games: ", games);
            // TODO: Check for offline games and then poll API for games to launch?
        });
    }

    slugs.forEach((slug)=>{
        startContext(slug,TriviaGame);
    });

});


function startKeyPressHandler() {
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            console.log("Ctrl-c typed. Exiting.");
            process.exit();
        } else if (key.name === 'h') {
            console.log("Halting after round is inactive.");
            slugs.forEach((slug)=>{
                const context = GameContext.BySlug[slug] ;
                context.haltCuesGracefully();
            });
        } else if (key.name === 'n') {
            console.log("Stepping into next cue.");
            slugs.forEach((slug)=>{
                const context = GameContext.BySlug[slug] ;
                context.pauseCues() ;
                context.runNextCue();
            });
        }
    });
}

startKeyPressHandler();


// TODO - which slugs & games should we start ?
// Poll our API?
// Command line?
// Environment variables?
// Subscribe to a pubnub channel?
//
// -- API - /v1/activations/list-active
/*
{
  gameSlug: "esc-trivia-live"
}
*/
