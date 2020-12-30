import { PHASE_GET_READY } from "Common/constants";

const phaseChangedReducer = (state, action) => {
	const phase = action.value.phaseStats.phase;
	let newState = {
		...state,
	};

	// If we're holding until the next round
	if (state.holdUntilNextRound && phase === PHASE_GET_READY) {
		console.log('Resetting round');
		newState.holdUntilNextRound = false;
	}
	newState = {
        ...state,
        ...action.value,
    };
	console.log("phaseChangedReducer",{newState});
	return newState;
};

export default phaseChangedReducer;