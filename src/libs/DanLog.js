/*  LogManager.jsx
    Handles storing log data from the game, and sending it to the server on a regular basis
    For the game Settlers & Walords
*/

import { DAX } from "./DanAjax.js";

let readied = []; // This will contain all the log entries we have generated
let serverPath = '';

export const DanLog = {
    setup: (newServerPath) =>{
        // Sets the path to send log data to. Call this at the start of your app
        serverPath = newServerPath;

        // Now, set an interval to send new content every 5 seconds
        setInterval(()=>{
            if(readied.length===0) return;  // Don't bother sending a message if there's nothing to send
            if(serverPath==='') return; // There's no where to send the logs anyway...
            
            fetch(serverPath, DAX.serverMessage({logs:readied}, false))
                .then(res=>DAX.manageResponseConversion(res))
                .catch(err => console.log(err))
                .then(data => {
                    if(data.result!=='success') {
                        console.log('Error sending log data:', data);
                    }
                });
            // As this is sending, flush the readied logs list
            readied = [];
        }, 5000);
    },

    add: (codeLocation, logClass, logContent) => {
        readied.push({codeSpot:codeLocation, grouping:logClass, happens: new Date().toISOString().slice(0,19).replace('T', ' '), ...logContent});
    }
};
// There's something rather nice about stand-alone, self-managed components...

