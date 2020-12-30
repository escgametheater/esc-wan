const crypto = require('crypto');
const zlib = require('zlib');
import {publishMessage} from "./pubnub";


const shortGuestHashToFull = {};
const fullGuestHashToShort = {};
let maxLengthGuestHash = 0 ;
let minLengthGuestHash = 0 ;

let totalLengthGuestHash = 0 ;
export const guestHashList = [];
function checkShortHashes() {
    minLengthGuestHash = 40 ;
    guestHashList.forEach(function (h) {
        const short = fullGuestHashToShort[h];
        minLengthGuestHash = Math.min(minLengthGuestHash,short.length);
        const full = shortGuestHashToFull[short];
        if (full !== h) {
            console.error("hash to short to full doesn't match: " + h + " => " + short + " => " + full );
        }
    });
    console.log({minLengthGuestHash});
}
const shortestHashLength = 6 ;

export function addGuestHash(h) {
    if (!h) {
        console.error("Attempting to add falsy hash.");
        return ;
    }
    h=h.toString();
    if (fullGuestHashToShort[h]) {
        return ;
    }
    guestHashList.push(h);
//    fullGuestHashToShort[h] = h ;
//    return ;
    for (let i = shortestHashLength; i < h.length ; i++) {
        const short = h.slice(0,i);
        const other = shortGuestHashToFull[short] ;
        if (other === undefined) {
            shortGuestHashToFull[short] = h ;
            fullGuestHashToShort[h] = short ;
            maxLengthGuestHash = Math.max(maxLengthGuestHash,i);
            totalLengthGuestHash += i ;
            return ;
        } else if (other) {
            shortGuestHashToFull[short] = false ;
            const otherShort = other.slice(0,i+1) ;
            totalLengthGuestHash ++ ;
            shortGuestHashToFull[otherShort] = other ;
            fullGuestHashToShort[other] = otherShort ;
        }
    }
}

export function generateGuestHashes(n) {
    const startTime = Date.now();
    let i = 0 ;

    const usePsuedoRandomGuestHash = true ;

    while (i < n) {
        if (usePsuedoRandomGuestHash) {
            psuedoRandomGuestHash(i);
        } else {
            randomGuestHash(i);
        }
        i++;
    }
    const elapsedTime = Date.now() - startTime;
    console.log("Elapsed time: "+elapsedTime/1000);

    const guestHashes = n ;
    console.log({maxLengthGuestHash,averageLength:totalLengthGuestHash/guestHashes, shortObjects: Object.keys(shortGuestHashToFull).length,guestHashes});

}

// Use this function to generate repeatable guest hashes
function psuedoRandomGuestHash(i) {
    const hash = crypto.createHash('sha1');
    hash.update(i.toString());
    const h = hash.digest('hex');
    addGuestHash(h);
    return h;
}
function randomGuestHash() {
    const h = crypto.randomBytes(20).toString('hex');
    addGuestHash(h);
    return h;
}

function zlibCompress64(input,f) {
    zlib.deflate(input, (err, buffer) => {
        if (!err) {
            const b64 = buffer.toString('base64') ;
            console.log("zlib input length " + input.length + ", compressed: " + b64.length
                + " URI encoded: " + encodeURIComponent(b64).length
            );
            if (f) {
                f(b64);
            }
        } else {
            console.log("zlib error");
            // handle error
        }
    });
}

export function addCoinAward(coinAwards,coins,guestHashes) {
    if (guestHashes.length === 0) {
        return ;
    }
    if (Array.isArray(coinAwards[coins])) {
        coinAwards[coins].push(...guestHashes);
    }
    else {
        coinAwards[coins] = [...guestHashes];
    }
}

const TotalCoinsSortedSetKey = "total" ;
const CoinBalanceHashKey = "balance" ;
const TransactionStreamKey = "transactions" ;

export function dbGetTopCoins(client,start,stop, handler) {
    client.zrevrange(TotalCoinsSortedSetKey,start,stop,"WithScores", function(err,reply) {
        if (handler) {
            handler(err,reply);
            return ;
        }
        console.log("dbGetTopCoins",reply);
    });
}

