const fs = require("fs");
const uuidv4 = require('uuid/v4');
const shuffle = require('lodash/shuffle');

let models = require("./trivia-question-models.json");

const modelsOfType = type => models.filter(m => m.questionType === type);
const rand = a => a[Math.floor(Math.random()*a.length-1)];

const modelsOfTypeMap = models.reduce((memo, m) => {
	if (!memo[m.questionType]) {
		memo[m.questionType] = [];
	}
	memo[m.questionType].push(m);
	return memo;
}, {});

const len = models.length;

// const triviaQuestions = models.map((d, i) => {
const triviaQuestions = models.map((d, i) => {
	// Generate an incorrect answer for the question
	const filteredModels = modelsOfTypeMap[d.questionType];
	const incorrectAnswers = [];
	let incorrectModel;

	while(incorrectAnswers.length < 2 && !!(incorrectModel = rand(filteredModels)) && incorrectModel.answer !== d.answer) {
		incorrectModel.player = JSON.stringify(incorrectModel.player);
		incorrectAnswers.push(incorrectModel);
	};

	console.log(i + " of " + len);

	const q = {
		id: uuidv4(),
		questionNum: i+1,
		text: d.text,
		answers: [{
			id: uuidv4(),
			text: d.answer,
			correct: true,
		}, ...incorrectAnswers.map(a => ({
			id: uuidv4(),
			text: a.answer,
			correct: false,
		}))]
	};

	// Randomize answers
	q.answers = shuffle(q.answers);

	return q;
});

fs.writeFile("./trivia-question-data.json", JSON.stringify(triviaQuestions), (e) => {
	if (e) {
		console.log('Failed to write file', e);
	}
});
