import React, {Component} from "react";
import "../CSS/AutoComplete.css";

class AutoCompleteComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			preds: props.preds,
		};
		this.handleClick = this.handleClick.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.preds !== this.props.preds) {
			this.setState({preds: this.props.preds});
		}
	}

	handleClick(pred) {
		this.setState({preds: []});
		this.props.itemCallback(pred);
	}

	render() {
		return true ? (
			<div className="autocomplete">
				{this.state.preds.map((pred, index) => {
					return (
						<div
							key={index}
							onClick={() => {
								this.setState({preds: []});
								this.props.itemCallback(pred);
							}}
							className="autocomplete-items">
							<div>
								<p className="item-appname">{pred.appname}</p>
							</div>
						</div>
					);
				})}
			</div>
		) : null;
	}
}

export default AutoCompleteComponent;