export function dbAddCoinAward(client,coins,guestHashes) {
    const multi = client.multi();
    guestHashes.forEach((guestHash) => {
        // Total coins earned. May want to have daily, weekly, etc., lists
        // https://redis.io/commands/zincrby
        // ZINCRBY key increment member
        multi.zincrby(TotalCoinsSortedSetKey,coins,guestHash);

        // Player's coin balance -- can "spend" or "transfer" coins, otherwise same as total
        // https://redis.io/commands/hincrby
        // HINCRBY key field increment
        // NOTE order of parameters to HINCRBY and ZINCRBY (and HSET and ZADD) are different! WTF redis?
        multi.hincrby(CoinBalanceHashKey,guestHash,coins);

        // Streams include time as part of the item id.
        // Todo: add other info
        // "Permanent" record of all transactions
        // XADD key ID field string [field string ...]
        multi.xadd(TransactionStreamKey,"*","guestHash",guestHash,"coins",coins);
        // Transactions by guestHash
        multi.xadd(TransactionStreamKey + "." +guestHash,"*","coins",coins);
    });
    multi.exec(function (err, replies) {
        if (err) {
            console.error("dbAddCoinAward error",err,replies,coins,guestHashes);
        }
        //console.log("dbAddCoinAward replies",replies);
    });
}

export function dbAddCoinAwards(client,coinAwards) {
    Object.keys(coinAwards).forEach(function (coins) {
        dbAddCoinAward(client,coins,coinAwards[coins]);
    });
}

function addCoinAwardsForRandomPlayers(coinAwards,coinCounts) {
    let gi = 0 ;
    Object.keys(coinCounts).forEach(function(coins) {
        const guestHashes = [];
        let i;
        for (i = 0 ; i < coinCounts[coins] ; i++ ) {
            //guestHashes.push(fullGuestHashToShort[guestHashList[gi]]);
            guestHashes.push(guestHashList[gi]);
            gi++;
        }
        addCoinAward(coinAwards,coins,guestHashes);
    });
    //console.log(JSON.stringify(coinAwards));
    const json = JSON.stringify(coinAwards);
    const jsonLength = json.length ;
    console.log("coin awards length " + jsonLength);
    zlibCompress64(json);
    return coinAwards ;
}

function createCoinAwardsForRandomPlayers(coinCounts) {
    const coinAwards = {};
    addCoinAwardsForRandomPlayers(coinAwards,coinCounts);
    return coinAwards;
}


const emptyJsonStringLength = encodeURIComponent(JSON.stringify("")).length ;
const emptyJsonArrayLength = encodeURIComponent(JSON.stringify([])).length ;
function splitObjectOfArrays(obj,maxSize,joinArray,itemModificationFunction) {
    itemModificationFunction = itemModificationFunction || function(a) {return a;} ;
    const all = [];

    let currentSize = maxSize + 1 ;
    let current = {};

    const joinCharacter = "_";

    Object.keys(obj).forEach(function (key) {
        const arr = obj[key] ;
        if (arr.length === 0) {
            return ;
        }
        const newArr = [itemModificationFunction(arr[0])];
        let sizeIncrease = joinArray? encodeURIComponent(',"' + key+ '":' + JSON.stringify(newArr[0].toString())).length :
            encodeURIComponent(',"' + key+ '":' + JSON.stringify(newArr)).length ;

        if (sizeIncrease + currentSize > maxSize) {
            if (joinArray && current[key]) {
                current[key] = current[key].join(joinCharacter);
            }
            current = {} ;
            current[key] = newArr;
            all.push(current);
            currentSize = encodeURIComponent(JSON.stringify(current)).length ;
            if (joinArray) currentSize -= emptyJsonArrayLength ;
        }
        else {
            currentSize += sizeIncrease ;
            current[key] = newArr ;
        }

        for (let i = 1 ; i < arr.length ; i++) {
            const newItem = itemModificationFunction(arr[i]) ;
            sizeIncrease = encodeURIComponent( joinCharacter + JSON.stringify(newItem)).length ;
            if (joinArray) {
                sizeIncrease -= emptyJsonStringLength ;
            }
            //console.log({sizeIncrease, currentSize, maxSize});
            if (sizeIncrease + currentSize > maxSize) {
                //console.log("Starting new object");
                if (joinArray && current[key]) {
                    current[key] = current[key].join(joinCharacter);
                }
                current = {} ;
                current[key] = [itemModificationFunction(arr[i])];
                all.push(current);
                currentSize = encodeURIComponent(JSON.stringify(current)).length ;
                if (joinArray) currentSize -= emptyJsonArrayLength ;
            }
            else {
                currentSize += sizeIncrease ;
                current[key].push(newItem);
            }
        }
        if (joinArray && current[key]) {
            current[key] = current[key].join(joinCharacter);
        }
    });
    return all;
}

