import React from 'react';
import ReactDOM from 'react-dom';
import { ESCGameController } from '@esc_games/esc-controller-sdk/';
import ESCTriviaLive from './ESCTriviaLive';

ReactDOM.render(
	<ESCGameController 
		game="ESCTriviaLive"
		includeESCLogo={false}
		includeTattooDisplay={false}
		includeTattooSelector={false}
		desiredOrientation={"portrait"}
		autoSizeEnabled={true}
		appModeEnabled={true}
		nosleep={true}
	>
		<ESCTriviaLive/>
	</ESCGameController>,
	document.getElementById('root')
);

module.hot.accept();