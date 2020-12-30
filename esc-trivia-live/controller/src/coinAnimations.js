function animateCoinAwards(coins) {
    coins.forEach((c)=> {
        c = parseInt(c);
        if (c <= 10) {
            animateCoin(c,5000);
        }
        else {
            const denom = Math.max(10,c/100);
            for (let i = 0 ; i < c/denom ; i++) {
                setTimeout(()=> {
                    animateCoin(denom,5000);
                },i*100);
            }
        }

    });
}

function circleDiv(radius,x,y) {
    const el = document.createElement("DIV");
    el.style.width = `calc(2 * ${radius}` ;
    el.style.height = `calc(2 * ${radius}` ;
    el.style.borderRadius = "50%";
    el.style.position = "fixed";
    el.style.zIndex = "1000";
    el.style.left = `calc(${x} - ${radius})` ;
    el.style.bottom = `calc(${y} - ${radius})` ;
    el.style.backgroundColor = `gold` ;
    el.style.border = `2px solid #ffff00` ;
    return el ;
}
function centeredDiv() {
    const el = document.createElement("DIV");
    el.style.position = "absolute";
    el.style.top = "50%" ;
    el.style.left = "50%" ;
    el.style.transform = "translateY(-50%) translateX(-50%)";
    el.style.zIndex = "1001";
    return el ;
}

function animateCoin(coin,duration) {
    const coinEl = circleDiv("5vmax",`${Math.random()*100}vw`,"105vh");
    const textDiv = centeredDiv();
    textDiv.innerHTML = "" + coin ;
    textDiv.style.fontSize = "1vmax" ;
    coinEl.appendChild(textDiv);
    document.body.appendChild(coinEl);
    const newSizeW = 0.75 * coinEl.offsetWidth / textDiv.offsetWidth ;
    const newSizeH = 0.75 * coinEl.offsetHeight / textDiv.offsetHeight ;
    const newSize = Math.min(newSizeH,newSizeW);
    textDiv.style.fontSize = `${newSize}vmax`;
    coinEl.style.transition = "all 0.75s ease-in";
    coinEl.style.bottom = "0";

    setTimeout(() => {
        coinEl.remove();
    },duration);
}

// Added to global scope to allow testing from the console
window.circleDiv = circleDiv;
window.centeredDiv = centeredDiv;
window.animateCoin = animateCoin;
window.animateCoinAwards = animateCoinAwards;

export {animateCoinAwards} ;
