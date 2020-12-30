// This Function stores counters in local memory

const pubnub = require("pubnub");
const xhr = require("xhr");


const UseKV = false ;
const UpdatePeriodMS = 250 - 20;

let counters={};
let reportWaiting = false ;
let reportPending = false ;
let lastTime = 0 ;

function setTimeout(f,t) {
    if (t <= 0) {
        f();
        return ;
    }
    const url = "http://httpstat.us/200?sleep="+t;
    //console.log("setTimeout fetching "+url);
    xhr.fetch(url).then((serverResponse) => {
        // handle server response
        //console.log("setTimeout fetch succeeded.");
        f();
    }).catch((err) => {
        // handle request failure
        console.log("setTimeout fetch failed.");
        f();
    });
}

function reportCounts() {
    //console.log("reportCounts ",reportPending,reportWaiting,lastTime);
    reportPending = true ;
    if (reportWaiting) {
        return ;
    }
    reportWaiting = true ;
    pubnub.time().then((timeToken) => {
        const timeSinceLastMs = Math.floor((timeToken - lastTime)/10000) ;
        const timeToWait = UpdatePeriodMS - timeSinceLastMs ;
        //console.log("timeSinceLastMs "+timeSinceLastMs);
        lastTime = timeToken;
        setTimeout(function() {
            reportPending = false ;
            pubnub.time().then((timeToken) => {
                lastTime = timeToken;
            });
            publishCounters();
            setTimeout(function() {
                reportWaiting = false ;
                if (reportPending) {
                    pubnub.time().then((timeToken) => {
                        lastTime = timeToken;
                    });
                    publishCounters();
                    reportPending = false;
                }
                else {
                    //console.log("No updates pending");
                }
            },UpdatePeriodMS);
        },timeToWait);
    });

}

function publishCounters() {
    const publishObject = {
        channel: "countSummary",
        message: counters
    }
    console.log("Publishing",publishObject);
    pubnub.publish(publishObject).then((publishResponse) => {
    });
}


// Declare the Function with the export syntax. The incoming message is called request
export default (request) => {

    // Import modules ‘console’ {to display variables for troubleshooting) and ‘kvstore’ (to use the KV store)
    var console = require("console");
    var db = require("kvstore");



    try {

        //console.log("The message " + JSON.stringify(request.message) + " was published on " + request.channels[0] + " via " + request.meta.clientip);
        const counterName = request.message.counter ;

        if (!UseKV) {
            let count = counters[counterName] || 0;
            count ++ ;
            counters[counterName] = count ;
            request.message.count = count;
            reportCounts();
            /*        if ((count % 10) === 0) {
                        console.log("Publishing to countSummary",request.message);
                        pubnub.publish({
                            "channel": "countSummary",
                            "message": request.message
                        }).then((publishResponse) => {
                        });

                    }
            */
            return request.ok();
        }

        // Retrieve the key-value pair randNum
        var dbResponse = db.get(counterName).then(function(count) {
            // since db methods return promises
            count = count || 0 ;
            count = count + 1 ;
            // Store the random number in the KV store
            db.set(counterName, count)
                .catch(function(err) {
                    console.log("An error occurred saving the counter "+counterName, err);
                });

            if (count % 10 === 0) {
                // Augment the message with the Key-value pair {‘count’: count}
                request.message.count = count;

                return request.ok();
            }
            return request.abort() ;
        });

        return dbResponse;

        // Handle error
    } catch (e) {
        console.error("Uncaught exception:", e);
    }
};
