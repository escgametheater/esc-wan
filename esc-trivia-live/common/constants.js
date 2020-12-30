const GAME_ID = "Controller";
const ESC_TRIVIA_LIVE = "esc-trivia-live:" + GAME_ID;

const PHASE_WELCOME = "welcome";
const PHASE_GET_READY = "play-get-ready";
const PHASE_QUESTION= "play-question";
const PHASE_ANSWER_BUFFER = "play-answer-buffer";
const PHASE_ANSWER = "play-answer";
const PHASE_AD = "play-ad";
const PHASE_LEADERBOARD = "play-leaderboard";

const UC_PHASE_CHANGE = "UC_PhaseChange";
const CU_ANSWER = "Answer";
const RELOAD_CONTROLLER = "Reload";

const DB_SEPARATOR = ".";

module.exports = {
	GAME_ID,
	ESC_TRIVIA_LIVE,

    PHASE_WELCOME,
    PHASE_GET_READY,
    PHASE_QUESTION,
    PHASE_ANSWER_BUFFER,
    PHASE_ANSWER,
    PHASE_AD,
    PHASE_LEADERBOARD,

    UC_PHASE_CHANGE,
    CU_ANSWER,
    RELOAD_CONTROLLER,

    DB_SEPARATOR,
};
