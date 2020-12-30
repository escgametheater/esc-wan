const PubNub = require('pubnub');

const DefaultChannel = "log.*";

const configName = process.argv[2] || "default";


let firstChannel = 3 ;
let getHistory = false ;
let getCounts = false ;
let filter = false ;

if (process.argv[3] === "history") {
    firstChannel ++ ;
    getHistory = true ;
} else if (process.argv[3] === "counts") {
    firstChannel ++ ;
    getCounts = true ;
}

const filterLocation = process.argv.indexOf("-filter");
const lastChannelIndex = filterLocation >= 0 ? filterLocation : process.argv.length ;
if (filterLocation >= 0) {
    filter = process.argv[filterLocation+1];
    console.log("Filter: "+filter);
}

let channels = process.argv.slice(firstChannel,lastChannelIndex);
if (channels.length === 0) {
    channels = [DefaultChannel] ;
}

const configProd = {
    name: "prod",
    pubNubConfig : {
        subscribeKey: '<<<REDACTED>>>'
    }
};

const configQa = {
    name: "qa",
    pubNubConfig : {
        subscribeKey: '<<<REDACTED>>>'
    }
};

const configs = {
    prod: configProd,
    qa: configQa,
    default: configProd,
};

let config = configs[configName] ;
if (!config) {
    config = configs.default ;
    console.warn("No configuration named "+configName+ ". Using default.");
}
//console.log("Using config: " + config.name);

function onMessage(msg) {
    const json = JSON.stringify(msg);
    console.log("\nMessage received at "+new Date() + " length "+json.length);
    let jsonFormatted = JSON.stringify(msg,null,2);
    const lengthLimit = 3000 ;
    if (jsonFormatted.length > lengthLimit) {
        jsonFormatted = jsonFormatted.slice(0,lengthLimit)+"...\n";
    }
    console.log(jsonFormatted);
    if (msg.userMetadata) {
        onUserMetadata(msg.userMetadata);
    }
}

function splitStringIntoArrayOfArrays(s,itemSep,arraySep) {
    const all = s.split(arraySep);
    all.forEach(function(a,i) {
        all[i] = a.split(itemSep).slice(1,-1);
    });
    return all;
}

function onUserMetadata(meta) {
    if (meta.ids) {
        const ids = splitStringIntoArrayOfArrays(meta.ids,"_","~");
        if (meta.coins) {
            const coins = splitStringIntoArrayOfArrays(meta.coins,"_","~");
            console.log("coins: "+JSON.stringify(coins));
            console.log("ids: "+JSON.stringify(ids));
        }
    }
    else {
        console.log({meta});
    }
}


function startSubscriber(channels,pubNubConfig,onMessage,filter) {
    let pubnub = new PubNub({
        subscribeKey : pubNubConfig.subscribeKey
    });
    if (filter) {
        pubnub.setFilterExpression(filter);
    }

    function onConnected(statusEvent) {
        console.log("Connected", statusEvent);
    }

    pubnub.addListener({
        status: function(statusEvent) {
            if (statusEvent.category === "PNConnectedCategory") {
                onConnected(statusEvent);
            }
        },
        message: function(msg) {
            onMessage(msg);
        },
        presence: function(presenceEvent) {
            console.log("presence message",presenceEvent);
        }
    });
    console.log("Subscribing to "+channels);
    pubnub.subscribe({
        channels: channels
    });
    return pubnub ;
}

function getChannelHistory(pubnub,channel) {
    let messages = [];
    let chunks = [] ;
    function getMessagesCallback(response) {
        //console.log(response);
        let msgs = response.messages;
        let start = response.startTimeToken;
        let end = response.endTimeToken;
        if (msgs && msgs.length > 0) {
            chunks.push(msgs);
            //console.log(`Received ${msgs.length} messages, from ${start} to ${end}` );
            if (msgs.length === 100) {
                get100Messages(pubnub,channel,start,getMessagesCallback);
            }
        }
        if (!msgs || msgs.length < 100) {
            console.log("[");
            let i;
            for (i = chunks.length-1; i >=0 ; i--) {
                chunks[i].forEach((msg,mi)=> {
                    let s = JSON.stringify(msg);
                    console.log(s + (i || mi !== chunks[i].length-1 ?",":""));
                });
            }
            console.log("]");
        }
    }
    get100Messages(pubnub,channel,null,getMessagesCallback);
}

const getAllMessages = function(pubnub,channel,timeToken) {
    pubnub.history(
        {
            channel: channel,
            stringifiedTimeToken: true, // false is the default
            start: timeToken // start time token to fetch
        },
        function (status, response) {
            let msgs = response.messages;
            let start = response.startTimeToken;
            let end = response.endTimeToken;
            // if msgs were retrieved, do something useful with them
            if (msgs && msgs.length > 0) {
                //console.log(`Received ${msgs.length} messages, from ${start} to ${end}` );
                console.log(JSON.stringify(msgs,null,1));
            }
            // if 100 msgs were retrieved, there might be more; call history again
            if (msgs.length === 100) {
                console.log();
                getAllMessages(pubnub,channel,start);
            }
        }
    );
};

const get100Messages = function(pubnub,channel,timeToken,callback) {
    pubnub.history(
        {
            channel: channel,
            stringifiedTimeToken: true, // false is the default
            start: timeToken // start time token to fetch
        },
        function (status, response) {
            callback(response);
        }
    );
};

const getMessageCounts = function (pubnub,channels,timeToken) {
    console.log("Getting message counts for channels ",channels);
    pubnub.messageCounts(
        {
            channels: channels,
            timetoken: timeToken
        },
        (status, results) => {
            console.log("messageCounts returned\n",status);
            console.log(results);
        });
};

if (getHistory) {
    let pubnub = new PubNub({
        subscribeKey : config.pubNubConfig.subscribeKey
    });
//    console.log("Getting history for "+channels[0]);
    getChannelHistory(pubnub, channels[0]);
}
else if (getCounts) {
    let pubnub = new PubNub({
        subscribeKey : config.pubNubConfig.subscribeKey
    });
    getMessageCounts(pubnub,channels,1);
}
else {
    startSubscriber(channels,config.pubNubConfig,onMessage,filter);
}


