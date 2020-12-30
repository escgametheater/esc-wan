import * as config from '../config';
const app = false ;
const hostDB = false ;
const winston = false ;
const appName = "ESC Trivia";
const hostVersion = "0.0.0";

console.log(config);

console.log(`

ESC Trivia Live
             
Version: ${hostVersion}
API Host: ${config.baseUrl}
                                                                            
`);

export {config,app,hostDB,winston,appName,hostVersion};