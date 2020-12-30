import {ESCManager} from "@esc_games/esc-controller-sdk/";
import {getCoinsChannel} from "@esc_games/esc-controller-sdk/networking/pubnubConnection";

const itemSeparatorChar = "_" ;
const arraySeparatorChar = "~" ;

function splitStringIntoArrayOfArrays(s,itemSep,arraySep) {
    const all = s.split(arraySep);
    all.forEach(function(a,i) {
        all[i] = a.split(itemSep).slice(1,-1);
    });
    return all;
}

export const startCoinSubscriber = (pubNubConfig,guestHash,coinHandler) => {
    const coinGuestHashFilter = `ids contains '_${guestHash.slice(0,6)}'`;
    const coinsChannel = getCoinsChannel();
    console.log("startCoinSubscriber for guestHash "+guestHash,pubNubConfig);

    return ESCManager.networking.startSubscriber([coinsChannel],pubNubConfig,(msg)=> {
        console.log("Received coin message\n",msg);
        let meta = msg.userMetadata ;
        if (!meta) {
            console.error("Coins message received but no userMetaData");
            return ;
        }
        if (!meta.ids) {
            console.error("Coins message received but no userMetaData.ids");
            return ;
        }
        if (!meta.coins) {
            console.error("Coins message received but no userMetaData.coins");
            return ;
        }
        const ids = splitStringIntoArrayOfArrays(meta.ids,itemSeparatorChar,arraySeparatorChar);
        const coins = splitStringIntoArrayOfArrays(meta.coins,itemSeparatorChar,arraySeparatorChar);
        const myCoinAwards = [];
        ids.forEach((idArray,i) => {
            idArray.forEach((id)=> {
                if (guestHash.startsWith(id)) {
                    myCoinAwards.push(coins[i][0]);
                }
            });
        });
        //console.log("coins: "+JSON.stringify(coins));
        //console.log("ids: "+JSON.stringify(ids));
        //console.log("myCoinAwards: " + JSON.stringify(myCoinAwards));
        // Get my coins from the meta message

        if (coinHandler) {
            coinHandler(myCoinAwards);
        }

    },coinGuestHashFilter);
};
