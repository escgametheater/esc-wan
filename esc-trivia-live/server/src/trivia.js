import * as Constants from "../common/constants";
import {formatTime} from "../common/functions";
import {dbAddCoinAwards, sendCoins, addCoinAward, dbGetTopCoins, addGuestHash} from "./coins";
import {publishMessage} from "./pubnub";
import {apiGetDataRows} from "./API";

const triviaQuestions = {};
//const triviaData = require("../trivia-question-data.json");

const randomArrayElement = a => a[Math.floor(Math.random()*a.length)];

function dbGetAnswerCounts(multiClient,questionId, answers) {
    const numAnswers = answers.length ;
    if (!numAnswers) {
        console.error("dbGetAnswerCounts: numAnswers 0 for questionId "+questionId,answers);
        return 0;
    }
    for (let i = 0 ; i < numAnswers ; i++) {
        const answersKey = dbKeyGuestAnswers(questionId, i);
        multiClient.zcard(answersKey, (err, count) =>  {
            if (err) {
                console.log("Error getting zcard for key "+ answersKey);
            }
            else {
                answers[i].answerCount = count;
                console.log(`${formatTime()} Answer ${i} count ${count}`);
            }
        });
    }
    return numAnswers;
}

function dbGetAllAnswers(multiClient,questionId, answers, allAnswers) {
    const numAnswers = answers.length ;
    if (!numAnswers) {
        console.error("dbGetAllAnswers: numAnswers 0 for questionId "+questionId,answers);
        return 0;
    }
    for (let i = 0 ; i < numAnswers ; i++) {
        const answersKey = dbKeyGuestAnswers(questionId, i);
        multiClient.zrange(answersKey, 0, -1, "WithScores",  (err, guestHashAnswers) => {
            if (err) {
                console.log("Error getting zrange for key "+ answersKey);
            }
            else {
                allAnswers[i] = guestHashAnswers ;
                const count = guestHashAnswers.length/2 ;
                answers[i].answerCount = count;
                console.log(`${formatTime()} Answer ${i} count ${count}`);
            }
        });
    }
    return numAnswers;
}

