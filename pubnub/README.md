# PubNub functions and API scripts

#### Quick start:

Install:
```
npm install
```
Launch subscribers (in two different terminals):
```
node nodeShake.js
```
```
node pubnubsub.js
```

## Installing and running subscribers/tests/demos

####Install:
```
npm install
```

####Subscribe and track aggregations and optionally run a test:
```
node nodeShake.js [<configName>] [<number of test clients] 
```

Optionally, you can add the config name (`prod`, `qa`, `test`). `prod` is default.

The script listens for and reports aggregation messages and function instance status.

To run with some test players, add the number of simulated players on the command line after the config name.


####Subscribe to log.* or other pubnub channels, and fetch histories from pubnub:

```
node pubnubsub.js [<configName>] [<channelName>] [<channelName>] ...
node pubnubsub.js [<configName>] history <channelName>
node pubnubsub.js [<configName>] counts <channelName> ...
```

Optionally, you can add the config name (`prod`, `qa`). `prod` is default.

If `history` is next, then the script will fetch the history of the channel defined by the next argument
Otherwise, the remaining arguments specify the channel[s] to subscribe to (wildcards ok), defaulting to "log.*".

If `counts` is next after the config name, then the script will fetch the counts of messages on the channels.

Some channels we're using:
```
log.<gameInstanceId>
gameTracking.<gameInstanceId>
aggregate.<gameInstanceHash>
aggregation.<gameInstanceHash>
```
Visit https://www.esc.games/admin/host-app/host-instances to see the channel names for recent instances.

If you want to filter the JSON output on the command line, download something like https://stedolan.github.io/jq/download/ . OS X installation via `homebrew`:

```
brew install jq
```
#### Post-process an aggregation log
After an activation (or even during), to fetch the aggregation history and
turn it into a tab-separate file:
```
node pubnubsub.js prod history aggregation.XXXX > aggregation.XXXX.json

node processAggregationLog.js aggregation.XXXX.json > aggregation.XXXX.txt

```

## Aggregator input messages shape:

```
{
    "name": "shakePower",
    "values": [
        {
            "key": "t1",
            "id": 41,
            "value": 97
        },
        {
            "key": "t1p05",
            "id": 41,
            "value": 97
        },
        {
            "key": "t1total",
            "id": 41,
            "value": 97,
            "operations": {
                "total": true,
                "count": true,
                "max": 5,
                "min": 5
            }
        }
    ]
}
```
`operations` is optional. If it's left out, a default set of functions will be applied.

`id` is optional too. It's only used as the identifier for the max or min values.

The `name` field is the name for a group of aggregators, that will all be grouped together and published by the aggregator Function in one message.

`max` and `min` can also be given a number, which defaults to 5.

# PubNub API script for working with PubNub "Functions"

## Configuring PubNub API script

Set up configuration values in `pubnub-api.js` and/or environment variables. For example:

```
const configQa2 = {
    loginEmail: process.env.PUBNUB_EMAIL,
    password: process.env.PUBNUB_PASSWORD,
    accountEmail: '<<<REDACTED>>',
    appName: 'ESC',
    keysetName: 'qa2',
};
```

Setting environment variables:
```
export PUBNUB_EMAIL='you@esc.games'
export PUBNUB_PASSWORD='xxxxx'
```

## Starting, stopping, and updating Function with the  PubNub API
To check the configuration:
```
npm run check
```

To start the function:
```
npm run start
```

To stop the function:
```
npm run stop
```

To update the function:
```
npm run update
```

Or, instead of `npm run` use `node pubnub-api.js`

