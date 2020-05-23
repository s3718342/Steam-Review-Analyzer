const mysql = require("mysql");

var configs = {
	host: process.env.host,
	user: process.env.username,
	password: process.env.password,
	port: process.env.port,
	database: process.env.database,
};

exports.handler = (event, context, callback) => {
	context.callbackWaitsForEmptyEventLoop = false;
    var input = event.input;
	var connection = mysql.createConnection(configs);
	console.log(input)
	connection.connect((err) => {
		if (err) {
			callback(err);
        }else{
        	var pred = [];

	var sql = `SELECT * FROM applistschema.applist WHERE LOWER(appname) LIKE LOWER('${mysql_real_escape_string(
		input
	)}%')`;
	//Query the database for apps with titles that start with the input
	connection.query(sql, (err, result) => {
		if (err) throw err;
		pred = result;
		//If there are more than 8 results, remove all but 8 elements and send response
		if (pred.length > 8) {
			pred.splice(8);
			callback(null,pred);
		} else {
			//Otherwise
			sql = `SELECT * FROM applistschema.applist WHERE LOWER(appname) LIKE LOWER('%${mysql_real_escape_string(
				input
			)}%')`;
			//Query the database for apps with title that have the input at any location
			connection.query(sql, (err, result) => {
				if (err) throw err;
				//Join the two arrays
				pred = pred.concat(result);
				//If there are more than 8 results, remove all but 8 elements and send response
				if (pred.length > 8) {
					pred.splice(8);
				}
				callback(null,pred);
			});
		}
	});
        }
    });
};

function mysql_real_escape_string(str) {
	return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
		switch (char) {
			case "\0":
				return "\\0";
			case "\x08":
				return "\\b";
			case "\x09":
				return "\\t";
			case "\x1a":
				return "\\z";
			case "\n":
				return "\\n";
			case "\r":
				return "\\r";
			case '"':
			case "'":
			case "\\":
			case "%":
				return "\\" + char; // prepends a backslash to backslash, percent,
			// and double/single quotes
			default:
				return char;
		}
	});
}