const TriviaGame = {
    slug: "trivia-live",
    messageHandler: triviaMessageHandler,
    botMessageHandler: botMessageHandler,
    cues: triviaGameCues,
    dbPrefix: "trivia",
    clockSyncSeconds: 5,
    leaderBoardLength: 10,
    triviaData: [],
    init: (context) => {
        apiGetDataRows("trivia-questions","ironpigs","trivia-question-data",20000,3).then((result) => {
            context.gameObject.triviaData = result ;
        });
    },

    getReadyMessage: (cue) => {
        return Promise.resolve({
            phase: cue.phase,
            sponsor: "sponsor-esc-games"
        });
    },
    getQuestionMessage: (cue,context) => {
        const q = randomArrayElement(context.gameObject.triviaData);

        triviaQuestions[q.id] = q ;

        context.gameState.questionId = q.id;

        const qWithoutCorrectAnswers = {...q} ;
        qWithoutCorrectAnswers.answers = [];

        qWithoutCorrectAnswers.answers = q.answers.map((a) => {
            return {
                id: a.id,
                text: a.text
            }
        });

        const multi = context.db.stateClient.multi();
        dbRemoveAllAnswers(multi,q.id,q.answers.length);
        multi.hmset(`questions.${context.gameState.questionId}`,
            {
                text: q.text,
                answers: JSON.stringify(q.answers)
            }
        );
        multi.exec(function (err, replies) {
            if (err) {
                console.error("getQuestionMessage redis error",err,replies);
            }
            else {
                console.log("getQuestionMessage redis commands completed.",replies);
            }
        });

        return Promise.resolve({
            phase: cue.phase,
            questionId: context.gameState.questionId,
            ...qWithoutCorrectAnswers,
        });
    },
    awardCoins: (context,answers,allAnswers) => {
        if (!answers || !answers.length) {
            return ;
        }
        const fastestCorrectCoins = 10000 ;
        const correctCoins = 100 ;
        const wrongAnswerCoins = 1 ;
        const coinAwards = {};
        for (let i = 0 ; i < answers.length ; i++ ){
            if (!allAnswers[i]) {
                continue;
            }
            const guestHashes = allAnswers[i].filter((e,i) => (i % 2) === 0);
            if (guestHashes.length) {
                if (answers[i].correct) {
                    addCoinAward(coinAwards, fastestCorrectCoins, [guestHashes[0]]);
                    addCoinAward(coinAwards, correctCoins, guestHashes);
                }
                if (wrongAnswerCoins) {
                    addCoinAward(coinAwards, wrongAnswerCoins, guestHashes);
                }
            }
        }
        dbAddCoinAwards(context.db.coinsClient,coinAwards);
        sendCoins(context.pubnubConnection,context.coinsChannel,coinAwards);
    },
    getAnswerMessage: (cue, context) => {

        return new Promise((s, /*f*/) => {
            console.log(formatTime()+" "+cue.phase+" starting");
            context.flushMulti();
            const q = triviaQuestions[context.gameState.questionId];

            // Duplicate q.answers, with count of 0,
            const answerIdIndexMap = {};

            const answers = q.answers.map((a) => {
                return {
                    ...a,
                    answerCount: 0,
                };
            });

            let correctIndex = -1 ;
            answers.forEach((a, i) => {
                answerIdIndexMap[a.id] = i;
                if (a.correct) {
                    correctIndex = i ;
                }
            });

            // Prep message to respond with
            const message = {
                phase: cue.phase,
                questionId: context.gameState.questionId,
                ...q,
                answers,
            };

            // Get the answers from the redis database, sorted by time. If we're awarding coins for answering
            // wrong, we'll want all answers, otherwise just correct answers and totals.

            // Set to true to get all the guestHash answers, including wrong ones
            const getAllAnswers = true ;
            const multi = context.db.stateClient.multi();
            // Get the answer counts for each answer, and populate answers[].answerCounts with them
            const allAnswers = [] ;
            if (getAllAnswers) {
                dbGetAllAnswers(multi,context.gameState.questionId,answers,allAnswers);
            }
            else {
                dbGetAnswerCounts(multi,context.gameState.questionId,answers);
            }

            const fastestAnswerer = {
                guestHash: false,
                time: 0,
            };

            if (!getAllAnswers && correctIndex >=0) {
                const answersKey = dbKeyGuestAnswers(context.gameState.questionId, correctIndex);
                multi.zrange(answersKey, 0, -1, "WithScores",  (err, guestHashAnswers) => {
                    if (err) {
                        console.error("Error getting correct answers.");
                    }
                    else if (!guestHashAnswers || guestHashAnswers.length === 0) {
                        console.log("No correct answers.");
                    }
                    else {
                        allAnswers[correctIndex] = guestHashAnswers ;
                        //console.log("guestHashAnswers:" ,guestHashAnswers);
                    }
                });
            }

            multi.exec(function (err, replies) {
                if (err) {
                    console.error("getAnswerMessage redis error",err,replies);
                }
                //console.log("getAnswerMessage replies",replies);
                if (correctIndex < 0) {
                    console.error("No answer was marked correct! Question was: ",q);
                }
                else if ( allAnswers[correctIndex].length === 0) {
                    console.log("No one answered correctly. Question was: ",q);
                }
                else {
                    fastestAnswerer.guestHash = allAnswers[correctIndex][0];
                    fastestAnswerer.time = allAnswers[correctIndex][1];
                }
                console.log("allAnswers",allAnswers);

                TriviaGame.awardCoins(context,answers,allAnswers);

                s({
                    ...message,
                    fastestAnswerer,
                });
            });

        })
    },

    // loop all users
    //  - award coins for
    //  -- fastest person (count most recent answer time)
    //  -- correct answer
    //  - generate uuid for coin award
    //  - send user's coin awards
    //  -- collapse for coin award
    //  -- batch coin messages to be { [guestHash1] : 1000, [guestHash2] : 1000, }
    // or _guestHash1~100_guestHash2~100_
    //  -- send coins to user on player direct channel ?
    //  - POST coin awards

    // -- API - /v1/coins/award
    /*
    [
        {
          uuid: "coin-award-5347-yilg",
          guestHash: "abc-123-xyz",
          activationId: ${activationId},
          contextEntityType: ${question.contextEntityType},
          contextEntityKey: ${question.contextEntityKey},
          coins: 1000
        },
        {
          uuid: "coin-award-2347-gjgj",
          guestHash: "abc-123-xyz",
          activationId: ${activationId},
          contextEntityType: ${question.contextEntityType},
          contextEntityKey: ${question.contextEntityKey},
          coins: 10
        },
        {
          uuid: "coin-award-2344-sfgj",
          guestHash: "gjf-999-xyz",
          activationId: ${activationId},
          contextEntityType: ${question.contextEntityType},
          contextEntityKey: ${question.contextEntityKey},
          coins: 10000
        }
    ]
    */

    // TODO  -- API - /v1/coins/ledger
    /*
     {
       guestHash: "gjf-999-xyz", // optional
       userId: 235, // optional
       slug: "jlevine", // optional
       gameSlug: "esc-trivia-live", // optional
     }
     */

    // return {
    //     phase: cue.phase,
    //     questionId: questionId,
    //     ...q,
    //     answers,
    // }

    getAdMessage: (cue, context) => {
        return Promise.resolve({
            adId: ++context.gameState.adId,
            type: "sponsored-question", // image, video, custom-asset, html5, ...
            sponsor: "iron-pigs"
        })
    },
    getLeaderboardMessage: (cue, context) => {
        return new Promise((s, /*f*/) => {
            dbGetTopCoins(context.db.coinsClient,0,context.gameObject.leaderBoardLength-1,(err,topCoins)=> {
                const leaders =[];
                if (err) {
                    console.error("dbGetTopCoins returned error",err,topCoins);
                }
                else {
                    //console.log("topCoins",topCoins);
                    for (let i = 0 ; i < topCoins.length ; i +=2) {
                        leaders.push({
                            initials: topCoins[i].substr(0,5),
                            score: topCoins[i+1]
                        })
                    }
                }
                context.gameState.leaders = leaders ;
                s({
                    adId:  ++context.gameState.adId,
                    type: "day",
                    sponsor: "esc-trivia-live",
                    leaders
                });
            });
        });
    }
};


