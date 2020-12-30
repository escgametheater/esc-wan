import React from "react";
import { Container, Row, Col, Button } from "reactstrap";
import get from "lodash/get";

import { QuestionView } from "./Question";

import "./Answer.css";

const Answer = ({
		round,
		answers=[],
		text,
		...props
	}) => (
    <Container className="answer-phase">
    	<QuestionView
    		{...props}
    		answers={ answers.map(a => a.id === get(round, 'answerId', -1) ? { ...a, selected: true } : a ) }
            header={(
            	<React.Fragment>
	                <h1>{text}</h1>
	                <h2>A: {get(answers.find(a => a.correct), 'text', '')}</h2>
                </React.Fragment>
            )}
    		graded
    		answered
    	/>
    </Container>
);

export default Answer;