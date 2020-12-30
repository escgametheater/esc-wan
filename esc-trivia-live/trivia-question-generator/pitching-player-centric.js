const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Pitching.csv");

const statToQuestion = {
	"Wins": { 
		template: "was credited with $STAT wins", //>7
		include: (stat) => stat > 7,
	},
	"Losses": { 
		template: "took $STAT losses",//<2 or >7
		include: (stat) => stat < 2 || stat > 7,
	},
	"Games Started": { 
		template: "started $STAT games",//>10
		include: (stat) => stat > 10,
	},
	"Complete Game": { 
		template: "had $STAT complete games",//>1
		include: (stat) => stat > 1,
	},
	"Shutout": { 
		template: "had $STAT shutouts",//>1
		include: (stat) => stat > 1,
	},
	"Games Finished": { 
		template: "closed $STAT games",//>7
		include: (stat) => stat > 7,
	},
	"Save": { 
		template: "was credited with $STAT saves",//>7
		include: (stat) => stat > 7,
	},
	"Hits": { 
		template: "gave up only $STAT hits",//<25 (assuming they have >50 IP)
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
		template: "walked $STAT batters",//<5 (assuming they have >50 IP)
		include: (stat) => stat < 5,
	},
	"Strikeouts": { 
		template: "recorded $STAT Ks",//>50 (assuming they have >50 IP)
		include: (stat) => stat > 50,
	},
	"Wild Pitches": { 
		template: "spiked $STAT wild pitches",//<1 (assuming they have >50 IP) or >10
		include: (stat) => stat < 1 || stat > 10,
	},
	"Earned Run Average": { 
		template: "had an ERA of $STAT",//<2.50
		include: (stat) => stat < 2.50,
	},
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
		const questionTemplate = `This $TEAM pitcher ${questionText} in $YEAR?`;

		if (!stq.include(stat)) {
			return;
		}

		questions.push({
			text: questionTemplate.replace("$STAT", stat || 0).replace("$YEAR", year).replace("$TEAM", d.Team),
			answer: player.fullName,
			player,
			questionType: "PitchingPlayer",
			questionTemplate,
			year,
			team: d.Team,
		});
	});
});


module.exports = questions;
