const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Batting.csv");

const statToQuestion = {
	"At Bats": {
		template: "go up to bat $STAT times",
		include: (stat) => stat > 300,
	}, 
	"Runs": {
		template: "drive in $STAT runs",
		include: (stat) => stat > 40,
	}, 
	"Hits": {
		template: "land $STAT hits",
		include: (stat) => stat > 60,
	}, 
	"Doubles": {
		template: "knock $STAT doubles",
		include: (stat) => stat > 10,
	}, 
	"Triples": {
		template: "pound $STAT triples",
		include: (stat) => stat > 5,
	}, 
	"Home Runs": {
		template: "drive in $STAT home runs",
		include: (stat) => stat > 10,
	}, 
	"Runs Batted In": {
		template: "knock in $STAT runs",
		include: (stat) => stat > 20,
	}, 
	"Stolen Bases": {
		template: "steal $STAT bags",
		include: (stat) => stat > 5,
	}, 
	"Caught Stealing": {
		template: "get caught stealing $STAT times",
		include: (stat) => stat > 5,
	}, 
	"Walks": {
		template: "walk $STAT times",
		include: (stat) => stat > 10,
	}, 
	"Strikeouts": {
		template: "chalked up only $STAT strikeouts",
		include: (stat) => stat < 10 || stat > 30,
	}, 
	"Hits By Pitch": {
		template: "get hit by $STAT pitches",
		include: (stat) => stat > 5,
	}, 
};

// const question `Which year did Joe have 10 home runs`
// 2009, 2010, 2024, 2018[C]

const questions = [];

data.shift();

data.forEach(d => {
	const year = d.Year;
	const player = {
		id: d.playerid ? d.playerid : d.playerID,

		firstName: d["First Name"],
		lastName: d["Last Name"],
		fullName: `${d["First Name"]} ${d["Last Name"]}`,
	};

	Object.keys(statToQuestion).forEach((statToCapture) => {
		const stq = statToQuestion[statToCapture];
		const questionText = stq.template;
		const stat = d[statToCapture];
		const questionTemplate = `Which year did $PLAYER ${questionText} for the $TEAM?`;

		if (!stq.include(stat)) {
			return;
		}

		questions.push({
			text: questionTemplate.replace("$STAT", stat).replace("$PLAYER", player.fullName).replace("$TEAM", d.Team),
			answer: year,
			player,
			questionType: "BattingYear",
			questionTemplate,
			year,
			team: d.Team,
		});
	});
});

// console.log(questions.length, questions[questions.length-1]);

module.exports = questions;
