import history from "./history";
import {
	PHASE_GET_READY,
	PHASE_QUESTION,
} from "Common/constants";

const isPlayPhase = phase => phase.startsWith("play");

/**
 * Converts a phase into History
 */
const phaseChangeRouter = (phase, state) => {
	if (!phase) {
		console.log("Possible error, phaseChangeRouter called but no phase: ",{phase,state});
		return ;
	}
	// return;
	const location = {
		pathname: "/" + phase,
	};

	// Not play phase? push route
	if (!isPlayPhase(phase)) {
		console.log('phaseChangeRouter: New history', phase, location);
		history.push(location);
		return;
	}

    if (!state) {
        console.log("Possible error, phaseChangeRouter called but no state: ",{phase,state},new Error("phaseChangeRouter called but no state"));
        return ;
    }

    // Play phase and not playing? block routing
	if (state.isPlaying) {
        console.log('phaseChangeRouter: isPlayPhase but not playing', phase, location);
		return;
	}
	
	const shouldContinueToPlayPhase = !state.holdUntilNextRound || phase === PHASE_GET_READY || phase === PHASE_QUESTION;
	if (!shouldContinueToPlayPhase) {
        console.log('phaseChangeRouter: !shouldContinueToPlayPhase', phase, location, state);
		return;
	}

    console.log('phaseChangeRouter: replacing location', phase, location, state);

    // Play phase, playing, and no hold? replace route (avoid ugly back button hell)
	history.replace(location);
};

export default phaseChangeRouter;
