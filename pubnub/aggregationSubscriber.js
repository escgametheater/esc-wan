const PubNub = require('pubnub');
const fs = require('fs');
const FunctionInstanceTimeoutMs = 1100 ;

const functionInstances = {} ;
let functionInstancesActive = 0 ;
let functionInstancesCount = 0;

function joinIdValue(a) {
    let r = [] ;
    for (let i = 0 ; i < a.length ; i++) {
        r.push(`${a[i].id.slice(7,10)}:${a[i].value.toFixed(0)}`.padStart(6," "));
    }
    return r.join(" ");
}

function combineSortedArrays(a1,a2,n, f) {
    let a = [];
    let length1 = a1.length ;
    let length2 = a2.length ;
    n = Math.min(n,length1+length2);
    let i1 = 0 ;
    let i2 = 0 ;
    for (let count = 0 ; count < n ; count ++) {
        if (i2 === length2) {
            a.push(a1[i1]);
            i1++;
        }
        else if (i1 === length1 || (f(a1[i1],a2[i2]) > 0)) {
            a.push(a2[i2]);
            i2++;
        }
        else {
            a.push(a1[i1]);
            i1++;
        }
    }
    return a ;
}

function addAggregationValues(vTotal,v) {
    if (!vTotal) {
        vTotal = {
            total:0,
            count:0,
            max:[],
            min:[],
            lastUpdateTime: 0,
            firstUpdateTime: Number.MAX_SAFE_INTEGER
        };
    }
    vTotal.lastUpdateTime = Math.max(vTotal.lastUpdateTime,v.lastUpdateTime);
    vTotal.firstUpdateTime = Math.min(vTotal.firstUpdateTime,v.firstUpdateTime);

    vTotal.total += v.total ;
    vTotal.count += v.count ;

    const maxSize = 5 ;
    const minSize = 5 ;

    vTotal.max = combineSortedArrays(vTotal.max,v.max,maxSize,(y,x)=> x.value - y.value  );
    vTotal.min = combineSortedArrays(vTotal.min,v.min,minSize,(x,y)=> x.value - y.value  );
    return vTotal ;
}

function deepCopyJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function combineAggregations(msg) {
    // Aggregate messages if multiple function instances

    const name = msg.message.aggregation.name ;
    const functionInstanceId = msg.message.functionInstanceId ;

    let allAggregationsForName = aggregationsByFunctionInstance[name] ;

    if (!allAggregationsForName) {
        allAggregationsForName = {} ;
        aggregationsByFunctionInstance[name] = allAggregationsForName ;
    }
    const lastAgg = allAggregationsForName[functionInstanceId];
    if (lastAgg) {
        const lastAggTime = lastAgg.lastPublishTime ;
        const aggTime = msg.message.aggregation.lastPublishTime ;
        if (aggTime < lastAggTime) {
            console.warn("Aggregation message received out of order, skipping");
        }
        else {
            allAggregationsForName[functionInstanceId] = msg.message.aggregation ;
        }
    }
    else {
        allAggregationsForName[functionInstanceId] = msg.message.aggregation ;
    }

    const fIds = Object.keys(allAggregationsForName);
    let totals = deepCopyJSON(allAggregationsForName[fIds[0]].aggregates);

    for (let i = 1 ; i < fIds.length ; i++) {
        const newAgg = allAggregationsForName[fIds[i]].aggregates ;
        const otherKeys = Object.keys(newAgg);
        otherKeys.forEach((key)=> {
            totals[key] = addAggregationValues(totals[key],newAgg[key]);
        });
    }
    return totals ;
}

function trackFunctionInstances(msg) {
    // Tracking active function instances
    const time = Date.now();

    const functionInstanceId = msg.message.functionInstanceId ;
    let functionInstance = functionInstances[functionInstanceId] ;
    if (!functionInstance) {
        functionInstancesCount ++ ;
        functionInstancesActive++;
        console.log(new Date().toISOString()  + " First message from function instance " + functionInstanceId + ". Now "+
            functionInstancesCount + " total instances (" + functionInstancesActive +" active)."
        );
        functionInstance = {
            firstMessageTime: time,
            lastMessageTime: time,
            lastMessage:msg,
            active: true
        };
        functionInstances[functionInstanceId] = functionInstance ;
    }
    else {
        functionInstance.lastMessageTime = time ;
        functionInstance.lastMessage = msg ;
        if (!functionInstance.active) {
            functionInstance.active = true ;
            functionInstancesActive++;
            console.log(new Date().toISOString() + " Function instance " + functionInstanceId + " active."
                +" Number now active: "+functionInstancesActive + " out of "+functionInstancesCount);
        }
    }

    setTimeout(function() {
        if (functionInstance.lastMessageTime === time) {
            if (functionInstance.active) {
                functionInstance.active = false ;
                functionInstancesActive--;
                console.log(new Date().toISOString() +  " Function instance inactive: "+functionInstanceId
                    +". Number now active: "+functionInstancesActive + " out of "+functionInstancesCount
                    +". Time without a message: " +(Date.now() - time)/1000);
                if (!functionInstancesActive) {
                    console.log(new Date().toISOString() + " No active function instances.");
                }
            }
        }
    },FunctionInstanceTimeoutMs);
}

