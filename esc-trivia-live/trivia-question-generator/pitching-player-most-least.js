const sortBy = require("lodash/sortBy");
const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Pitching.csv");

const statToQuestion = {
	"Wins": {
		template: "had the most wins with $STAT",
		include: (stat, most) => most,
	},
	"Losses": {
		template: "lead the team in losses, with $STAT",
		include: (stat, most) => most,
	},
	"Games Started": {
		template: "started a season record $STAT games",
		include: (stat, most) => most,
	},
	"Complete Game": {
		template: "completed $STAT games, the most on the team",
		include: (stat, most) => most,
	},
	"Shutout": {
		template: "lead the team in shutouts, with $STAT",
		include: (stat, most) => most,
	},
	"Games Finished": {
		template: "finished $STAT games, a season high",
		include: (stat, most) => most,
	},
	"Save": {
		template: "saved $STAT games, leading the team",
		include: (stat, most) => most,
	},
	"Hits": {
		template: "allowed a season high $STAT hits",
		include: (stat, most) => true,
	}, // THIS COULD BE MOST OR LEAST
	"Home Runs": {
		template: "allowed a season high $STAT home runs",
		include: (stat, most) => true,
	}, // THIS COULD BE MOST OR LEAST
	"Earned Runs": {
		template: "gave up only $STAT earned runs, the team low",
		include: (stat, most) => true,
	}, //COULD BE MOST OR LEAST
	"Walks": {
		template: "allowed only $STAT walks, the team high",
		include: (stat, most) => true,
	}, //COULD BE MOST OR LEAST	
	"Strikeouts": {
		template: "recorded the most strikeouts, with $STAT",
		include: (stat, most) => most,
	},
	"Wild Pitches": {
		template: "had the most wild pitches, with $STAT",
		include: (stat, most) => most,
	},
	"Balk": {
		template: "lead his team with $STAT balks",
		include: (stat, most) => most && stat < 2,
	}, //<2
	"Earned Run Average": {
		template: "had the highest ERA with $STAT",
		include: (stat, most) => most,
	},
};

// `Which player had the most home runs in 2019?`
// `Which player had the fewest home runs in 2019?`
// 2009, 2010, 2024, 2018[C]

const questions = [];

data.shift();


const last = (arr) => arr[arr.length-1];

// Years total
const firstYearOfRecord = data.reduce((year, d) => Math.min(year, d.Year), 3000)
const lastYearOfRecord = data.reduce((year, d) => Math.max(year, d.Year), 0)

// Teams
const teams = Object.keys(data.reduce((teams, d) => {
	teams[d.Team] = d.Team;
	return teams;
}, {}));

const dataByYear = data.reduce((memo, d) => {
	if (!memo[d.Year]) {
		memo[d.Year] = [];
	}

	memo[d.Year].push(d);
	return memo;
}, {});

/* Most / Least - Questions by year */

// For each year...
for (let y = firstYearOfRecord ; y <= lastYearOfRecord; y++) {
	if (!dataByYear[y]) {
		continue;
	}

	// For each stat
	Object.keys(statToQuestion).forEach((statToCapture) => {
		const stq = statToQuestion[statToCapture];
		const questionText = stq.template;
		const questionTemplate = `This $TEAM pitcher ${questionText} in $YEAR.`;

		// For each team
		teams.forEach((team) => {
			// Who had the most/last stat for team
			const statsByTeamByYear = dataByYear[y].filter(d => d.Team === team);

			if (!statsByTeamByYear.length) {
				return;
			}

			// Ordered ASC
			const orderedStats = sortBy(statsByTeamByYear, s => parseInt(s[statToCapture]));

			const statLeastPlayer = orderedStats[0];
			const statMostPlayer = last(orderedStats);

			const year = y;
			const mostPlayer = {
				id: statMostPlayer.playerid,
				firstName: statMostPlayer["First Name"],
				lastName: statMostPlayer["Last Name"],
				fullName: `${statMostPlayer["First Name"]} ${statMostPlayer["Last Name"]}`,			
			};

			const leastPlayer = {
				id: statLeastPlayer.playerid,
				firstName: statLeastPlayer["First Name"],
				lastName: statLeastPlayer["Last Name"],
				fullName: `${statLeastPlayer["First Name"]} ${statLeastPlayer["Last Name"]}`,			
			};

			// Most
			if (stq.include(statMostPlayer[statToCapture], true)) {
				questions.push({
					text: questionTemplate.replace("$STAT", statMostPlayer[statToCapture]).replace("$YEAR", year).replace("$TEAM", statMostPlayer.Team),
					answer: mostPlayer.fullName,
					player: mostPlayer,
					questionType: "PitchingMostLeast",
					questionTemplate,
					year,
					team: statMostPlayer.Team,
				});
			}

			// Least
			if (stq.include(statLeastPlayer[statToCapture], false)) {
				questions.push({
					text: questionTemplate.replace("$STAT", statLeastPlayer[statToCapture]).replace("$YEAR", year).replace("$TEAM", statLeastPlayer.Team),
					answer: leastPlayer.fullName,
					player: leastPlayer,
					questionType: "PitchingMostLeast",
					questionTemplate,
					year,
					team: statLeastPlayer.Team,
				});
			}
		});
	});
}

module.exports = questions;