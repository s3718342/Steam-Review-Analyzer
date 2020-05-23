import React, {Component} from "react";
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import MainComponent from "./MainComponent";
import InfographicComponent from "./InfographicComponent";
import ErrorComponent from "./ErrorComponent";
class RouterComponent extends Component {
	render() {
		return (
			<div className="RouterComponent">
				<Router>
					<>
						<Switch>
							<Route path="/" exact component={MainComponent} />
							<Route path="/:appname/:type" exact component={InfographicComponent} />

							<Route component={ErrorComponent} />
						</Switch>
					</>
				</Router>
			</div>
		);
	}
}
export default RouterComponent;
