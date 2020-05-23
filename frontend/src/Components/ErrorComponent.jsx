import React, {Component} from "react";
import {Button} from "react-bootstrap"
import { Link } from "react-router-dom";
class ErrorComponent extends Component {
	render() {
        return <div className="App-header">
            <h1>404 error</h1>
            <h2>This page doesn't exist.</h2>
            <Button variant="primary" as={Link} to="/">Go to homepage</Button>
        </div>;
	}
}
export default ErrorComponent;
