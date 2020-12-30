const axios = require('axios');
const fs = require('fs');

// PubNub API reference: https://www.pubnub.com/docs/blocks/restful-api


const baseurl = "https://admin.pubnub.com/api/";

// TODO: allow config options to be set from command line

// TODO: add a config for Function name and check it instead of the first block/event_handler

const configProd = {
    loginEmail: process.env.PUBNUB_EMAIL,
    password: process.env.PUBNUB_PASSWORD,
    accountEmail: 'jlevine@esc.games',
    appName: 'ESC',
    //keysetName: 'Demo Keyset',
    keysetName: 'Production',
};

const configQa2 = {
    loginEmail: process.env.PUBNUB_EMAIL,
    password: process.env.PUBNUB_PASSWORD,
    accountEmail: 'jlevine@esc.games',
    appName: 'ESC',
    keysetName: 'qa2',
};

const configTest = {
    loginEmail: process.env.PUBNUB_EMAIL,
    password: process.env.PUBNUB_PASSWORD,
    accountEmail: process.env.PUBNUB_EMAIL,
    appName: 'Aggregator',
    keysetName: 'Aggregator Keyset'
};

const config = configProd ;
//const config = configQa2 ;
//const config = configTest ;

const FunctionFile = './aggregatorFunction.js';


let axiosi = false ;

async function login(email,password) {
    return axios.post(baseurl+'me', {
        email,
        password
    }).then((res) => {
        //console.log(`statusCode: ${res.status}`)
        if (!res.data) {
            console.error("No data received",res);
            return false;
        }
        if (!res.data.result) {
            console.error("No result received",res);
            return false;
        }
        if (!res.data.result.token) {
            console.error("No token received",res);
            return false;
        }
        //console.log("Result: ", res.data.result);
        console.log("Login succeeded.");
        axiosi = axios.create({
            baseURL: baseurl,
            headers: {'X-Session-Token': res.data.result.token}
        });
        return res.data.result;
    }).catch((error) => {
        console.error("Unable to log in",error);
        process.exit(-1);
    });
}

async function simpleGet(instance,url,params) {
    const options = params? {params}: undefined;
    return instance.get(url,options).then(
        (res) => {
            if (!res.data) {
                console.error("No data received", res);
                return false;
            }
            if (!res.data.result) {
                if (res.data.payload) {
                    return res.data.payload ;
                }
                console.error("No result or payload received",res);
                return false;
            }
            return res.data.result;
        }
    ).catch((error) => {
        console.error("Unable to get "+url,params,error);
        return false;
    });
}

async function simplePost(instance,url) {
    return instance.post(url).then(
        (res) => {
            if (!res.data) {
                console.error("No data received", res);
                return false;
            }
            if (!res.data.result) {
                if (res.data.payload) {
                    return res.data.payload ;
                }
                if (res.data.message) {
                    return res.data.message ;
                }
                console.error("No result or payload received",res);
                return false;
            }
            return res.data.result;
        }
    ).catch((error) => {
        console.error("Unable to get "+url,params,error);
        return false;
    });
}

async function simplePut(instance,url,body) {
    return instance.put(url,body).then(
        (res) => {
            if (!res.data) {
                console.error("No data received", res);
                return false;
            }
            if (!res.data.result) {
                if (res.data.payload) {
                    return res.data.payload ;
                }
                if (res.data.message) {
                    return res.data.message ;
                }
                console.error("No result or payload received",res);
                return false;
            }
            return res.data.result;
        }
    ).catch((error) => {
        console.error("Unable to get "+url,body,error.response);
        return false;
    });
}


async function getAccounts(loginResult) {
    return simpleGet(axiosi,'accounts',{
        user_id:loginResult.user.id
    });
}

async function getApps(owner_id) {
    return simpleGet(axiosi,'apps',{
        owner_id
    });
}

async function getBlocks(key) {
    return simpleGet(axiosi,`v1/blocks/key/${key}/block`);
}

async function stopFunction(key,block) {
    return simplePost(axiosi,`v1/blocks/key/${key}/block/${block}/stop`);
}

async function startFunction(key,block) {
    return simplePost(axiosi,`v1/blocks/key/${key}/block/${block}/start`);
}

async function updateFunctionCode(keyId,eventHandler,newCode) {
    const body = {
        type: "before-publish",
        key_id: keyId,
        block_id: eventHandler.block_id,
        id: eventHandler.id,
        channels: eventHandler.channels,
        event: eventHandler.event,
        log_level: eventHandler.log_level,
        name: eventHandler.name,
        output: eventHandler.output,
        code: newCode
    };
    return simplePut(axiosi,`v1/blocks/key/${keyId}/event_handler/${eventHandler.id}`,body);
}

function checkKeysetProperties(keyset) {
    const props = keyset.properties ;
    let errors = 0 ;
    if (!props.blocks) {
        console.error("keyset does not have Functions enabled");
        errors++;
    }
    if (!props.history) {
        console.error("keyset does not have history enabled");
        errors++;
    }
    if (!props.wildcardsubscribe) {
        console.error("keyset does not have wild card subscribe enabled");
        errors++;
    }
    if (errors) {
        process.exit(-1);
    }
}
async function go() {
    let loginResult = await login(config.loginEmail,config.password);
    //console.log("login result",loginResult);
    let accountsResult = await getAccounts(loginResult);
    let accounts = accountsResult["accounts"];
    let account = accounts.find((ac) => {
        return (ac.email === config.accountEmail);
    });
    if (!account) {
        console.log("Could not find account for email "+config.accountEmail,accountsResult);
        process.exit(-1);
    }
    console.log("Found account for email "+config.accountEmail/*,account*/);
    let apps = await getApps(account.id);
    const myApp = apps.find((app)=> {
        return (app.name === config.appName);
    });
    if (!myApp) {
        console.log("Could not find app "+config.appName,apps);
        process.exit(-1);
    }
    console.log("Found app " + config.appName);
    const myKeyset = myApp.keys.find((key)=>key.properties.name === config.keysetName);
    if (!myKeyset) {
        console.log("Could not find keySet " + config.KeysetName);
        process.exit(-1);
    }
    //console.log("Found keySet '"+config.keysetName+"'",myKeyset);
    console.log("Found keySet '"+config.keysetName+"'");
    checkKeysetProperties(myKeyset);

    const blocks = await getBlocks(myKeyset.id);
    //console.log("Blocks: ",blocks);
    //console.log("First block: ",blocks[0]);

    switch (process.argv[2]) {
        case "stop" : {
            const r = await stopFunction(myKeyset.id,blocks[0].id);
            console.log("stopFunction returned ",r);
            break;
        }
        case "start" : {
            const r = await startFunction(myKeyset.id,blocks[0].id);
            console.log("startFunction returned ",r);
            break;
        }
        case "update" : {
            let r = await stopFunction(myKeyset.id,blocks[0].id);
            console.log("stopFunction returned ",r);

            const code = fs.readFileSync(FunctionFile).toString();

            r = await updateFunctionCode(myKeyset.id,blocks[0].event_handlers[0],code);
            console.log("updateFunctionCode returned ",r);

            r = await startFunction(myKeyset.id,blocks[0].id);
            console.log("startFunction returned ",r);

            break;
        }
        default : {
            //console.log("keySet '"+config.keysetName+"'",myKeyset);

        }

    }

    return "OK";
}

go().then((r)=>{console.log("Done",r);});
