// This Function aggregates values in local memory and periodically publishes aggregations
// Version 0.0.3
// PubNub reference https://www.pubnub.com/docs/blocks/xhr-module

const pubnub = require("pubnub");
const xhr = require("xhr");
const db = require("kvstore");
const utils = require('utils');

const MaxSizeDefault = 5 ;
const MinSizeDefault = 5 ;
const DefaultUpdatePeriodMS = 250 ;

const UseSetTimeout = false ;

const FunctionStateChannelPrefix = "functionState" ;

const COMMAND_CLEAR = "clear";
const COMMAND_DONE = "done";
const COMMAND_DEBUG = "debug";
const COMMAND_DB_GET = "get";
const COMMAND_DB_SET = "set";
const COMMAND_DB_GET_COUNTER = "getCounter";
const COMMAND_DB_INCR_COUNTER = "incrCounter";
const COMMAND_DB_CLEAR_COUNTER= "removeCounter";

const InstanceStateStarted = "started";
const InstanceStateIdle = "idle";
const InstanceStateActive = "active";


let myId = 0 ;


let aggregators={};

let functionStateChannel = FunctionStateChannelPrefix+".unknown" ;

let idle = true ;

function setTimeout(f,t) {
    if (t <= 0) {
        f();
        return ;
    }
    const url = "http://httpstat.us/200?sleep="+t;
    //console.log("setTimeout fetching "+url);
    xhr.fetch(url).then((/*serverResponse*/) => {
        // handle server response
        //console.log("setTimeout fetch succeeded.");
        f();
    }).catch((err) => {
        // handle request failure
        console.log("setTimeout fetch failed.",err);
        f();
    });
}

function clearAggregator(name,channel) {
    const a = {};
    aggregators[name] = a;
    a.name = name ;
    a.lastUpdateTime = 0;
    a.lastPublishTime = 0;
    a.lastValues = {};
    a.aggregates = {};
    a.lastAggregates = {};
    a.channel = channel ;
    a.updatePeriod = DefaultUpdatePeriodMS ;
    return a ;
}

function zeroAggregation(maxSize,minSize) {
    return {
        total: 0,
        count: 0,
        max: [] ,
        min: [] ,
        maxSize: maxSize,
        minSize: minSize,
        firstUpdateTime: 0,
        lastUpdateTime: 0,
    };
}

function updateAggregator(a,message) {
    a.lastUpdateTime = Date.now() ;
    if (!a.firstUpdateTime) {
        a.firstUpdateTime = a.lastUpdateTime ;
    }
    const values = message.values;
    if (!values) {
        console.log("message.values not present! Ignoring.",message);
        return false ;
    }
    Object.assign( a.lastValues, values );
    const numValues = values.length ;
    let nonzero = false ;
    for (let i = 0 ; i < numValues ; i++) {
        let value = values[i].value;
        value = parseFloat (value);
        if (isNaN(value)) {
            value = 1;
        }
        const key = values[i].key;
        const id = values[i].id ;
        nonzero = nonzero || value;
        let aggregation = a.aggregates[key];
        if (!aggregation) {
            aggregation = zeroAggregation(MaxSizeDefault,MinSizeDefault);
            aggregation.firstUpdateTime = a.lastUpdateTime ;
            a.aggregates[key] = aggregation ;
        }

        const operations = values[i].operations ; // Which aggregate operations to perform

        aggregation.lastUpdateTime = a.lastUpdateTime;

        // Aggregation functions here
        if (!operations || operations.total) {
            aggregation.total += value ;
        }
        if (!operations || operations.count) {
            aggregation.count++;
        }
        if (!operations || operations.max) {
            aggregation.max = insertIntoSortedArray({value: value, id: id}, aggregation.max, function (x, y) {
                return y.value - x.value
            });
            let size = (operations && typeof operations.max === 'number') ? operations.max : aggregation.maxSize ;
            if (aggregation.max.length > size) {
                aggregation.max.pop();
            }
        }
        if (!operations || operations.min) {
            aggregation.min = insertIntoSortedArray({value: value, id: id}, aggregation.min, function (x, y) {
                return x.value - y.value
            });
            let size = (operations && typeof operations.min === 'number') ? operations.min : aggregation.minSize ;
            if (aggregation.min.length > size) {
                aggregation.min.pop();
            }
        }
        // Other operations that might be added in the future:
        // * histogram (optional bucket size)
        // * indexing
        // * variance (second moment) (but can be done by sending squared values)
    }
    return nonzero ;
}

