const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Batting.csv");
const data2 = csvToJson("./import-data/IronPigs-Phillies-Pitching.csv");

const statToQuestion = {
	"Position": "$STAT",
};

const positionToLabel = {
	"C": "Catcher",
	"P": "Pitcher",
	"OF": "Outfielder",
	"LF": "Left Fielder",
	"RF": "Right Fielder",
	"CF": "Center Fielder",
	"1B": "First Baseman",
	"2B": "Second Baseman",
	"3B": "Third Baseman",
	"SS": "Shortstop",
	"IF": "Infielder",
};

const questions = [];

data.shift();
data2.shift();

const generateQuestion = d => {
	const year = d.Year;
	const player = {
		id: d.playerid ? d.playerid : d.playerID,
		firstName: d["First Name"],
		lastName: d["Last Name"],
		fullName: `${d["First Name"]} ${d["Last Name"]}`,
	};

	Object.keys(statToQuestion).forEach((statToCapture) => {
		const questionText = statToQuestion[statToCapture];
		const stat = d[statToCapture];

		if (!stat) {
			return;
		}

		const allPositions = stat.split("-").map(s => positionToLabel[s]).join(" and ");
		const questionTemplate = `This ${questionText} played for the $TEAM in $YEAR.`;

		questions.push({
			text: questionTemplate.replace("$STAT", allPositions).replace("$YEAR", year).replace("$TEAM", d.Team),
			answer: player.fullName,
			pos: allPositions,
			player,
			questionType: "Position",
			questionTemplate,
			year,
			team: d.Team,
		});
	});
}

data.forEach(generateQuestion);
data2.forEach(generateQuestion);

module.exports = questions;
