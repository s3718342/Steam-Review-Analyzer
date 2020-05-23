import React, {Component} from "react";
import {DropdownButton, Dropdown, InputGroup, Button, FormControl, Spinner} from "react-bootstrap";
import axios from "axios";
import debounce from "debounce";
import AutoCompleteComponent from "./AutoCompleteComponent.jsx";
import API_URL from "../constants.js"

class TitleInputComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			title: "",
			preds: [],
			item: null,
			showAutocomplete: false,
			searching: props.searching,
			type: "all",
		};
		this.handleSearch = this.handleSearch.bind(this);
		this.debouncedGetPredictions = debounce(this.getPredictions, this.props.debounce);
		this.handleItemClick = this.handleItemClick.bind(this);
		this.handleTypeSelect = this.handleTypeSelect.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.searching !== this.props.searching) {
			this.setState({searching: this.props.searching});
		}
	}

	handleSearch() {
		this.setState({searching: true});
		if (this.state.title.length > 0) {
			this.props.handleSearch(this.state.title, this.state.type);
		}
	}
	componentDidMount() {
		document.getElementById("title-input").addEventListener("keyup", function (event) {
			event.preventDefault();
			if (event.keyCode === 13) {
				document.getElementById("search-button").click();
			}
		});
	}

	getPredictions(value) {
		if (value.length > 0) {
			axios.get(`${API_URL}/autocomplete?input=${encodeURIComponent(value)}`, {mode: 'no-cors'}).then((response) => {
				//this.props.predCallback(response.data);
				this.setState({preds: response.data});
			});
		}
	}

	handleChange(event) {
		const {name: fieldName, value} = event.target;
		this.setState({
			[fieldName]: value,
		});

		this.debouncedGetPredictions(value);
	}

	handleItemClick(item) {
		this.setState({title: item.appname, item: item});
	}

	handleTypeSelect(event) {
		this.setState({type: event.currentTarget.name});
	}

	render() {
		return (
			<div>
				<InputGroup className="mb-0" style={{width: "500px"}}>
					<FormControl
						style={{
							borderBottomLeftRadius: 0,
							borderBottomRightRadius: 0,
						}}
						className="shadow-none"
						autoComplete="off"
						placeholder="Game Title"
						aria-label="Game Title"
						id="title-input"
						name="title"
						value={this.state.title}
						onChange={this.handleChange.bind(this)}
					/>

					<DropdownButton
						variant="outline-secondary"
						className="shadow-none"
						title="Filter by"
						as={InputGroup.Append}>
						<Dropdown.Item name="all" onClick={this.handleTypeSelect}>
							Helpful
						</Dropdown.Item>
						<Dropdown.Item name="recent" onClick={this.handleTypeSelect}>
							Recent
						</Dropdown.Item>
					</DropdownButton>

					<InputGroup.Append>
						<Button
							style={{borderBottomRightRadius: 0}}
							id="search-button"
							onClick={this.handleSearch}
							variant="outline-secondary">
							{this.state.searching ? (
								<Spinner animation="border" variant="info" size="sm" />
							) : (
								<i className="fas fa-search"></i>
							)}
						</Button>
					</InputGroup.Append>
				</InputGroup>

				<AutoCompleteComponent
					show={this.state.showAutocomplete}
					itemCallback={this.handleItemClick}
					preds={this.state.preds}
				/>
			</div>
		);
	}
}
TitleInputComponent.defaultProps = {
	debounce: 200,
};

export default TitleInputComponent;
