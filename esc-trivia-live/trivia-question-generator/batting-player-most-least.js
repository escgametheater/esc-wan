const sortBy = require("lodash/sortBy");
const csvToJson = require("./csv-to-json");
const data = csvToJson("./import-data/IronPigs-Phillies-Batting.csv");

const statToQuestion = {
	"Games Played": {
		template: "played the most games, with $STAT",
		include: (stat, most) => most,
	},
	"At Bats": {
		template: "had the most at bats, with $STAT",
		include: (stat, most) => most,
	},
	"Runs": {
		template: "lead the team with $STAT runs",
		include: (stat, most) => most,
	},
	"Hits": {
		template: "lead the team with $STAT hits",
		include: (stat, most) => most,
	},
	"Doubles": {
		template: "had a team-leading $STAT doubles",
		include: (stat, most) => most,
	},
	"Triples": {
		template: "was the triple leader with $STAT",
		include: (stat, most) => most,
	},
	"Home Runs": {
		template: "won the team home run title with $STAT",
		include: (stat, most) => most,
	},
	"Runs Batted In": {
		template: "lead the team with $STAT RBIs",
		include: (stat, most) => most,
	},
	"Stolen Bases": {
		template: "stole the most bases on the team, with $STAT",
		include: (stat, most) => most,
	},
	"Caught Stealing": {
		template: "got caught stealing a season-leading $STAT times",
		include: (stat, most) => most,
	},
	"Walks": {
		template: "lead the team with $STAT walks",
		include: (stat, most) => most,
	},
	"Strikeouts": {
		template: "was struck out a team-leading $STAT times",
		include: (stat, most) => true,
	}, //THIS CAN ALSO BE A LEAST
	"Hits By Pitch": {
		template: "got hit by $STAT pitches to lead the team",
		include: (stat, most) => most,
	},
	"Intentional base on balls": {
		template: "was intentionally walked $STAT times, leading the team",
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
const firstYearOfRecord = data.reduce((year, d) => Math.min(year, d.Year), 3000);
const lastYearOfRecord = data.reduce((year, d) => Math.max(year, d.Year), 0);

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
		const questionTemplate = `This $TEAM player ${questionText} in $YEAR.`;


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
					questionType: "BattingMostLeast",
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
					questionType: "BattingMostLeast",
					questionTemplate,
					year,
					team: statLeastPlayer.Team,
				});
			}
		});
	});
}

module.exports = questions;