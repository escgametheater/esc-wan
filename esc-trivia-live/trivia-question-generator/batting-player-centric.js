const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Batting.csv");

const statToQuestion = {
	"Runs": {
		template: "crossed the plate $STAT times",
		include: (stat) => stat > 40,
	}, //>40
	"Hits": {
		template: "pounded $STAT hits",
		include: (stat) => stat > 60,
	}, //>60
	"Doubles": {
		template: "landed $STAT doubles",
		include: (stat) => stat > 10,
	}, //>10
	"Triples": {
		template: "clobbered $STAT triples",
		include: (stat) => stat > 5,
	}, //>5
	"Home Runs": {
		template: "ripped $STAT homeruns",
		include: (stat) => stat > 10,
	}, //>10
	"Runs Batted In": {
		template: "scored $STAT RBIs",
		include: (stat) => stat > 20,
	}, //>20
	"Stolen Bases": {
		template: "stole $STAT bases",
		include: (stat) => stat > 5,
	}, //>5
	"Caught Stealing": {
		template: "was caught stealing $STAT bases",
		include: (stat) => stat > 5,
	}, //>5
	"Walks": {
		template: "walked $STAT times",
		include: (stat) => stat > 10,
	}, //>10
	"Strikeouts": {
		template: "was struckout $STAT times",
		include: (stat) => stat < 10 || stat > 30,
	}, //<10 or >30
	"Hits By Pitch": {
		template: "was nailed by $STAT pitches",
		include: (stat) => stat > 5,
	}, //>5
	"Intentional base on balls": {
		template: "was walked intentionally $STAT times",
		include: (stat) => stat > 5,
	}, //>5
	"Grounded into double play": {
		template: "grounded into $STAT double plays",
		include: (stat) => stat > 5,
	}, //>5
};
// const question `Which player had 10 home runs in 2019?`
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
		const questionTemplate = `This $TEAM player ${questionText} in $YEAR.`;

		if (!stq.include(stat)) {
			return;
		}

		questions.push({
			text: questionTemplate.replace("$STAT", stat).replace("$YEAR", year).replace("$TEAM", d.Team),
			answer: player.fullName,
			player,
			questionType: "BattingPlayer",
			questionTemplate,
			year,
			team: d.Team,
		});
	});
});

module.exports = questions;