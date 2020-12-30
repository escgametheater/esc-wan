const genericReducer = (state, action) => {
	console.log('Generic Reducer', state, action.value, {
		...state,
		...action.value,
	});
	
	// Merge our current state, with the new event state
	return {
		...state,
		...action.value,
	};
};

export default genericReducer;