function binarySearch(item,a,f,minI,maxI) {
    //console.log("binary search",item,a,minI,maxI);
    // returns the index before which the item should be inserted
    if (minI === maxI) {
        return minI + (f(item,a[minI])>0 ? 1 : 0) ;
    }
    let i = (minI+maxI)>>>1;
    if (f(item,a[i])>0) {
        return binarySearch(item,a,f,i+1,maxI);
    }
    return binarySearch(item,a,f,minI,i);
}

function insertIntoSortedArray(item,a,f) {
    let len = a.length ;
    if (len === 0) {
        return [item];
    }
    const pos = binarySearch(item,a,f,0,len-1);
    //console.log("Inserting at "+pos);
    const leftArray = a.slice(0,pos);
    leftArray.push(item) ;
    const newArray =  leftArray.concat(a.slice(pos));
    return newArray ;
}

function publishAggregator(a) {
    const publishObject = {
        channel: a.channel,
        message: {
            functionInstanceId:myId,
            aggregation:a
        }
    };
    //console.log("Publishing:\n");
    //console.log(publishObject);
    pubnub.publish(publishObject).then((publishResponse) => {
    });
}

function splitAtFirst(string, sep) {
    let i = string.indexOf(sep);
    if (i < 0) {
        return [string,""];
    }
    return [string.slice(0,i), string.slice(i+sep.length)];
}

function aggregatorNameFromRequest(request) {
    // Remove first part of channel, then add name from request
    return splitAtFirst(request.channels[0],".")[1] + "." + request.message.name ;
}

function aggregationChannelFromRequest(request) {
    // Remove first part of channel, replace it with aggregation
    return "aggregation." + splitAtFirst(request.channels[0],".")[1];
}

function executeCommand(request) {
    //console.log("command "+request.message.command);
    // TODO: Check that sender has authority to execute the command
    switch (request.message.command) {
        case COMMAND_DONE: {
            const a = aggregators[aggregatorNameFromRequest(request)];
            if (!a) {
                console.log("done command on nonexistent aggregator");
                break ;
            }
            if (a.lastUpdateTime > a.lastPublishTime) {
                a.lastPublishTime = a.lastUpdateTime ;
                publishAggregator(a);
            }
            break ;
        }
        case COMMAND_CLEAR: {
            const a = clearAggregator(aggregatorNameFromRequest(request),aggregationChannelFromRequest(request));
            publishAggregator(a);
            break ;
        }
        case COMMAND_DB_GET: {
            const key = request.message.key;
            if (!key) {
                console.log("db get command with no key");
                break ;
            }
            db.get(key).then((v) => {
                console.log(key + " = "+v);
            }).catch((e)=> {
                console.log("kvstore error",e);
            });
            break;
        }
        case COMMAND_DB_SET: {
            const key = request.message.key;
            if (!key) {
                console.log("db set command with no key");
                break ;
            }
            const value = request.message.value;
            if (!value) {
                console.log("db set command with no value");
                break ;
            }
            console.log("setting " + key + " = " + value);
            db.set(key,value);
            break;
        }
        case COMMAND_DB_GET_COUNTER: {
            const key = request.message.key;
            if (!key) {
                console.log("db getCounter command with no key");
                break ;
            }
            db.getCounter(key).then((v) => {
                console.log(myId + " counter " + key + " = "+v);
            }).catch((e)=> {
                console.log("kvstore error",e);
            });
            break;
        }
        case COMMAND_DB_INCR_COUNTER: {
            const key = request.message.key;
            if (!key) {
                console.log("db incrCounter command with no key");
                break ;
            }
            const value = request.message.value;
            if (!value) {
                console.log("db incrCounter command with no value");
                break ;
            }
            //console.log("incrementing " + key + " += " + value);
            db.incrCounter(key,value);
            //db.getCounter(key).then((v) => {
            //    console.log("counter " + key + " = "+v);
            //}).catch((e)=> {
            //    console.log("kvstore error",e);
            //});
            break;
        }
        case COMMAND_DB_CLEAR_COUNTER: {
            const key = request.message.key;
            if (!key) {
                console.log("db removeCounter command with no key");
                break ;
            }
            db.removeCounter(key);
            break;
        }

        case "kvtest": {
            console.log(Object.keys(db));
            let numReceived = 0 ;
            db.incrCounter("a",1);
//            db.incrCounter("b",-1);
            if (false)
                db.getCounterKeys().then((counterKeys) => {
                    for(var i=0; i<counterKeys.length;i++){
                        console.log(counterKeys[i]);
                    }
                });
            //db.getCounter("a").then((v) => {
            //    console.log("a = "+v);
            //});
            db.getCounter("a").then((v) => {
                console.log("b = "+v);
            }).catch((e)=> {
                console.log("kvstore error",e);
            });
            break;
        }
        case COMMAND_DEBUG: {
            console.log("request:",request);
            // Test publish
            pubnub.publish({
                "channel": "debug",
                "message": "debug"
            }).then((publishResponse) => {
                console.log(`Publish response:`,publishResponse);
//                console.log(`Publish Status: ${publishResponse[0]}:${publishResponse[1]} with TT ${publishResponse[2]}`);
            });

            // Test history fetch
            pubnub.history({
                channel : "debug",
            },false).then((historyResponse) => {
                console.log("history response",historyResponse);
            }).catch((e)=> {
                console.log("history error, possibly because history not enabled?",e);
            });

            if (false)
                pubnub.hereNow({
                    channels: ["aggregator"],
                    includeUUIDs: true,
                    includeState: true
                }).then((response) => {
                    console.log("hereNow",response) ;
                }).catch((error) => {
                    console.log("hereNow",error) ;
                });

            break ;
        }
        default:
            console.log("Unknown command: "+request.message.command+ " request: ",request);
    }
    return request.ok();
}


