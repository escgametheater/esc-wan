const path = require('path');
const commonPath = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, "../common") : path.resolve(__dirname, "../../common");

console.log('=>>>>> process.env.NODE_ENV', process.env.NODE_ENV);

require("@babel/register")(
    {
        "presets" : ["@babel/preset-env"],
		"plugins": [
			["module-resolver", {
				root: "./",
				alias: {
					Common: commonPath,
				},
				
			}]
		]
    }
);

require('babel-polyfill');

require('./app.js');