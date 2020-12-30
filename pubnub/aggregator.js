(function(exports){
    const commands = {
        COMMAND_CLEAR  : "clear",
        COMMAND_DONE : "done",
        COMMAND_DEBUG : "debug",
        COMMAND_DB_GET : "get",
        COMMAND_DB_SET : "set",
        COMMAND_DB_GET_COUNTER : "getCounter",
        COMMAND_DB_INCR_COUNTER : "incrCounter",
        COMMAND_DB_CLEAR_COUNTER : "removeCounter",
    };

    function Aggregator() {
        this.pubnub = null ;
        this.channel = "";
    }
    Aggregator.prototype.publish = function (message) {
        const self = this ;
        const channel = this.channel;
        const options = {
            channel: channel,
            message: message
        };

        //console.log("Publishing to "+this.channel+": "+JSON.stringify(message));
        this.pubnub.fire(options, function(status, response) {
            if (status.error) {
                if (status.category === "PNTimeoutCategory") {
                    console.error("Error publishing to aggregator: "+status.category);
                }
                else if (status.errorData.syscall === "getaddrinfo") {
                    console.error("Error publishing to aggregator: "+status.errorData.syscall+" code " + status.errorData.code);
                    self.publish(message);
                }
                else {
                    console.error("Error publishing to aggregator: ", status, response);
                }
            }
        });
    };
    Aggregator.prototype.fireMult = function(message, n, t) {
        if (n > 0) {
            this.publish(message);
            if (n > 1) {
                const self = this ;
                return setTimeout(function() {
                    self.fireMult(message,n-1);
                },t || 1);
            }
        }
        return null ;
    };
    Aggregator.prototype.startPublisher = function (PN,pubNubConfig,publishChannel) {
        this.pubnub = new PN(pubNubConfig);
        this.channel = publishChannel ;

        function onConnected(statusEvent) {
            console.log("Connected", statusEvent);
        }

        this.pubnub.addListener({
            status: function(statusEvent) {
                if (statusEvent.category === "PNConnectedCategory") {
                    onConnected(statusEvent);
                }
            },
            message: function(msg) {
                console.log("Message received: ",msg);
            },
            presence: function(presenceEvent) {
                console.log("presence message",presenceEvent);
            }
        });
//        console.log("Subscribing..");
//        this.pubnub.subscribe({
//            channels: [this.channel]
//        });
        return this.pubnub ;
    };

    Aggregator.prototype.publishToAggregator = function (aggregatorName,keys,ids,values) {
        const message = {
            name: aggregatorName,
            values: []
        };
        const numValues = keys.length ;
        for (let i = 0 ; i < numValues; i++) {
            message.values.push(
                {
                    key:keys[i],
                    id:ids[i],
                    value:values[i]
                }
            ) ;
        }
        this.publish(message);
    };

    Aggregator.prototype.done = function(aggregatorName) {
        const message = {
            name: aggregatorName,
            command: commands.COMMAND_DONE
        };
        this.publish(message);
    };
    Aggregator.prototype.clear = function(aggregatorName) {
        const message = {
            name: aggregatorName,
            command: commands.COMMAND_CLEAR
        };
        this.publish(message);
    };

    exports.commands = commands ;
    exports.Aggregator = Aggregator ;


})(typeof exports === 'undefined'? this['aggregator']={}: exports);
