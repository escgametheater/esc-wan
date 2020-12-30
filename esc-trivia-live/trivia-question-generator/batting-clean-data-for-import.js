const fs = require("fs");
const csvToJson = require("./csv-to-json");
const last = (arr) => arr[arr.length-1];

// Batting //

const minorsBattingData = csvToJson("./import-data/minor_batting_1977_2018.csv");
const philliesBattingData = csvToJson("./import-data/Phillies_Stats/Batting-Table 1.csv");
const philliesPlayersData = csvToJson("./import-data/Phillies_Stats/People-Table 1.csv");

const playerIdMap = philliesPlayersData.reduce((memo, d) => {
	memo[d.playerID] = d;
	return memo;
}, {});

// Filter data
const battingData = [
	...minorsBattingData,
	...philliesBattingData,
].filter((n) => {
	const team = n.Team || "";
	const isRightTeam = team === "Lehigh Valley" || team === "Phillies";

	if (!n['Batting Average']) {
		n['Batting Average'] = parseInt(n['Hits']) / parseInt(n['At Bats']);
	}

	const shouldCountBatter = parseFloat(n['Batting Average']) >= .130;
	const shouldIncludeYear = parseInt(n.Year) > 1940;
	// const shouldIncludeYear = true;

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

	return isRightTeam && shouldCountBatter && shouldIncludeYear;
});

const headers = ["playerid","Year","Team","League","Level","Last Name","First Name","Games Played","At Bats","Runs","Hits","Doubles","Triples","Home Runs","Runs Batted In","Stolen Bases","Caught Stealing","Walks","Intentional base on balls","Strikeouts","Sacrifice Hits","Sacrifice Fly","Hits By Pitch","Grounded into double play","Batting Average","Slugging Percentage","On-Base Percentage","On-Base Plus Slugging Percentage","Age","Height","Weight","Bats (R/L)","Throws (R/L)","Position","Birthdate","Birth City","Birth Region","mlbid"];

let writeData = `"` + headers.join(`","`) + `"\n`;


// Resert the headers
writeData += battingData.map((d) => {
	return `"` + headers.map(h => d[h]).join(`","`) + `"`;
}).join(`\n`);

fs.writeFile("./import-data/IronPigs-Phillies-Batting.csv", writeData, () => {});
