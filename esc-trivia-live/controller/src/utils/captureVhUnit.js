import {CONTROLLER_SCREEN_ORIENTATION, ScreenManager} from "@esc_games/esc-controller-sdk/input";
import { ESC_TRIVIA_LIVE } from "Common/constants";

// Notes:
// 1. Can't switch just on "landscape-primary" -- must also check for "landscape-secondary"
//    (Same thing for portrait on some devices -- phones often don't allow portrait-secondary but tablets do).
//    Instead, you can just use Math.max(window.innerWidth,window.innerHeight)
// 2. On iOS, innerWidth and innerHeight changes when user zooms. This might or might not be desirable
// 3. Objects using this unit will change size or move when the phone is rotated or the address bar hides. When the phone is used as
//    a game controller, it may be undesirable to have buttons or other UI move around on the screen.
// 4. Calling this vh when it's not will lead to confusion. Rename this something like innerMax
// 5. If this is only used to make sure that a div uses exactly the full visible height in portrait and width in landscape,
//    why not use "position:fixed; top:0; bottom:0;" in portrait and "position:fixed; right:0; left:0;" in landscape?
//    Or we can use these classes that esc-controller-sdk already handles: left-visible, right-visible, top-visible, bottom-visible

// Captures the vh unit while accounting for the height of the address bar (vmax doesn't account for the address bar)
const updateCalculatedVh = (size = window.innerHeight) => {
    window.requestAnimationFrame(() => {
        const vh = size * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
};

// Initializes the event handler to capture the vh unit
export default () => {
    ScreenManager.registerEventHandler(CONTROLLER_SCREEN_ORIENTATION, ESC_TRIVIA_LIVE, () => {
        const size = Math.max(window.innerWidth,window.innerHeight) ;

        updateCalculatedVh(size);
    });
};

/*

// Another possibility:

let lastSize = 0 ;

const updateCalculatedVh = () => {
    window.requestAnimationFrame(() => {
        const size = Math.max(window.innerWidth,window.innerHeight) ;
        if (lastSize === size) {
            return ;
        }
        lastSize = size ;
        const vh = size * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        updateCalculatedVh();
    });
};

export default updateCalculatedVh ;
*/