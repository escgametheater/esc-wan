import React from "react";
import { Container, Row, Col } from "reactstrap";
import get from "lodash/get";

import "./Ad.css";

const Ad = (props) => (
    <Container className="ad-phase">
    	<Row className="justify-content-center">
    		<Col xs="6">
    			<img width="100%" alt="Paris 16 [CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)], via Wikimedia Commons:Blue diamond symbol" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Blue_diamond_symbol.svg/512px-Blue_diamond_symbol.svg.png" />
    		</Col>
    	</Row>
    	<Row>
    		<Col>
    			<h1>Buy some ESC Diamonds!</h1>
    			<p>Only $1.99 for 10</p>
    		</Col>
    	</Row>
    </Container>
);

export default Ad;