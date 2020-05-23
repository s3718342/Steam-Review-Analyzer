const axios = require("axios");
const language = require("@google-cloud/language");
const utf8 = require("utf8");
const mysql = require("mysql");

var configs = {
	host: process.env.host,
	user: process.env.username,
	password: process.env.password,
	port: process.env.port,
	database: process.env.database,
};

const client = new language.LanguageServiceClient({
	projectId: process.env.projectId,
	credentials: {
		client_email: process.env.client_email,
		private_key: process.env.private_key.replace(/\\n/g, '\n'),
	},
});

exports.handler = (event, context, callback) => {
	context.callbackWaitsForEmptyEventLoop = false;

	var connection = mysql.createConnection(configs);

	connection.connect((err) => {
		if (err) {
			callback(err);
		} else {
			var buildResponse = {success: false};

			var title = event.title;
			var type = event.type;
			var sql = `SELECT appid FROM applistschema.applist WHERE LOWER(appname) = LOWER('${mysql_real_escape_string(
				title
			)}')`;
			//Get the appid from the database
			connection.query(sql, (err, result) => {
				if (result.length === 0) {
					callback(null,buildResponse);
				} else {
					//Get the reviews of the given app
					axios(
						`https://store.steampowered.com/appreviews/${result[0].appid}?json=1&num_per_page=100&filter=${type}&language=english`
					).then((response) => {
						var reviews = response.data.reviews;
						buildResponse.query_summary = response.data.query_summary;
						if (reviews.length > 0) {
							buildResponse.best_review = response.data.reviews[0];
							var count = 0;
							var content = "";
							reviews.forEach((rev) => {
								count++;

								//Ensure Review has at least 2 words
								if (rev.review.trim().indexOf(" ") != -1) {
									//PreProcess the review
									//1. make the text all the same case
									//2. remove all non alphanumeric characters
									//3. remove words game games and gaming (its is assumed the application is a game and therefore would be a reflection of the application as a whole)
									//4. remove words review and reviews (assumed the text is a review)
									var review = rev.review
										.toLowerCase()
										.replace(/[^\.,\w\s]/gi, "")
										.replace(/gam[es(ing)]+/gi, "")
										.replace(/reviews*/gi, "");

									//Counter to limit the number of reviews to process
									if (count < 50)
										//Convert review strings to utf8 to both reduce costs (google natural language is calculated per byte of data sent)
										content = content + " " + utf8.encode(review) + ".";
								}
							});
							const document = {
								language: "en",
								content: content,
								type: "PLAIN_TEXT",
							};
							recurseReviews(
								"*",

								result[0].appid,
								[],
								1000
							).then((data) => {
								const numPoints = 10;
								if (data.length > numPoints) {
									var reviewsBySpread = [];
									var firstDate = data[0].timestamp_created;
									var lastDate = data[data.length - 1].timestamp_created;
									//Number of datapoints wanted
									//Timestamp spread
									var spread = Math.ceil((firstDate - lastDate) / numPoints);
									checkDate = firstDate - spread;

									var count = 1;
									var i = 0;

									//Get reviews seperated by spread
									while (count != numPoints) {
										if (data[i].timestamp_created < checkDate) {
											reviewsBySpread.push(data.splice(0, i + 1));
											count++;
											checkDate -= spread;
											i = 0;
										}
										i++;
									}
									reviewsBySpread.push(data);

									var datapoints = [];
									//Count the number of negative and positive reviews by spread
									for (var i in reviewsBySpread) {
										datapoints[i] = {
											date: firstDate - i * spread,
											positive: 0,
											negative: 0,
										};
										reviewsBySpread[i].forEach((review) => {
											if (review.voted_up) {
												datapoints[i].positive++;
											} else {
												datapoints[i].negative++;
											}
										});
									}

									buildResponse.timeseriesDatapoints = datapoints;
								}
								//Perform entity sentiment analysis and send the response
								client
									.analyzeEntitySentiment({
										document: document,
										encodingType: "UTF8",
									})
									.then((response) => {
										buildResponse.success = true;
										buildResponse.entities = response[0].entities;
										callback(null,buildResponse);
                                	});
							});
						} else {
							buildResponse.best_review = {
								review: response.data.query_summary.review_score_desc,
							};
							buildResponse.success = true;
							callback(null,buildResponse);
						}
					});
				}
			});
		}
	});
};

//function to get reviews given a cursor
function getReviews(cursor, appid) {
	return new Promise((resolve, reject) => {
		axios
			.get(
				`https://store.steampowered.com/appreviews/${appid}?json=1&cursor=${cursor}&num_per_page=100&filter=recent&language=english`
			)
			.then((response) => {
				resolve(response.data);
			});
	});
}

//function to recursively fetch steam app reviews until either:
//1. There are no more reviews
//2. The last review of the fetch response is before the specified date
//3. The reviews array length is greater than max

//Usage:
//cursor - start with "*"
//date - how far back you want to go in unix time
//appid - appid of the app
//reviews - start with empty array []
//max - max number of reviews to be returned
function recurseReviews(cursor, appid, reviews, max) {
	return getReviews(cursor, appid).then((response) => {
		reviews.push(...response.reviews);
		//if there are no more reviews, return the review array
		if (response.reviews.length === 0) {
			return reviews;
		}
		if (reviews.length >= max) {
			//returns the array of reviews if it is before the specified date or if

			return reviews;
		} else {
			//otherwise continue recursing
			return recurseReviews(encodeURIComponent(response.cursor), appid, reviews, max);
		}
	});
}

//Function to escape string for sql query
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
