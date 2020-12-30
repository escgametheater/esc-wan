
const UUIDv4 = require('uuid/v4');

const configName = process.argv[2] || "default";
const numClients = parseInt(process.argv[3]) || 0 ;

const aggregationChannelPrefix = "aggregation";
const functionStateChannels = "functionState.*";

// Node does not cache DNS requests. That sucks, and can overload the system enough that occasionally getaddrinfo calls fail
// dnscache puts a wrapper around all dns functions to cache return values
const dnsCacheEnable = true ;
const dns = dnsCacheEnable ? require('dns') : undefined ;
if (dnsCacheEnable) {
    require('dnscache')({
        "enable" : true,
        "ttl" : 300,
        "cachesize" : 1000
    })
}

const PubNub = require('pubnub');
const aggregator = require('./aggregator');
const Aggregator = aggregator.Aggregator;

const startSubscriber = require ("./aggregationSubscriber").startSubscriber;

const shakePublishValues = require('./shakeAggregatorUtils').shakePublishValues;

// To run a test of the aggregation functions when starting up
const periods = 5;
const periodMs = 1000;
const clients = [];


const gameInstanceHash = "gameInstanceHash"+Math.floor(Date.now()/1000) ;
const shakePublishChannel = `aggregate.${gameInstanceHash}` ;


const configProd = {
    name:"prod",
    pubNubConfig : {
        publishKey: '<<<REDACTED>>>',
        subscribeKey: '<<<REDACTED>>>'
    }
};

const configQa = {
    name:"qa",
    pubNubConfig : {
        publishKey: '<<<REDACTED>>>',
        subscribeKey: '<<<REDACTED>>>'
    }
};
const configTest = {
    name:"test",
    pubNubConfig : {
        publishKey : '<<<REDACTED>>>',
        subscribeKey : '<<<REDACTED>>>'
    }
};

const configs = {
    prod: configProd,
    qa: configQa,
    test: configTest,
    default: configProd,
};

let config = configs[configName] ;
if (!config) {
    config = configs.default ;
    console.warn("No configuration named "+configName+ ". Using default.");
}
console.log("Using config/key set: " + config.name);

if (numClients) {
    console.log("Test gameInstanceHash: " + gameInstanceHash );
}

const totalPower = [];
const playerIds = [];

function shakeN(game,team,player,N,interval) {
    if (!N || N <= 0) {
        return ;
    }
    totalPower[player] = 0 ;
    const playerId = playerIds[player];
    for (let period = 1; period <= N ; period++) {
        setTimeout(function() {

            const shakePower = Math.floor(100*Math.random()) ;
            totalPower[player] += shakePower ;

            const values = shakePublishValues(team,playerId,period,shakePower,totalPower[player],period === N);
            //const values = shakePublishValues(team,playerId,0,shakePower,totalPower[player],true);

            clients[player].publish({
                name: 'shakePower',
                values: values
            });

        },interval*period);
    }
    setTimeout(function() {
        clients[player].publish({
            name: 'shakePower',
            command: aggregator.commands.COMMAND_DONE
        })
    },interval*(N+1));
}

// pre-lookup all pubnub domains, then when done run callback
function preLookupDns(cb) {
    if (!dnsCacheEnable) {
        cb();
        return ;
    }
    let numCached = 0 ;
    const numDomains = 20 ;

    for (let i = 1 ; i <= numDomains ; i++) {
        dns.lookup(`ps${i}.pndsn.com`,{hints:dns.ADDRCONFIG},function() {
            numCached++;
            if (numCached === numDomains) {
                cb();
            }
        })
    }
}

function runTest() {
    if (!numClients) {
        return ;
    }
    console.log(`Starting ${numClients} test clients`);

    for (let i = 0 ; i < numClients; i++) {
        clients[i] = new Aggregator() ;
        clients[i].startPublisher(PubNub,{...config.pubNubConfig},shakePublishChannel);
        if (i===0) {
            //clients[i].clear(gameInstanceHash);
        }
        totalPower[i] = 0 ;
        //playerIds.push(i);
        playerIds.push(UUIDv4());
    }


    for (let i = 0 ; i < numClients; i++) {
        setTimeout(function() {
            const team = 't'+Math.floor(Math.random()*2+1) ;
            shakeN(gameInstanceHash+"-shakePower", team,i,periods,periodMs);
        },i/numClients*100);
    }
}

startSubscriber([`${aggregationChannelPrefix}.*`,functionStateChannels],config.pubNubConfig);

preLookupDns(runTest);

