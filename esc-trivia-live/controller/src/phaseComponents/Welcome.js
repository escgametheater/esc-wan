import React from "react";
import { Container, Row, Col, Button } from "reactstrap";

import Logo from "../images/esc-trivia-logo.svg";
import "./Welcome.css";

const Welcome = ({onClickStart, ...props}) => (
	<div className="welcome-phase">
		<Container>
			<Row className="justify-content-center">
				<Col xs="3">
					<Logo />
				</Col>
			</Row>
			<Row>
				<Col>
					<h1>ESC Trivia Live</h1>
				</Col>
			</Row>
			<Row>
				<Col>
					<Button onClick={onClickStart} color="primary">Play Now</Button>
				</Col>
			</Row>
		</Container>
	</div>
);

export default Welcome;