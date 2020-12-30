const fs = require("fs");

const csvToJson = (file, batting=true) => {
	const csv = fs.readFileSync(file, 'utf-8');
	const lines = csv.split("\n");
	const headerRow = lines[0].replace(/\"/g, "");
	const headerRowValues = headerRow.split(",");

	const result =
		lines.map((line, lineN) => line.split(",").reduce((memo, value, i) => {
			const key = headerRowValues[i];
			let keyLabel = key;

			let safeValue = value.replace(/\"/g, "");

			switch(key) {
				case "playerid":
				case "playerID":
					keyLabel = "playerID";
					break;
				case "nameFirst":
					keyLabel = "First Name";
					break;
				case "nameLast":
					keyLabel = "Last Name";
					break;
			}

			if (batting) {
				switch (key) {
					case "2B": keyLabel = "Doubles"; break;
					case "3B": keyLabel = "Triples"; break;
					case "AB": keyLabel = "At Bats"; break;
					case "AVG": keyLabel = "Batting Average"; break;
					case "BB": keyLabel = "Walks"; break;
					case "CS": keyLabel = "Caught Stealing"; break;
					case "G": keyLabel = "Games Played"; break;
					case "H": keyLabel = "Hits"; break;
					case "HR": keyLabel = "Home Runs"; break;
					case "HiLvl": keyLabel = "Highest Level Reached"; break;
					case "OBP": keyLabel = "On-Base Percentage"; break;
					case "OPS": keyLabel = "On-Base Plus Slugging Percentage"; break;
					case "Org": keyLabel = "MLB Parent Organization"; break;
					case "PA": keyLabel = "Plate Appearances"; break;
					case "R": keyLabel = "Runs"; break;
					case "RBI": keyLabel = "Runs Batted In"; break;
					case "SB": keyLabel = "Stolen Bases"; break;
					case "SLG": keyLabel = "Slugging Percentage"; break;
					case "SO": keyLabel = "Strikeouts"; break;
					case "TB": keyLabel = "Total Bases"; break;
					case "XBH": keyLabel = "Extra Base Hits"; break;
					case "Lg": keyLabel = "League"; break;
					case "Pos": keyLabel = "Position"; break;
					case "HBP": keyLabel = "Hits By Pitch"; break;
					case "SH": keyLabel = "Sacrifice Hits"; break;
					case "SF": keyLabel = "Sacrifice Fly"; break;
					case "IBB": keyLabel = "Intentional base on balls"; break;
					case "GDP": keyLabel = "Grounded into double play"; break;
					case "GiDP": keyLabel = "Grounded into double play"; break;

					case "Y":
					case "Year":
					case "year":
					case "yearID":
						keyLabel = "Year";
						break;
					case "teamName": keyLabel = "Team"; break;
					case "teamID": keyLabel = "Team"; safeValue = (safeValue === 'PHI' ? 'Phillies' : safeValue); break;
					case "Level": keyLabel = "Level"; break;
					case "orgName": keyLabel = "MLB Parent Organization"; break;
					case "nameLast":
					case "lastName": keyLabel = "Last Name"; break;
					case "nameFirst":
					case "firstName": keyLabel = "First Name"; break;
					case "Dbl": keyLabel = "Doubles"; break;
					case "Tpl": keyLabel = "Triples"; break;
					case "Bavg": keyLabel = "Batting Average"; break;
					case "Slg": keyLabel = "Slugging Percentage"; break;
					case "obp": keyLabel = "On-Base Percentage"; break;
					case "OPS": keyLabel = "On-Base Plus Slugging Percentage"; break;
					case "Age": keyLabel = "Age"; break;
					case "HT": keyLabel = "Height"; safeValue = safeValue.replace(/\-/g, "\'");  break;
					case "WT": keyLabel = "Weight"; break;

					case "Bats": keyLabel = "Bats (R/L)"; break;
					case "Throws": keyLabel = "Throws (R/L)"; break;
					case "posit": keyLabel = "Position"; break;
					case "borndate": keyLabel = "Birthdate"; break;
					case "cityName": keyLabel = "Birth City"; break;
					case "regionID": keyLabel = "Birth Region"; break;
					case "mlbid": keyLabel = "MLBID"; break;
				}
			} else {
				switch(key) {
					case "Y":
					case "Year":
					case "year":
					case "yearID":
						keyLabel = "Year";
						break;
					case "teamName": keyLabel = "Team"; break;
					case "teamID": keyLabel = "Team"; safeValue = (safeValue === 'PHI' ? 'Phillies' : safeValue); break;
					case "League": keyLabel = "League"; break;
					case "Level": keyLabel = "Level"; break;
					case "orgName": keyLabel = "Organization"; break;
					case "nameLast":
					case "lastName": keyLabel = "Last Name"; break;
					case "nameFirst":
					case "firstName": keyLabel = "First Name"; break;
					case "W": keyLabel = "Wins"; break;
					case "L": keyLabel = "Losses"; break;
					case "G": keyLabel = "Games"; break;
					case "GS": keyLabel = "Games Started"; break;
					case "CG": keyLabel = "Complete Game"; break;
					case "SHO": keyLabel = "Shutout"; break;
					case "GF": keyLabel = "Games Finished"; break;
					case "SV": keyLabel = "Save"; break;
					case "IPouts": keyLabel = "Innings Pitched"; break;
					case "IP": keyLabel = "Innings Pitched"; break;
					case "H": keyLabel = "Hits"; break;
					case "HR": keyLabel = "Home Runs"; break;
					case "R": keyLabel = "Runs"; break;
					case "ER": keyLabel = "Earned Runs"; break;
					case "BB": keyLabel = "Walks"; break;
					case "IBB": keyLabel = "Intentional Walk"; break;
					case "SO": keyLabel = "Strikeouts"; break;
					case "WP": keyLabel = "Wild Pitches"; break;
					case "BK": keyLabel = "Balk"; break;
					case "ERA": keyLabel = "Earned Run Average"; break;
					case "h9": keyLabel = "Hits per 9 Innings"; break;
					case "hr9": keyLabel = "Home Runs per 9 Innings"; break;
					case "bb9": keyLabel = "Walks per 9 Innings"; break;
					case "so9": keyLabel = "Shutouts per 9 innings"; break;
					case "WHIP": keyLabel = "Pitched"; break;
					case "age": keyLabel = "Age"; break;
					case "HT": keyLabel = "Height"; safeValue = safeValue.replace(/\-/g, "\'");  break;
					case "WT": keyLabel = "Weight"; break;
					case "Bats": keyLabel = "Bats (R/L)"; break;
					case "Throws": keyLabel = "Throws (R/L)"; break;
					case "posit": keyLabel = "Position"; break;
					case "borndate": keyLabel = "Birthdate"; break;
					case "cityName": keyLabel = "Birth City"; break;
					case "regionID": keyLabel = "Birth Region"; break;
					case "mlbid": keyLabel = "MLBID"; break;
				}
			}

			if (lineN === 0) {
				safeValue = keyLabel;
			}

			memo[keyLabel] = safeValue;

			return memo;
		}, {}));

	return result;
}

module.exports = csvToJson;
