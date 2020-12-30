const fs = require('fs');
const fileName = process.argv[2] ;

if (!fileName) {
    console.log("Please enter a file name.");
    return ;
}

function getJSONfromFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName));
}

function safeInc(obj,key) {
    const v = obj[key] ;
    obj[key] = v ? v+1 : 1 ;
}

function processMessages(messages) {
    const userAgents = {};
    let counts = {
        total: 0,
        totalShakes: 0,
        loggedIn: 0,
        noAcc: 0,
        noShakes: 0,
        noShakesInGame: 0,
        status: {},
        userAgents: {
        },
        browsers: {

        },
        teamSelections: {

        },
        highestScores:[{id:"",score:0}],
        userIds: {}
    };

    messages.forEach(function(msg,i) {
        counts.total++;
        const device = msg.entry.device ;

        // User Agent
        safeInc(userAgents,device.userAgent);
        const ua1 = device.userAgent.split(";",1)[0];
        safeInc(counts.userAgents,ua1);
        const userAgentSplit = device.userAgent.split("(KHTML, like Gecko) ",2);
        const browser = userAgentSplit[1].split("/",1)[0];
        safeInc(counts.browsers,browser);

        const userId = msg.entry.userId ;
        if (userId) {
            counts.loggedIn ++;
        }
        safeInc(counts.userIds,userId);

        // Orientation was not properly set
        if (device.screen.orientation) {
            let o = JSON.stringify(device.screen.orientation);
            if (o.length > 5) {
                console.log("Orientation: "+o);
            }
        }

        const maxAcc = msg.entry.gamePlay.maxAcc ;
        let noAcc = false ;
        if (maxAcc.x * maxAcc.y * maxAcc.z === 0) {
            counts.noAcc++;
            noAcc = true ;
            console.log("No acc:" + msg.entry.device.userAgent);
        }

        const shakeCount = msg.entry.gamePlay.shakeCount ;
        if (shakeCount === 0) {
            counts.noShakes ++;
        }

        const teamSelections = msg.entry.gamePlay.teamSelectionCount;
        if (teamSelections > 20) {
            console.log("Team selections: " + teamSelections /*+ "\n" + JSON.stringify(msg.entry)*/);
        }

        if (shakeCount === 0 && teamSelections && !noAcc) {
            console.log("Accelerometer present and ShakeCount 0 but teamSelection made");
        }

        const team = msg.entry.gamePlay.team ;
        if (!teamSelections && team !== "Null" && shakeCount === 0 ) {
            console.log("Team is " + team + ", but no team selections recorded!",msg.entry.gamePlay.teamSelections);
        }


        safeInc(counts.teamSelections,teamSelections);

        let lastShake = false ;
        let shakeShakes = 0 ;
        let roundEnergy = 0 ;
        msg.entry.gamePlay.shakes.forEach((shake,i)=> {
            counts.totalShakes ++ ;
            if (shake.phase === "Shake") {
                shakeShakes++;
                lastShake = shake ;
            }
            else {
                if (shake.roundEnergy) {
                    //console.log("shake.roundEnergy is not 0",shake);
                }
            }
            if (shake.roundEnergy > counts.highestScores[0].score) {
                counts.highestScores[0].score = shake.roundEnergy ;
                counts.highestScores[0].id = msg.entry.guestHash.slice(0,4);
            }
            roundEnergy = Math.max(roundEnergy,shake.roundEnergy);
            safeInc(counts.status,shake.status);
            if (shake.status==="error") {
                //console.log(counts.total + " shake error, shake #"+i,shake);
            }
        });
//        if (roundEnergy > 0) {
            console.log("id " + msg.entry.guestHash.slice(0,4) + " score " + roundEnergy );
//        }
        if (shakeCount) {
            if (roundEnergy > 0) {
                //console.log(userId + " " + lastShake.roundEnergy);
            }
            else {
                counts.noShakesInGame++;
                //console.log(userId + " no shakes during Shake phase but "+shakeCount+" shakes."/*,msg , msg.entry.gamePlay*/);
            }
        }

    });

    console.log(counts );

    //console.log("User agents:",userAgents);
}

const allMessages = getJSONfromFile(fileName);
processMessages(allMessages);