const fs = require("fs");

const battingPlayerCentric = require("./batting-player-centric");
const battingYearCentric = require("./batting-year-centric");
const battingPlayerMostLeast = require("./batting-player-most-least");

const playerPosition = require("./player-position");

const pitchingPlayerCentric = require("./pitching-player-centric");
const pitchingYearCentric = require("./pitching-year-centric");
const pitchingPlayerMostLeast = require("./pitching-player-most-least");

const triviaQuestionModels = [
	...battingPlayerCentric,
	...battingYearCentric,
	...battingPlayerMostLeast,

	...playerPosition,
	
	...pitchingPlayerCentric,
	...pitchingYearCentric,
	...pitchingPlayerMostLeast,
];

// const questionTypes = {
// 	'Position': 0,
// 	'BattingMostLeast': 0,
// 	'BattingPlayer': 0,
// 	'BattingYear': 0,
// 	'PitchingMostLeast': 0,
// 	'PitchingPlayer': 0,
// 	'PitchingYear': 0,	
// };

// const groups = {
// 	'Phillies': 0,
// 	'Lehigh Valley IronPigs': 0,
// 	...questionTypes,
// };

// const rand = a => a[Math.floor(Math.random()*a.length-1)];

// console.log(triviaQuestionModels.reduce((memo, d) => {
// 	// Ensure groups are created
// 	memo = {
// 		...groups,
// 		...memo,
// 	};

// 	// Group questions by Team
// 	memo[d.team]++;

// 	// ... by Type of question
// 	memo[d.questionType]++;

// 	return memo;
// }, {}), triviaQuestionModels.length);

// Object.keys(questionTypes).forEach(t => {
// 	const questionsOfType = triviaQuestionModels.filter(d => d.questionType === t);
// 	const exampleQ = rand(questionsOfType);

// 	console.log(t + " : ", exampleQ);
// });


// // console.log(triviaQuestionModels[0]);
// // console.log(triviaQuestionModels[100]);
// // console.log(triviaQuestionModels[200]);

// console.log(triviaQuestionModels.filter(n => n.team === "Phillies")[0]);



// const q = rand(triviaQuestionModels);

// console.log(q);

// setTimeout(() => {q.answer}, 500);



fs.writeFile("./trivia-question-models.json", JSON.stringify(triviaQuestionModels), (e) => {
	if (e) {
		console.log('Failed to write file', e);
	}
});
