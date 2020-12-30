import { createMemoryHistory } from 'history';

const history = createMemoryHistory({
	hashType: 'slash' // the default
});

export default history;