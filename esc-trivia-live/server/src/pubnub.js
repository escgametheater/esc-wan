import PubNub from 'pubnub';

const defaultRetries = 3 ;

const LOG_ERROR = 0;
const LOG_WARN = 1;
const LOG_INFO = 2;
const LOG_DEBUG = 3;

const LOG_LEVEL = LOG_WARN ;

class LocalPubSub {
    constructor(config) {
        this.config = config ;
        this.listeners = {};
        this.channels = [];
        this.config.uuid = this.config.uuid || ("LocalPubSub_" + LocalPubSub.Connections.length);
        LocalPubSub.Connections.push(this);
        this.isLocal = true ;
        this.hasPubNub = config.hasPubNub ;
    }
    getUUID() {
        return this.config.uuid ;
    }
    setUUID(uuid) {
        this.config.uuid = uuid ;
    }
    addListener(listeners) {
        this.listeners = {
            ...this.listeners,
            ...listeners
        };
    }
    subscribe(params) {
        const self = this ;
        const channels = params.channels ;
        //console.log("Subscribing to " + channels);
        this.channels.push(...channels);
        channels.forEach(function(channel) {
            if (channel.substr(-1) === "*" ) {
                console.error("Wildcard subscriptions not implemented yet.");
                process.abort();
                return ;
            }
            let channelSubs = LocalPubSub.Subscriptions[channel] ;
            if (!channelSubs) {
                channelSubs = [] ;
                LocalPubSub.Subscriptions[channel] = channelSubs ;
            }
            channelSubs.push(self) ;
        });
        if (this.listeners.status) {
            this.listeners.status(
                {
                    category:"PNConnectedCategory",
                    operation: 'PNSubscribeOperation',
                    affectedChannels: channels ,
                    subscribedChannels: this.channels ,
                    affectedChannelGroups: [],
                    lastTimetoken: 0,
                    currentTimetoken: `${Date.now()}0000`
                }
            );
        }
    }
    publish(msg, callback) {
        LocalPubSub.publishStatic(msg,callback,this );
    }
    static publishStatic(msg,callback,publisher) {
        const data = {
            ...msg
        };
        data.publisher = publisher.getUUID() ;
        if (LOG_LEVEL >= LOG_INFO) {
            console.log(`Forwarding message from ${data.publisher}`);
        }
        data.timetoken = `${Date.now()}0000`;
        data.actualChannel = data.channel ;
        if (LOG_LEVEL >= LOG_INFO) {
            console.log ("LocalPubSub publish",data);
        }
        const subscriptions = LocalPubSub.Subscriptions[data.channel];
        if (!subscriptions) {
            return ;
        }
        subscriptions.forEach((c)=> {
            if (!c.listeners.message) {
                return ;
            }
            if (publisher.hasPubNub && c.hasPubNub) {
                if (LOG_LEVEL >= LOG_INFO) {
                    console.log("Skipping, both publisher and subscriber use pubnub.");
                }
                return ;
            }
            const msgOut = {
                ...data,
                //subscription: sub,
                //subscribedChannel: sub
            };
            setTimeout(()=> {
                c.listeners.message(msgOut) ;
            },5);
            if (LOG_LEVEL >= LOG_INFO) {
                console.log(`Forwarding message from ${msgOut.publisher} to ${c.getUUID()}`);
            }
        });
        callback({},{});
    }
}
LocalPubSub.Connections = [];
LocalPubSub.Subscriptions = {};

function pubnubSubscriptionChannelMatch(subscr,channel) {
    if (subscr.substr(-1) === "*" ) {
        return (data.channel.startsWith(subscr.substr(0,-1)));
    }
    return subscr === channel ;
}