function dbKeyGuestAnswers(questionId,answerIndex) {
    return `questions.${questionId}.answer_${answerIndex}.guestHashes` ;
}

function dbAddAnswerGuest(client,questionId,answerIndex,guestHash) {
    const dbKey =  dbKeyGuestAnswers(questionId,answerIndex);
    // keep answers in a sorted array
    client.zadd(dbKey,Date.now(),guestHash);
}
function dbRemoveAnswerGuest(client,questionId,answerIndex,guestHash) {
    const dbKey =  dbKeyGuestAnswers(questionId,answerIndex);
    client.zrem(dbKey,guestHash);
}
function dbRemoveAnswer(client,questionId,answerIndex) {
    const dbKey =  dbKeyGuestAnswers(questionId,answerIndex);
    client.del(dbKey);
}
function dbRemoveAllAnswers(client,questionId, numAnswers = 3) {
    for (let i = 0 ; i < numAnswers ; i++) {
        dbRemoveAnswer(client, questionId, i);
    }
}

function triviaMessageHandler (context) {
    context = context || this ;
    if (!context) {
        console.error("triviaMessageHandler called without context.");
        process.abort();
    }
    return function (rawMessage) {
        //console.log("triviaMessageHandler received message\n", rawMessage);
        const message = rawMessage.message;

        switch (message.eventName) {
            case Constants.CU_ANSWER:
                if (context.gameState.phase === Constants.PHASE_QUESTION || context.gameState.phase === Constants.PHASE_ANSWER_BUFFER) {
                    if (context.gameState.phase === Constants.PHASE_ANSWER_BUFFER) {
                        console.log(formatTime() + " Answer received in phase " + context.gameState.phase );
                    }
                    const body = message.body;
                    if (context.gameState.questionId !== body.questionId) {
                        console.error("Error, answer questionId " + body.questionId + " does not match current questionId " + context.gameState.questionId,message);
                        return;
                    }
                    const q = triviaQuestions[context.gameState.questionId];

                    if (!q) {
                        console.error("Could not find question")
                    }


                    const meta = rawMessage.userMetadata || {} ;
                    const guestHash = body.guestHash || meta.guestHash || rawMessage.publisher ;
                    addGuestHash(guestHash);

                    let answerIndex = -1;
                    q.answers.forEach((a,i) => {
                        if (a.id === body.answerId) {
                            answerIndex = i ;
                            dbAddAnswerGuest(context.db.stateMulti,context.gameState.questionId, i, guestHash);
                        }
                        else {
                            // Remove old answers if any
                            dbRemoveAnswerGuest(context.db.stateMulti,context.gameState.questionId, i, guestHash);
                        }
                    });
                    if (answerIndex < 0) {
                        console.error("answer " + body.answerId + " not found.");
                        return ;
                    }

                    // We could expire answers but probably better to allow them to be archived or deleted later by another process

                    notTrackingLogCount = 0;
                }
                else {
                    if (notTrackingLogCount < 10) {
                        notTrackingLogCount++;
                        console.log(formatTime() + " Answer received in wrong phase " + context.gameState.phase)
                    }
                }
                break;
        }
    }
}
let notTrackingLogCount = 0 ;

