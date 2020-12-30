const fs = require("fs");
const csvToJson = require("./csv-to-json");
const last = (arr) => arr[arr.length-1];

// Pitching
const minorsPitchingData = csvToJson("./import-data/minor_pitching_1977_2018.csv", false);
const philliesPitchingData = csvToJson("./import-data/Phillies_Stats/Pitching-Table 1.csv", false);
const philliesPlayersData = csvToJson("./import-data/Phillies_Stats/People-Table 1.csv");

const playerIdMap = philliesPlayersData.reduce((memo, d) => {
	memo[d.playerID] = d;
	return memo;
}, {});

// Filter data
const pitchingData = [
	...minorsPitchingData,
	...philliesPitchingData,
].filter((n) => {
	const team = n.Team || "";
	const isRightTeam = team === "Lehigh Valley" || team === "Phillies";

	const shouldCountPitcher = parseFloat(n['Innings Pitched']) >= 50;
	const shouldIncludeYear = parseInt(n.Year) > 1940;

	// This is ugly
	if (n.Team === "Lehigh Valley") {
		n.Team = "Lehigh Valley IronPigs";
	}

	if (!n['First Name'] && playerIdMap[n.playerID]) {

		Object.keys(playerIdMap[n.playerID]).forEach(k => {
			n[k] = playerIdMap[n.playerID][k];
		});
	}

	n['playerid'] = n['playerID'];

	return isRightTeam && shouldCountPitcher && shouldIncludeYear;
});

// Resert the headers
const headers =  ["playerid", "Year", "Team", "League", "Level", "Organization", "Last Name", "First Name", "Wins", "Losses", "Games", "Games Started", "Complete Game", "Shutout", "Games Finished", "Save", "Innings Pitched", "Hits", "Home Runs", "Runs", "Earned Runs", "Walks", "Intentional Walk", "Strikeouts", "Wild Pitches", "Balk", "Earned Run Average", "Hits per 9 Innings", "Home Runs per 9 Innings", "Walks per 9 Innings", "Shutouts per 9 innings", "Pitched", "Age", "Height", "Weight", "Bats (R/L)", "Throws (R/L)", "Position", "Birthdate", "Birth City", "Birth Region", "mlbid"];

let writeData = `"` + headers.join(`","`) + `"\n`;
writeData += pitchingData.map((d) => {
	return `"` + headers.map(h => d[h]).join(`","`) + `"`;
}).join(`\n`);

fs.writeFile("./import-data/IronPigs-Phillies-Pitching.csv", writeData, () => {});

// fs.writeFile("./IronPigs-Phillies-Pitching-2008-2018.csv", writeData, () => {});
