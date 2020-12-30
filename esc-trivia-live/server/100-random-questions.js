const data = require("./trivia-question-data.json");

// Pull random element from array
const rand = arr => arr[Math.floor(Math.random()*arr.length-1)];

// Store questions
const questions = [];

// Get 100 random questions
for (let i = 0; i < 100; i++) {
	questions.push(rand(data));
}

// Print questions
questions.forEach(q => {
	const correct = q.answers.filter(a => a.correct);
	const incorrect = q.answers.filter(a => !a.correct);

	console.log(q.text, "C:", correct.map(a => a.text).join(""));
	incorrect.forEach(a => console.log("IC:", a.text))
});