function triviaGameCues() {
    return [
        {
            duration: 3,
            phase: Constants.PHASE_GET_READY,
            optional: true,
            roundActive: false,
            message: TriviaGame.getReadyMessage
        },
        {
            duration: 8,
            phase: Constants.PHASE_QUESTION,
            optional: true,
            roundActive: true,
            message: TriviaGame.getQuestionMessage
        },
        {
            duration: 2,
            phase: Constants.PHASE_ANSWER_BUFFER,
            optional: false,
            roundActive: true,
            message: () => Promise.resolve(null),
        },
        {
            duration: 6,
            phase: Constants.PHASE_ANSWER,
            optional: false,
            roundActive: true,
            message: TriviaGame.getAnswerMessage
        },
        {
            duration: 4,
            phase: Constants.PHASE_AD,
            optional: true,
            roundActive: false,
            message: TriviaGame.getAdMessage
        },
        {
            duration: 7,
            phase: Constants.PHASE_LEADERBOARD,
            optional: true,
            roundActive: false,
            message: TriviaGame.getLeaderboardMessage
        },
    ];
}

function botMessageHandler(botConnection, publishChannel, guestHash, botId) {
    return function (rawMessage) {
        //console.log(`\n\nBot ${guestHash} received`, rawMessage);

        const gameState = rawMessage.message.body.phaseStats;
        if (!gameState) {
            console.log(`\n\nBot ${guestHash} received message without phaseStats`, rawMessage);
            return ;
        }
        const phase = gameState.phase;
        if (phase === Constants.PHASE_QUESTION) {
            //console.log(`Bot ${guestHash} received`, gameState);
            const meta = {
                guestHash
            };

            if (!gameState.answers.length) {
                console.error("No answers for question. gameState is\n", gameState);
                return;
            }
            if (gameState.answers.length !== 3) {
                //console.warn("Only " + gameState.answers.length + " answers for question. gameState is\n",gameState);
            }
            const answerIndex = botId % gameState.answers.length;
            const reply = {
                eventName: Constants.CU_ANSWER,
                body: {
                    questionId: gameState.questionId,
                    answerId: gameState.answers[answerIndex].id
                }
            };
            //const answerDelay = 500*Math.exp(2.5*Math.random()) ;
            const answerDelay = 500 + 4000 * Math.random() ;
            setTimeout(()=>{
                publishMessage(botConnection, publishChannel, reply, meta);
            },answerDelay);
        }
    }
}

export {TriviaGame};