const messageLengthDefault = 1000 ;
export function sendCoins(pubnubConnection,channel,coinAwards,messageLength) {
    if (!coinAwards || Object.keys(coinAwards).length === 0) {
        return ;
    }
    messageLength = messageLength || messageLengthDefault ;

    // Split coinAwards into multiple messages, joining the guest hashes into a string, after replacing guest hashes with short versions
    const coinAwardsSplit = splitObjectOfArrays(coinAwards,messageLength,true,function(h) {return fullGuestHashToShort[h] || "missingGuestHash";});

    const itemSeparatorChar = "_" ;
    const arraySeparatorChar = "~" ;

    const useMeta = true ;
    const useZlib = false ;

    //console.log(JSON.stringify(coinAwardsSplit,null,2));
    let i = 0 ;
    const myInterval = setInterval(function() {
        if (i < coinAwardsSplit.length) {
            let meta = null ;
            if (useMeta) {
                const message = {};
                let ids = [];
                let coins =[];
                Object.keys(coinAwardsSplit[i]).forEach(function (k) {
                    coins.push(itemSeparatorChar+k+itemSeparatorChar);
                    ids.push(itemSeparatorChar+coinAwardsSplit[i][k]+itemSeparatorChar);
                });
                meta = {
                    coins:coins.join(arraySeparatorChar),
                    ids:ids.join(arraySeparatorChar)
                };
                publishMessage(pubnubConnection,channel,message,meta);
            }
            else {
                const message = {coinAwards:coinAwardsSplit[i]};
                if (useZlib) {
                    zlibCompress64(JSON.stringify(message), function(b64) {
                        publishMessage(pubnubConnection,channel,{"_zlib":b64});
                    });
                }
                else {
                    publishMessage(pubnubConnection,channel,message);
                }
            }

            i++;
        }
        if (i >= coinAwardsSplit.length) {
            clearInterval(myInterval);
        }
    },1);

    let totalLength = 0 ;
    coinAwardsSplit.forEach(function (ca,i) {
        const jsonLength = JSON.stringify(ca).length ;
        totalLength += jsonLength ;
        console.log("object " + i + " length: " + jsonLength);
    });
    console.log("Total length: " + totalLength);
}

export function testCoinAwards(pubnubConnection,channel,client) {

    const numPlayers = 20;
    const numHashes = Math.max(100000,numPlayers) ;
    addGuestHash("1234567890abcdef1234567890abcdef12345678");
    generateGuestHashes(numHashes);
    checkShortHashes();

    const coinAwards = createCoinAwardsForRandomPlayers({100:1,200:10,300:numPlayers-11});

    addCoinAwardsForRandomPlayers(coinAwards,{100:1});
    addCoinAwardsForRandomPlayers(coinAwards,{50:1});
    addCoinAwardsForRandomPlayers(coinAwards,{1000:1});

    dbAddCoinAwards(client,coinAwards);
    sendCoins(pubnubConnection,channel,coinAwards);

    dbGetTopCoins(client,0,-1);

}
