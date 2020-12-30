import React from "react";
import { Container, Row, Col, Button } from "reactstrap";
import get from "lodash/get";
import noop from "lodash/noop";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
 
import "./Question.css";

export const QuestionView = ({
    text,
    answers=[],
    questionId,
    header,
    submitAnswer=noop,
    answered=false,
    graded=false,
}) => (
    <Row className="question-view justify-content-center">
        <Col xs="10" className="question-container">
            <Row>
                <Col>
                    {header}
                </Col>
            </Row>
            {answers.map((answer) => {
                // Not answered not selected
                let buttonColor = "secondary";
                let buttonIcon = null;

                // Answered, not graded
                if (answered && answer.selected && !graded) {
                    buttonColor = "light";
                    buttonIcon = <FontAwesomeIcon icon={faCheckCircle} />;
                }
                // Answered and graded correct
                else if (answered && graded && answer.correct) {
                    buttonColor = "success";
                    if (answer.selected) {
                        buttonIcon = <FontAwesomeIcon icon={faCheckCircle} />;
                    }
                }
                // Answered and graded, selected answer incorrect
                else if (answered && answer.selected && graded && !answer.correct) {
                    buttonColor = "danger";
                    buttonIcon = <FontAwesomeIcon icon={faTimesCircle} />;
                }

                return (
                    <Row key={answer.id}>
                        <Col>
                            <Button
                                size="lg"
                                block
                                onClick={(e) => {e.preventDefault(); !graded && submitAnswer(questionId, answer.id)}}
                                color={buttonColor}
                            >
                                {buttonIcon}
                                {answer.text}
                            </Button>
                        </Col>
                    </Row>
                );
            }
            )}
        </Col>
    </Row>
);

const UnAnsweredQuestion = (props) => (
    <QuestionView
        {...props}
        header={(
            <h1>{props.text}</h1>
        )}
    />
);

const AnsweredQuestion = ({
    answers,
    round,
    ...props,
}) => (
    <React.Fragment>
        <QuestionView
            {...props}
            header={(
                <h1>{props.text}</h1>
            )}
            answers={ answers.map(a => a.id === round.answerId ? { ...a, selected: true } : a ) }
            answered
        />
        <Row>
            <Col>
                <h2>Determining winners...</h2>
            </Col>
        </Row>
    </React.Fragment>
);

const Question = ({
    round,
    ...props,
}) => {
    const answered = get(round, 'answerId', false);
    //console.log("Question: props\n",props);
    const progressSpeed = props.phaseDuration > 0 ? props.phaseDuration : 8 ;

    return (
        <Container className="question-phase">
            <Row className="justify-content-center">
                <Col xs="10" className="clock-container">
                    <div className="clock-progress" style={{animation: `move ${progressSpeed}s linear forwards`}}> </div>
                </Col>
            </Row>
            {answered ? (<AnsweredQuestion {...props} round={round} />) : (<UnAnsweredQuestion {...props} />)}
        </Container>
    );
};

export default Question;