let setTimeoutActive = false ;
let updatesWaiting = 0 ;

function publishIfAllowed(a) {
    const timeSinceLastPublish = Date.now() - a.lastPublishTime ;
    //console.log("timeSinceLastUpdate: " + timeSinceLastPublish,a );

    if (timeSinceLastPublish >= a.updatePeriod && !setTimeoutActive) {
        a.lastPublishTime = Date.now() ;
        publishAggregator(a);
        if (idle) {
            sendInstanceState(InstanceStateActive,timeMs);
            idle = false ;
        }
        updatesWaiting = 0 ;
        return ;
    }

    if (UseSetTimeout) {
        updatesWaiting++ ;
        if (setTimeoutActive) {
            return ;
        }
        const timeToWait = a.updatePeriod - timeSinceLastPublish ;
        setTimeoutActive = true ;
        setTimeout(function () {
            setTimeoutActive = false ;
            if (updatesWaiting) {
                publishIfAllowed(a);
            } else {
                idle = true ;
                sendInstanceState(InstanceStateIdle,timeMs);
            }
        },timeToWait);
    }
}

function sendInstanceState(state,time) {
    const publishObject = {
        channel: functionStateChannel,
        message: {
            functionInstanceId:myId,
            state:state,
            time:time || Date.now()
        }
    };
    pubnub.publish(publishObject).then((publishResponse) => {
    });

}

// Declare the Function with the export syntax. The incoming message is called request
export default (request) => {

    if (!myId) {
        myId = "i"+Date.now() + "-"+Math.floor(Math.random()*1000000) ;
        functionStateChannel = FunctionStateChannelPrefix+"."+myId ;
        console.log("First call to instance "+myId);
        idle = false ;
        sendInstanceState(InstanceStateStarted);
    }


    try {
        //console.log("The message " + JSON.stringify(request.message) + " was published on " + request.channels[0] + " via " + request.meta.clientip);
        // Ignore our own output messages
        if (request.message.functionInstanceId === myId) {
            return request.ok();
        }
        //console.log(request.message);
        if (request.message.command) {
            return executeCommand(request);
        }

        let name = aggregatorNameFromRequest(request);
        //console.log("name "+name);

        let a = aggregators[name];
        //console.log(a);
        if (!a) {
            a = clearAggregator(name,aggregationChannelFromRequest(request));
        }
        //console.log("request",request);

        // Call the aggregator function
        updateAggregator(a,request.message);
        publishIfAllowed(a);

        return request.ok();
    } catch (e) {
        // Handle error
        console.error("Uncaught exception:", e);
    }
};
