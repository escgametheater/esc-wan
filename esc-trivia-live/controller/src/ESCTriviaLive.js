import React, {PureComponent} from 'react';
import { Container, Row, Col } from "reactstrap";

// ***********************************************************
// Warning about importing from "@esc_games/esc-react-redux":
// When linking to test a local "@esc_games/esc-controller-sdk" there will be two different esc-react-redux modules
// and two stores. This store won't have anything in it!
//import {store} from "@esc_games/esc-react-redux";
// **********************************************************
import {ESCManager, EventManager, ReducerManager} from "@esc_games/esc-controller-sdk";
import {Router, Route, Switch} from "react-router-dom";

// Phases that your controller responds to
import * as PhaseComponents from "./phaseComponents";
import * as Constants from "Common/constants";

// Events that are fired from the Controller, and cause the UI to update
import {
    ACTION_PHASE_CHANGED,
    ACTION_ROUTE_TO_GET_READY,
    ACTION_RECORD_ANSWER,
} from "./UIEvents";

// State reducers that handle actions which are fired within the controller
import * as reducers from "./reducers";

import history from "./history";
import phaseChangeRouter from "./phaseChangeRouter";
import captureVhUnit from "./utils/captureVhUnit";

import "bootstrap/dist/css/bootstrap.min.css";
import "./ESCTriviaLive.css";

import {startCoinSubscriber} from './coinSubscriber' ;
import {animateCoinAwards} from "./coinAnimations";

startCoinSubscriber(window.esc.page.pub_nub_config,window.esc.global.user.guest_entity.guest_hash, (coins)=> {
    console.log ("Coins received: ", coins);
    animateCoinAwards(coins);
});

captureVhUnit();

// The initial state of the application
const initialState = {
    isPlaying: false,
    phaseStats: {
        // Show the Welcome phase first
        phase: Constants.PHASE_GET_READY,
    }
};

// Setup our reducers to handle dispatched UI actions
const reducerManager = new ReducerManager({
    [ACTION_PHASE_CHANGED]: reducers.phaseChanged,
    [ACTION_ROUTE_TO_GET_READY]: reducers.genericReducer,
    [ACTION_RECORD_ANSWER]: reducers.genericReducer,
}, initialState);

// Create an event manager to handle system events
const ControllerManager = new EventManager('Controller', reducerManager);

// Add an event listener for the UC_PHASE_CHANGE event, and dispatch the UI event
ESCManager.networking.registerEventHandler(Constants.UC_PHASE_CHANGE, Constants.ESC_TRIVIA_LIVE, (message) => {
    phaseChangeRouter(message.phaseStats.phase, ControllerManager.store.getState()['Manager:Controller']);
    console.log("message", message);
    ControllerManager.dispatchUI(ACTION_PHASE_CHANGED, message);
});

/**
 * Offline Controllers
 */
const OC_STATUS_UPDATE = "offline-game-update";
ESCManager.networking.registerEventHandler(OC_STATUS_UPDATE, Constants.ESC_TRIVIA_LIVE, (message) => {
    if (message.data.next_url) {
        if (window.location.href === message.data.next_url) {
            window.location.reload();
        } else {
            window.location.href = message.data.next_url;
        }
    }
});

const submitAnswer = (questionId, answerId) => {
    console.log(`submitAnswer `,{questionId, answerId});

    ESCManager.networking.sendCommand(Constants.CU_ANSWER, {
        questionId,
        answerId,
        guestHash: window.esc.global.user.guest_entity.guest_hash,
    });

    ControllerManager.dispatchUI(ACTION_RECORD_ANSWER, {
        round: {
            questionId,
            answerId,
        },
    });
};

const resetRecordedAnswer = () => {
    ControllerManager.dispatchUI(ACTION_RECORD_ANSWER, {
        round: {},
    });
}

const routeToGetReady = () => {
    ControllerManager.dispatchUI(ACTION_ROUTE_TO_GET_READY, {
        // Trigger ready to play state
        isPlaying: true,
        holdUntilNextRound: false,
    });

    // Trigger route to get ready
    phaseChangeRouter(Constants.PHASE_GET_READY, {isPlaying:true});
};

history.listen((location, action) => {
    if (!!~location.pathname.indexOf(Constants.PHASE_GET_READY)) {
        resetRecordedAnswer();
    }
});

// const withBaseReset = RouterComponent => {
//     const base = document.querySelector('base');
//     let baseOrigHref;
//     if (base) {
//         baseOrigHref = base.href;
//         base.href = location.pathname;
//     }

//     return class BaseResetFeature extends PureComponent {
//         componentDidMount() {
//             // if (base) {
//             //     base.href = baseOrigHref;
//             // }

//             console.log('Mounted');
//             debugger;
//             phaseChangeRouter(Constants.PHASE_WELCOME, {});
//         }

//         render() {
//             return <RouterComponent {...this.props} />
//         }
//     }
// };

// const BaseResetRouter = withBaseReset(Router);

class ESCTriviaLiveComponent extends PureComponent {
    componentDidMount() {
        // Trigger initial phase
        phaseChangeRouter(Constants.PHASE_WELCOME, {});
    }
    render() {
        // const phaseStats = {
        //     phase: "play-question",
        //     questionId: 285,
        //     text: 'How many letters are there in ESC?',
        //     answers: [{
        //         id: 1,
        //         text: "Five",
        //         answerCount: 1,
        //     }, {
        //         id: 2,
        //         text: "Seven",
        //         answerCount: 10,
        //     }, {
        //         id: 3,
        //         text: "Three",
        //         answerCount: 1,
        //         correct: true,
        //     }]
        // }

        const {phaseStats} = this.props;
        const {phase} = phaseStats;

        console.log('ESCTriviaLiveComponent:\n', phase, phaseStats, history);

        const { round } = this.props;
        // const round = {
        //     questionId: 285,
        //     answerId: 1,
        // };

        return (
            <React.Fragment>
            <Row>
                <Col>
                    <div className="esc-header"></div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Router history={history}>
                        <Switch>
                            <Route path={"/" + Constants.PHASE_WELCOME} render={() => <PhaseComponents.Welcome phaseStats={phaseStats} onClickStart={routeToGetReady} />}/>
                            <Route path={"/" + Constants.PHASE_GET_READY} render={() => <PhaseComponents.GetReady phaseStats={phaseStats} />}/>
                            <Route path={"/" + Constants.PHASE_QUESTION} render={() => <PhaseComponents.Question submitAnswer={submitAnswer} {...phaseStats} round={round} />}/>
                            <Route path={"/" + Constants.PHASE_ANSWER} render={() => <PhaseComponents.Answer {...phaseStats} round={round} />}/>
                            <Route path={"/" + Constants.PHASE_AD} render={() => <PhaseComponents.Ad phaseStats={phaseStats} />}/>
                            <Route path={"/" + Constants.PHASE_LEADERBOARD} render={() => <PhaseComponents.Leaderboard leaders={phaseStats.leaders}/>}/>
                            <Route render={(a, b) => {console.log(a, b); return <div>No match</div>}}/>
                        </Switch>
                    </Router>
                </Col>
            </Row>
            </React.Fragment>
        );
    }
}

// Export the base controller. This is useful for testing/debugging
export {ESCTriviaLiveComponent};

// Connect controller to the potential UI actions. This causes the controller to respond to the specified actions, and render
export default ControllerManager.connect(ESCTriviaLiveComponent, [
    ACTION_PHASE_CHANGED,
    ACTION_ROUTE_TO_GET_READY,
    ACTION_RECORD_ANSWER,
]);
