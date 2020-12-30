import React from "react";
import { Container, Row, Col } from "reactstrap";

const Leaderboard = (props) => {
    console.log("Leaderboard:",props);
    const leaders = props.leaders || [];
    return (
        <Row className="leaderboard-view justify-content-center">
            <Col xs="10" className="leaderboard-container">
                <Row key={"leaderboard"}>
                    <Col>
                        Leaderboard
                    </Col>
                </Row>
                {leaders.map((leader,i) => (
                    <Row key={"leader"+i}>
                        <Col>
                            {leader.initials}
                        </Col>
                        <Col>
                            {leader.score}
                        </Col>
                    </Row>
                ))}

            </Col>
        </Row>
    );
};

export default Leaderboard;