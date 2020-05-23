import React, {Component} from "react";
import {Container} from "react-bootstrap";
import ReactApexChart from "react-apexcharts";
import WordCloud from "wordcloud";
import {Button} from "react-bootstrap";
import moment from "moment";
class InfographicComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			title: props.match.params.appname,
			type: props.match.params.type,
			entities: props.location.state.entities || [],
			bestReview: props.location.state.bestReview,
			querySummary: props.location.state.querySummary,
			timeseriesDatapoints: props.location.state.timeseriesDatapoints,
			radials: [],
			charts: {},
		};
		this.handleAnotherClick = this.handleAnotherClick.bind(this);
	}

	componentDidMount() {
		this.getWordClouds();
		this.getCharts();
	}

	getCharts() {
		var charts = {
			donut: this.state.querySummary.total_positive ? this.getDonut() : null,
			timeseries: this.state.timeseriesDatapoints ? this.getTimeseries() : null,
		};
		this.setState({charts: charts});
	}

	getDonut() {
		var donut = {
			series: [
				this.state.querySummary.total_positive,
				this.state.querySummary.total_negative,
			],
			options: {
				chart: {
					type: "donut",
                    width: 500,
                    toolbar: { tools: { download: false } }
				},
				colors: ["#6fc2f4", "#ee7071"],
				dataLabels: {
					dropShadow: {
						enabled: false,
					},
				},

				title: {
					text: "All reviews",

					align: "left",
					style: {
						color: "#fff",
					},
				},
				stroke: {
					show: false,
				},
				legend: {
					position: "right",
					labels: {
						colors: ["#fff"],
					},
					itemMargin: {
						horizontal: 5,
					},
				},
				plotOptions: {
					pie: {
						donut: {
							size: "75%",
							color: "#fff",

							labels: {
								value: {
									color: "#fff",
								},
								show: true,
								total: {
									label: this.state.querySummary.review_score_desc + " Reviews",
									showAlways: true,
									show: true,
									color: "#fff",
								},
							},
						},
					},
				},
				labels: ["Positive", "Negative"],

				responsive: [
					{
						breakpoint: 480,
						options: {
							chart: {
								width: 200,
							},
							legend: {
								position: "bottom",
							},
						},
					},
				],
			},
		};

		return donut;
	}

	getTimeseries() {
		var pos = [];
		var neg = [];
		var catas = [];
		var numReviews = 0;
		var perc = [];
		this.state.timeseriesDatapoints.reverse().forEach((point, index) => {
			var date = moment.unix(point.date).utc().format("L LTS");
			catas.push(date);
			numReviews += point.positive + point.negative;
			pos[index] = point.positive;
			neg[index] = point.negative;
			perc[index] = Math.round((point.positive / (point.positive + point.negative)) * 100);
		});

		var timeseries1 = {
			series: [
				{
					name: "Positive",
					data: pos,
				},
				{
					name: "Negative",
					data: neg,
				},
			],
			options: {
				colors: ["#6fc2f4", "#ee7071"],
				chart: {
					height: 500,
					type: "line",
					id: "line",
					group: "timeseries",
					zoom: {
						enabled: false,
                    },
                    toolbar: { tools: { download: false } }
				},
				dataLabels: {
					enabled: false,
				},
				stroke: {
					curve: "straight",
				},
				title: {
					text: `Most Recent ${numReviews} reviews`,
					align: "left",
					style: {
						color: "#fff",
					},
				},
				tooltip: {
					enabled: true,
                    fillSeriesColor: true,
                    x: {
						show: false,
					},
				},
				grid: {
					row: {
						colors: ["#282c34", "#1a1918"], // takes an array which will be repeated on columns
						opacity: 0.4,
					},
				},
				xaxis: {
					categories: catas,
					labels: {
						show: false,
					},
					
				},
				legend: {
					labels: {
						colors: ["#fff"],
					},
				},
				yaxis: {
					labels: {
						style: {
							cssClass: "apexcharts-yaxis-label fill-white",
						},
					},
					title: {
						text: "Number of reviews",
						style: {
							color: "#fff",
						},
					},
				},
			},
		};

		var timeseries2 = {
			series: [
				{
					name: "Percent Positive",
					data: perc,
				},
			],
			options: {
				colors: ["#6fc2f4", "#ee7071"],
				chart: {
					height: 500,
					type: "area",
					id: "area",
					group: "timeseries",
					zoom: {
						enabled: false,
                    },
                    toolbar: { tools: { download: false } }
				},
				dataLabels: {
					enabled: false,
				},
				stroke: {
					curve: "straight",
				},
				title: {
					text: `Most Recent ${numReviews} reviews`,
					align: "left",
					style: {
						color: "#fff",
					},
				},
				tooltip: {
					enabled: true,
					fillSeriesColor: true,
					x: {
						show: false,
					},
				},
				grid: {
					row: {
						colors: ["#282c34", "#1a1918"], // takes an array which will be repeated on columns
						opacity: 0.4,
					},
				},
				xaxis: {
					categories: catas,
					labels: {
						show: false,
					},
				},
				legend: {
					labels: {
						colors: ["#fff"],
					},
				},
				yaxis: {
					title: {
						text: "Percent",
						style: {
							color: "#fff",
						},
					},
					labels: {
						minWidth: 0,
						maxWidth: 100,
						style: {
							cssClass: "apexcharts-yaxis-label fill-white",
						},
					},
				},
			},
		};
		return {line: timeseries1, area: timeseries2};
	}

	getWordClouds() {
		var pos = [];
		var neg = [];
		this.state.entities.forEach((value, key) => {
			var score = value.sentiment * 100;
			if (value.type !== "OTHER") {
				if (value.sentiment > 0.31) {
					pos.push([key, score]);
				} else if (value.sentiment < -0.31) {
					neg.push([key, -score]);
				}
			}
		});

		// if (neg.length === 0) {
		//     neg.push(["No", 0.5])
		//     neg.push(["Negative", 0.7])
		//     neg.push(["Reviews",0.6])
		// }

		var posOptions = {
			list: pos,
			color: "#36aff5",
			minSize: "20px",
			backgroundColor: "transparent",
			wait: 100,
			shape: "square",
		};
		var negOptions = {
			list: neg,
			color: "#fa4b4b",
			minSize: "20px",
			backgroundColor: "transparent",
			wait: 100,
			shape: "square",
		};
		var posCanvas = document.getElementById("positive-wordcloud");
		var negCanvas = document.getElementById("negative-wordcloud");

		posCanvas.width = window.innerWidth / 2.5;
		posCanvas.height = window.innerHeight / 2.5;
		negCanvas.width = window.innerWidth / 2.5;
		negCanvas.height = window.innerHeight / 2.5;
		WordCloud(posCanvas, posOptions);
		WordCloud(negCanvas, negOptions);
	}

	handleAnotherClick() {
		this.props.history.push("/");
	}

	render() {
		return (
			<div>
				<Container fluid className="App-header">
					<h1>{this.state.title}</h1>
					<Container
						fluid
						className="mb-1 w-75"
						style={{backgroundColor: "rgb(32, 35, 41,0.5)", borderRadius: "15px"}}>
						<p>
							{this.state.type === "recent"
								? "Most Recent Review"
								: "Most Helpful Review"}
						</p>
						<p
							className="bestreview"
							style={{height: "100px", fontSize: "15px", overflowY: "auto"}}>
							{" "}
							{this.state.bestReview.review}
						</p>
					</Container>

					<Container fluid className="d-flex align-items-center mb-4">
						<Container className="mr-2 d-flex  flex-column align-items-center box shadow">
							<h3>Positive Aspects</h3>
							<canvas id="positive-wordcloud" />
						</Container>
						<Container className="ml-2 d-flex flex-column align-items-center box shadow">
							<h3>Negative Aspects</h3>
							<canvas id="negative-wordcloud" />
						</Container>
					</Container>

					<Container fluid className="mb-5 d-flex justify-content-center">
						{this.state.charts.donut ? (
							<ReactApexChart
								className="box shadow mr-2"
								options={this.state.charts.donut.options}
								series={this.state.charts.donut.series}
								type="donut"
								width={500}
							/>
						) : null}
						{this.state.charts.timeseries ? (
							<ReactApexChart
								className="text-dark box shadow ml-2 mr-2"
								options={this.state.charts.timeseries.line.options}
								series={this.state.charts.timeseries.line.series}
								type="line"
								width={500}
							/>
						) : null}
						{this.state.charts.timeseries ? (
							<ReactApexChart
								className="text-dark box shadow ml-2"
								options={this.state.charts.timeseries.area.options}
								series={this.state.charts.timeseries.area.series}
								type="area"
								width={500}
							/>
						) : null}
					</Container>

					<Button
						variant="outline-light"
						onClick={this.handleAnotherClick}
						className="fixed-bottom w-25 ml-auto mb-1">
						Search another game
					</Button>
				</Container>
			</div>
		);
	}
}
export default InfographicComponent;
