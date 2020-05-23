const mysql = require("mysql");
const axios = require("axios");

var configs = {
	host: process.env.host,
	user: process.env.username,
	password: process.env.password,
	port: process.env.port,
	database: process.env.database,
};

exports.handler = (event, context, callback) => {
	context.callbackWaitsForEmptyEventLoop = false;
	var connection = mysql.createConnection(configs);

	connection.connect((err) => {
		if (err) {
			callback(err);
		}
		axios.get("http://api.steampowered.com/ISteamApps/GetAppList/v2/").then((response) => {
			
			var apps = response.data.applist.apps;

			var appArr = [];
			for (var i in apps) {
				appArr.push([apps[i].appid, apps[i].name]);
			}

			//Performs async function to insert all apps into the database
			var sql =
				"INSERT INTO applist (appid, appname) VALUES ? ON DUPLICATE KEY UPDATE appid=appid";

			connection.query(sql, [appArr], function (err, result) {
				//pass values array (from above)  directly here
				if (err) throw err;
				console.log("Number of records inserted: " + result.affectedRows);
				callback(null, result.affectedRows);
			});
		});
	});
};