function formatTime(t) {
    return new Date(t).toISOString().slice(11,23)
}
function processAggregationMessage(msg) {
    if (!msg || !msg.message || !msg.message.aggregation || ! msg.message.aggregation.aggregates) {
        console.warn("No aggregates found.");
        console.log(JSON.stringify(msg,null,4));
        return ;
    }

    trackFunctionInstances(msg);

    const name = msg.message.aggregation.name ;
    console.log(new Date().toISOString() + " Aggregation for "+ name + " from function instance " +  msg.message.functionInstanceId + " received on channel " + msg.channel);

    // Combine multiple aggregations, from different Function instances
    const a = combineAggregations(msg);
    //console.log("combineAggregations",JSON.stringify({name:name,aggregations:a}));
    //console.log("combineAggregations",JSON.stringify(a,null,4));

    if (_onAggregationMessage) {
        _onAggregationMessage(name,a);
    }
}

function displayAggregation(name,a) {
    const keys = Object.keys(a).sort();

    console.log(`\n\tFirst update\tLast update\tTotal\tcount\taverage\tMax and min`);
    //const numKeys = keys.length ;
    //const keys = [keys[0],keys[Math.floor(numKeys/2)]];
    keys.forEach((key)=> {
        const v = a[key];
        const lastUpdateTime = formatTime(v.lastUpdateTime) ;
        let firstUpdateTime = 0 ;

        try {
            firstUpdateTime = formatTime(v.firstUpdateTime) ;
        } catch (e) {
            console.log("Error with firstUpdateTime",v);
        }

        console.log(`${key.slice(0,7)}\t${firstUpdateTime}\t${lastUpdateTime}\t${v.total.toFixed(1)}\t${v.count}\t${(v.total/v.count).toFixed(1)}`+
            `\tMax:${joinIdValue(v.max)}\tMin:${joinIdValue(v.min)}`)
    });
    console.log("\n");
}

const aggregationsByFunctionInstance = {} ;


let _onAggregationMessage = displayAggregation;

function startSubscriber(channels,pubNubConfig,onAggregationMessage) {
    console.log(formatTime(Date.now()) + " Starting aggregation subscriber.");
    if (onAggregationMessage) {
        _onAggregationMessage = onAggregationMessage;
    }
    let pubnub = new PubNub({
        subscribeKey : pubNubConfig.subscribeKey
    });

    function onConnected(statusEvent) {
        console.log(new Date().toISOString() + " Connected", statusEvent);
    }

    pubnub.addListener({
        status: function(statusEvent) {
            if (statusEvent.category === "PNConnectedCategory") {
                onConnected(statusEvent);
            }
        },
        message: function(msg) {
            const json=JSON.stringify(msg);
            const jsonLength = json.length ;
            //console.log(JSON.stringify(msg,null,4));
            msg.jsonLength = jsonLength ;
            msg.timeReceived = Date.now() ;
            msg.timeReceivedString = new Date().toISOString();
            console.log(msg.timeReceivedString  + " Aggregation message received, length "+jsonLength);
            logAggregationMessage(msg);
            processAggregationMessage(msg);
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

function logAggregationMessage(msg) {
    const t = new Date(msg.timeReceived);
    const dir = "logs";
    const fileNameSuffix = "-aggregation-log.txt";
    // New file name every 10 minutes
    const fileName = t.toISOString().slice(0,15).replace(":","")+"0" + fileNameSuffix;
    fs.appendFile(dir + "/" + fileName, JSON.stringify(msg)+"\n", (error) => {
        if (error) {
            console.error("Error logging aggregation message to " + fileName,error);
        }
    });
}
exports.startSubscriber = startSubscriber;
exports.processAggregationMessage = processAggregationMessage;
exports.combineAggregations = combineAggregations;
exports.displayAggregation = displayAggregation ;