export function startSubscriber(channels, pubNubConfig, onMessage) {
    let pubnub = pubNubConfig.local ? new LocalPubSub(pubNubConfig) : new PubNub(pubNubConfig);

    function onConnected(statusEvent) {
        if (LOG_LEVEL >= LOG_INFO) {
            console.log("Connected", statusEvent);
        }
    }

    pubnub.addListener({
        status: function (statusEvent) {
            if (statusEvent.category === "PNConnectedCategory") {
                onConnected(statusEvent);
            }
        },
        message: function (msg) {
            onMessage(msg);
        },
        presence: function (presenceEvent) {
            console.log("presence message", presenceEvent);
        }
    });
    //console.log("Subscribing to " + channels);
    pubnub.subscribe({
        channels: channels
    });

    if (!pubNubConfig.local) {
        const pubnubConfigLocal = {
            ... pubNubConfig
        };
        pubnubConfigLocal.local = true ;
        pubnubConfigLocal.hasPubNub = true ;
        pubnubConfigLocal.uuid = pubnub.getUUID();
        //console.log("Starting local subscriber mirror for "+pubnub.getUUID());
        startSubscriber(channels, pubnubConfigLocal, onMessage);
    }
    return pubnub;
}

const pubnubStats = {
    attemptCount: 0,
    publishCount: 0,
    publishStartTime: 0,
    publishSuccesses: 0,
    publishFailures: 0,
    publishRetries: 0
};


export function publishMessage(pubnubConnection,channel,message,meta,retries,retryCount) {
    meta = meta || {} ;
    meta.channel = meta.channel || channel ;
    if (pubnubConnection.isLocal) {
        pubnubConnection.publish({channel, message, meta}, function (status, response) {});
        return ;
    }

    if (retries === undefined) {
        retries = defaultRetries ;
    }
    if (pubnubStats.attemptCount === 0) {
        pubnubStats.publishStartTime = Date.now();
    }
    if (!retryCount) {
        pubnubStats.attemptCount ++ ;
        retryCount = 0;
    }

    LocalPubSub.publishStatic({channel, message, meta}, function (status, response) {},pubnubConnection);

    pubnubConnection.publish({channel, message, meta}, function (status, response) {
        pubnubStats.publishCount++;
        let json = JSON.stringify(message,null,2) ;
        const jsonRaw = JSON.stringify(message) ;
        const msgLength = jsonRaw.length ;
        const uriLength = encodeURIComponent(jsonRaw).length ;
        if (msgLength > 1000) {
            json = json.slice(0,1000) + "...";
        }
        let metaLength = 0 ;
        if (meta) {
            metaLength = encodeURIComponent(JSON.stringify(message)).length ;
        }
        if (status.error) {
            if (retries <= 0) {
                pubnubStats.publishFailures++;
                console.error("PubNub Message (length "+ msgLength  + "/" + uriLength + " meta "+metaLength+") failed to be sent to " + channel + "\n" + json , status, response);
                console.error("PubNub publish failed, no retries.");
            } else {
                if (retries > 0) {
                    if (!status.errorData || status.errorData.errno !== 'ETIME') {
                        console.error("PubNub Message (length "+ msgLength  + "/" + uriLength + " meta "+metaLength+") failed to be sent to " + channel + "\n" + json , status, response);
                    }
                    retryCount++;
                    retries--;
                    if (LOG_LEVEL >= LOG_WARN) {
                        console.log(`Retry #${retryCount}, ${retries} remaining.`);
                    }
                    pubnubStats.publishRetries++;
                    publishMessage(pubnubConnection,channel,message,meta,retries, retryCount);
                }
            }
        }
        else {
            pubnubStats.publishSuccesses++;
            if (LOG_LEVEL >= LOG_INFO) {
                console.log("PubNub Message (length " + msgLength  + "/" + uriLength + ") sent to " + channel + "\n" + json , status, response);
                if (meta) {
                    let metaJSON = JSON.stringify(meta);
                    if (metaJSON.length > 200) {
                        metaJSON = metaJSON.slice(0,200) + "...";
                    }
                    console.log("meta: ",metaJSON);
                }
            }
        }
        pubnubStats.elapsedSeconds = (Date.now()-pubnubStats.publishStartTime)/1000 ;
        if ((pubnubStats.publishCount % 10) === 0) {
            console.log({pubnubStats});
        }
    });


}
