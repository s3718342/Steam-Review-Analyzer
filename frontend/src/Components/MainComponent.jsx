import React, {Component} from "react";
import {Container} from "react-bootstrap";
import TitleInputComponent from "./TitleInputComponent.jsx";
import axios from "axios";
import API_URL from "../constants.js"

class MainComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			clicked: true,
			preds: [],
			showError: false,
			searching: false,
			page: "home",
		};
		this.handleClick = this.handleClick.bind(this);
		this.handleSearch = this.handleSearch.bind(this);
		this.handlePred = this.handlePred.bind(this);
	}

	handleClick() {
		if (this.state.page === "home") {
			this.setState({page: "info"});
		} else {
			this.setState({page: "search"});
		}
	}

	handleSearch(title, type) {
		this.setState({showError: false, searching: true});
		axios.get(`${API_URL}/getdata?title=${title}&type=${type}`).then((response) => {
			if (response.data.success) {
				var entities = [];
				if (response.data.entities) {
					entities = this.parseEntities(response.data.entities);
				}

				this.props.history.push({
					pathname: `/${title}/${type}`,
					state: {
						entities: entities,
						bestReview: response.data.best_review,
						querySummary: response.data.query_summary,
						timeseriesDatapoints: response.data.timeseriesDatapoints,
					},
				});
			} else {
				this.setState({showError: true, searching: false});
			}
		});
	}

	parseEntities(entities) {
		var entityMap = new Map();
		//Join all entities with the same name
		//Extract and average noteworth data

		entities.forEach((entity) => {
			var name = entity.name;
			if (entityMap.has(name)) {
				const oldEnt = entityMap.get(name);
				entityMap.set(name, {
					sentiment: (oldEnt.sentiment + entity.sentiment.score) / 2,
					magnitude: (oldEnt.magnitude + entity.sentiment.magnitude) / 2,
					mentions: oldEnt.mentions + entity.mentions.length,
					salience: (oldEnt.salience + entity.salience) / 2,
				});
			} else {
				entityMap.set(name, {
					sentiment: entity.sentiment.score,
					magnitude: entity.sentiment.magnitude,
					mentions: entity.mentions.length,
					salience: entity.salience,
					type: entity.type,
				});
			}
		});

		//Remove all entities with value 0 (has no opinion)
		entityMap.forEach((value, key) => {
			if (value === 0) {
				entityMap.delete(key);
			}
		});

		return entityMap;
	}

	handlePred(preds) {
		this.setState({preds: preds});
	}

	renderSwitch() {
		switch (this.state.page) {
			case "home":
				return (
					<Container onClick={this.handleClick} fluid className="App-header">
						<h1>Welcome to Steam App Review Analyzer</h1>

						<i className="chev-down fas fa-chevron-down"></i>
					</Container>
				);
			case "info":
				return (
					<Container onClick={this.handleClick} fluid className="App-header">
						<h2>
							Find out the most loved and hated aspects of your favourite, or least
							favourite, games instantly.
						</h2>
						<h5>
							Our algorithm performs Google's Natural Language API entity sentiment
							analysis on up to 100 of the most helpful or most recent reviews.
						</h5>
						<h5>
							The algorithm also looks at the most recent 1000 reviews to see how
							people's opinions have changed.
						</h5>
						<i className="chev-down fas fa-chevron-down"></i>
					</Container>
				);
			case "search":
				return (
					<Container onClick={this.handleClick} fluid className="App-header">
						<p className="text-center">
							Enter the name of any steam game to see what people think <br></br>
							about recent updates
						</p>
						<TitleInputComponent
							debounce={1000}
							predCallback={this.handlePred}
							handleSearch={this.handleSearch}
							searching={this.state.searching}
						/>
						{this.state.showError ? (
							<h6 className="text-danger">Title was not found</h6>
						) : null}
						<small className="mt-3"style={{fontSize: "15px"}}>
							Note: Often times filtering by recent will result in poor results.
						</small>
					</Container>
				);
		}
	}

	render() {
		return (
			<div>
				{this.renderSwitch()}
				<footer style={{fontSize: "15px"}} className="text-light fixed-bottom bg-dark text-center">
					Copyright © 2020 Steam App Review Analyzer
				</footer>
			</div>
		);
	}
}
export default MainComponent;
