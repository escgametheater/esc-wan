const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Pitching.csv");

const statToQuestion = {
	"Wins": { 
		template: "was credited with $STAT wins", //>7
		include: (stat) => stat > 7,
	},
	"Losses": { 
		template: "recorded $STAT losses",//<2 or >7
		include: (stat) => stat < 2 || stat > 7,
	},
	"Games Started": { 
		template: "started $STAT games",//>10
		include: (stat) => stat > 10,
	},
	"Complete Game": { 
		template: "pitched $STAT complete games",//>1
		include: (stat) => stat > 1,
	},
	"Shutout": { 
		template: "achieved $STAT shutouts",//>1
		include: (stat) => stat > 1,
	},
	"Games Finished": { 
		template: "closed $STAT games",//>7
		include: (stat) => stat > 7,
	},
	"Save": { 
		template: "recorded $STAT saves",//>7
		include: (stat) => stat > 7,
	},
	"Hits": { 
		template: "allow $STAT hits",//<25 (assuming they have >50 IP)
		include: (stat) => stat < 25,
	},
	"Home Runs": { 
		template: "allowed only $STAT homeruns",//<5 (assuming they have >50 IP)
		include: (stat) => stat < 5,
	},
	"Earned Runs": { 
		template: "gave up only $STAT earned runs",//<10 (assuming they have >50 IP)
		include: (stat) => stat < 10,
	},
	"Walks": { 
		template: "allowed only $STAT walks",//<5 (assuming they have >50 IP)
		include: (stat) => stat < 5,
	},
	"Strikeouts": { 
		template: "registered $STAT strikeouts",//>50 (assuming they have >50 IP)
		include: (stat) => stat > 50,
	},
	"Wild Pitches": { 
		template: "flung $STAT wild pitches",//<1 (assuming they have >50 IP) or >10
		include: (stat) => stat < 1 || stat > 10,
	},
	"Earned Run Average": { 
		template: "had an ERA of $STAT",//<2.50
		include: (stat) => stat < 2.50,
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
		const questionTemplate = `$PLAYER ${questionText} for the $TEAM in this year.`;

		if (!stq.include(stat)) {
			return;
		}

		questions.push({
			text: questionTemplate.replace("$STAT", stat || 0).replace("$PLAYER", player.fullName).replace("$TEAM", d.Team),
			answer: year,
			player,
			questionType: "PitchingYear",
			questionTemplate,
			year,
			team: d.Team,
		});
	});
});

module.exports = questions;
